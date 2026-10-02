/**
 * Poem generation.
 *
 * The prompt and the response parsing live here, free of any runtime, so the
 * Cloudflare Worker and the local dev server share exactly the same behaviour.
 * The AI call is server-side only: the API key must never reach the browser.
 *
 * Everything sits behind a single `PoemGenerator` interface. Two
 * implementations exist: a Cloudflare Workers AI binding (`env.AI`) and any
 * OpenAI-compatible HTTP endpoint. `poem-api.ts` picks the binding when the
 * Worker has one and falls back to the HTTP endpoint otherwise.
 *
 * Both implementations stream: they yield the model's reply as raw text deltas,
 * and `streamPoem` turns those into whole lines. The client never sees partial
 * words or tokens.
 */
import poemStyles, { type PoemStyleNames } from "./poem-styles";
import { type PoemFormsNames } from "./poem-forms";

/** What every poem generator returns. */
export interface Poem {
  /** The model id that produced the poem. */
  ai: string;
  title: string;
  body: string;
}

/**
 * The one interface the API depends on. Implementations are built by the
 * factories below; nothing outside this file knows how inference happens.
 */
export interface PoemGenerator {
  /** The model id reported back to the client. */
  readonly model: string;
  /**
   * Stream the model's reply as raw text deltas (roughly token by token).
   * Callers must not show these verbatim — `PoemStreamParser` turns them into
   * whole lines first.
   */
  stream(
    image: string,
    form: PoemFormsNames,
    style: PoemStyleNames,
  ): AsyncIterable<string>;
}

/** Config for the OpenAI-compatible HTTP implementation. */
export interface PoemSourceEnv {
  /** Full URL of an OpenAI-compatible chat-completions endpoint. */
  endpoint: string;
  apiKey: string;
  /** Vision-capable model id; defaults to a small, cheap model. */
  model?: string;
}

/**
 * Minimal structural type for the Workers AI binding. Declared here instead of
 * importing `@cloudflare/workers-types`, which clashes with the DOM lib on the
 * Astro/React side of the repo.
 */
export interface WorkersAiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

export class PoemSourceError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "PoemSourceError";
    this.status = status;
  }
}

/**
 * Upper bound on the model's reply, in tokens. Sized to fit a ~5,000-character
 * poem (roughly 1,250 tokens) and still leave plenty of room for reasoning
 * models (e.g. Gemma 4) that think before they write. This is only a cap — the
 * model stops as soon as it is finished.
 */
const MAX_RESPONSE_TOKENS = 8192;

/**
 * How long to wait for the HTTP implementation. Applied to the whole request
 * (headers *and* body), so it has to be generous enough for a streamed poem
 * plus any reasoning.
 */
const REQUEST_TIMEOUT_MS = 120_000;

/** Default model for the HTTP (OpenAI-compatible) implementation. */
const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Default model for the Workers AI implementation: a vision-capable model
 * available on the Workers Free plan. Override with `AI_MODEL`.
 */
export const DEFAULT_WORKERS_AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";

export function buildPrompt(
  form: PoemFormsNames,
  style: PoemStyleNames,
): string {
  let template = `You are a photo to ${form} printer. You will be given a picture from the user, you need to return a short ${form} that is highly related to the picture provided. Make reference to what is in the foreground and optionally the background as well. Responses should not be generic and must be about the picture provided. The first line will be the title of the ${form}, the rest will be the poem contents only.`;

  if (form === "Tongue Twister") {
    template += ` A tongue twister is something difficult to articulate rapidly, usually because of a succession of similar consonantal sounds, as in Shall she sell seashells? Make sure it's really hard to say the ${form}, use alliterations.`;
  } else if (form === "Debug") {
    template =
      'You are a futuristic AI scanning camera for a sci-fi movie. You will be given a photo, you must analyse it and create a "data sheet" of what you see. The more you see, the more you should output but at most, you should output no more than 40 lines. The first line will be a very short summary of what you see, the rest of the content will be the "data sheet". Any people in the photo must be analysed for their expression, mood, and key facial features - ideally with a few funny lines every now and then.';
  }

  if (poemStyles.Theme.find((possibleStyle) => possibleStyle.name === style)) {
    // Theme styles
    template += ` The ${form} should be ${style}.`;
  } else if (style === "An Angry Person") {
    // An angry person
    template += ` The ${form} should be angry, insulting like a putdown, but still funny.`;
  } else if (
    poemStyles.Novelty.find((possibleStyle) => possibleStyle.name === style)
  ) {
    // Novelty people
    template += `The ${form} must be written as-if it was written by a ${style}.`;
  } else {
    // Famous poets
    template += `The ${form} must be written as-if it was written by the famous poet ${style}.`;
  }

  return template;
}

/** Strip the markdown a title line might arrive wrapped in. */
function cleanTitle(line: string): string {
  return line
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^\*+/, "")
    .replace(/\*+$/, "")
    .trim();
}

/** A single line the parser has finished and the UI can render. */
export type PoemLineEvent =
  | { type: "title"; title: string }
  | { type: "line"; text: string };

/** Everything the API can send over the wire. */
export type PoemStreamEvent =
  | PoemLineEvent
  | { type: "done"; poem: Poem }
  | { type: "error"; message: string; status: number };

/**
 * Turn a stream of raw model text into whole title/body lines.
 *
 * The model streams tokens, often several a word; this buffers them and only
 * emits a line once its trailing newline has arrived (or once the stream ends).
 * Blank lines are kept only *inside* the body, so the title is not preceded by
 * an empty line and the poem does not trail off into whitespace.
 */
export class PoemStreamParser {
  private buffer = "";
  private title: string | undefined;
  private bodyStarted = false;
  private pendingBlanks = 0;
  private readonly lines: string[] = [];

  /** Feed a raw text delta; get back any lines it completed. */
  push(chunk: string): PoemLineEvent[] {
    if (chunk) this.buffer += chunk;

    const events: PoemLineEvent[] = [];
    let newline: number;
    while ((newline = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, newline).replace(/\r$/, "");
      this.buffer = this.buffer.slice(newline + 1);
      this.consume(line, events);
    }
    return events;
  }

  /** Flush the final, unterminated line (if any). */
  flush(): PoemLineEvent[] {
    const events: PoemLineEvent[] = [];
    if (this.buffer) {
      this.consume(this.buffer.replace(/\r$/, ""), events);
      this.buffer = "";
    }
    return events;
  }

  /** The parsed title (if any) and body so far. */
  result(): { title: string | undefined; body: string } {
    return { title: this.title, body: this.lines.join("\n") };
  }

  private consume(line: string, events: PoemLineEvent[]): void {
    if (this.title === undefined) {
      // The first non-blank line is always the title.
      if (!line.trim()) return;
      this.title = cleanTitle(line) || "Untitled";
      events.push({ type: "title", title: this.title });
      return;
    }

    if (!this.bodyStarted) {
      // Ignore the empty line a model often leaves under the title.
      if (!line.trim()) return;
      this.bodyStarted = true;
      this.lines.push(line);
      events.push({ type: "line", text: line });
      return;
    }

    if (!line.trim()) {
      // Hold blanks back until we know more content follows, so trailing
      // whitespace at the end of the poem is dropped.
      this.pendingBlanks += 1;
      return;
    }

    while (this.pendingBlanks > 0) {
      this.pendingBlanks -= 1;
      this.lines.push("");
      events.push({ type: "line", text: "" });
    }
    this.lines.push(line);
    events.push({ type: "line", text: line });
  }
}

/**
 * Turn a model reply into a title and body. The first line is the title (with
 * any stray markdown heading/bold markers stripped); everything else is the
 * body.
 */
export function parsePoem(text: string): { title: string; body: string } {
  const parser = new PoemStreamParser();
  parser.push(text);
  parser.flush();
  const { title, body } = parser.result();

  if (title === undefined && !body) {
    throw new PoemSourceError("The poem service came back empty.", 422);
  }

  return { title: title || "Untitled", body };
}

/**
 * Pull the text out of a single streamed payload. Workers AI and
 * OpenAI-compatible endpoints both send OpenAI-style chunks
 * (`choices[0].delta.content`), some older models use a top-level `response`,
 * and reasoning models add a `reasoning_content` we must ignore.
 */
function streamDelta(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const data = payload as {
    response?: unknown;
    choices?: {
      delta?: { content?: unknown };
      message?: { content?: unknown };
    }[];
  };

  const choice = data.choices?.[0];
  const content = choice?.delta?.content ?? choice?.message?.content;
  if (typeof content === "string" && content) return content;

  if (typeof data.response === "string") return data.response;
  return "";
}

/** Read an OpenAI-compatible SSE stream, yielding only the answer text. */
async function* sseTextDeltas(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const readLine = (line: string): string => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return "";
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") return "";
    try {
      return streamDelta(JSON.parse(payload));
    } catch {
      return "";
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        const delta = readLine(line);
        if (delta) yield delta;
      }
    }

    buffer += decoder.decode();
    for (const line of buffer.split("\n")) {
      const delta = readLine(line);
      if (delta) yield delta;
    }
  } finally {
    reader.releaseLock();
  }
}

function isReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { getReader?: unknown }).getReader === "function"
  );
}

/**
 * Turn a generator's raw text deltas into line events and a final poem. The
 * `done` event carries the canonical poem (and the model id) so the client can
 * hand it straight to the printer.
 */
export async function* streamPoem(
  generator: PoemGenerator,
  image: string,
  form: PoemFormsNames,
  style: PoemStyleNames,
): AsyncGenerator<PoemStreamEvent> {
  const parser = new PoemStreamParser();

  for await (const delta of generator.stream(image, form, style)) {
    yield* parser.push(delta);
  }
  yield* parser.flush();

  const { title, body } = parser.result();
  if (title === undefined && !body) {
    throw new PoemSourceError("The poem service came back empty.", 422);
  }

  yield {
    type: "done",
    poem: { ai: generator.model, title: title || "Untitled", body },
  };
}

/** The OpenAI-compatible HTTP implementation. */
export function createEndpointGenerator(
  config: PoemSourceEnv,
  fetchImpl: typeof fetch = fetch,
): PoemGenerator {
  const model = config.model || DEFAULT_MODEL;

  return {
    model,
    async *stream(image, form, style) {
      if (!config.endpoint || !config.apiKey) {
        throw new PoemSourceError("The poem service is not configured.", 503);
      }

      let response: Response;
      try {
        response = await fetchImpl(config.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: MAX_RESPONSE_TOKENS,
            stream: true,
            messages: [
              { role: "system", content: buildPrompt(form, style) },
              {
                role: "user",
                content: [{ type: "image_url", image_url: { url: image } }],
              },
            ],
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch {
        throw new PoemSourceError("Could not reach the poem service.", 502);
      }

      if (!response.ok) {
        throw new PoemSourceError(
          `The poem service returned ${response.status}: ${await response.text()}.`,
          502,
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (response.body && contentType.includes("text/event-stream")) {
        yield* sseTextDeltas(response.body);
        return;
      }

      // The provider ignored `stream` and sent one normal JSON body.
      let content = "";
      try {
        const data = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        content = data.choices?.[0]?.message?.content ?? "";
      } catch {
        throw new PoemSourceError(
          "The poem service returned an unreadable response.",
          502,
        );
      }
      if (content) yield content;
    },
  };
}

/**
 * Pull the assistant text out of a non-streamed Workers AI reply. The binding
 * is inconsistent: some models (e.g. Llama 4 Scout) return a top-level
 * `response` string, while others (e.g. Gemma 4) only return OpenAI-style
 * `choices[0].message.content`. Reasoning models also carry a separate
 * `reasoning_content` we must not include.
 */
function workersAiReply(result: unknown): string {
  if (!result || typeof result !== "object") return "";

  const reply = result as {
    response?: unknown;
    choices?: { message?: { content?: unknown } }[];
  };

  if (typeof reply.response === "string" && reply.response.trim()) {
    return reply.response;
  }

  const content = reply.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

/**
 * The Cloudflare Workers AI implementation. Chat vision models take the frame
 * as an OpenAI-style `image_url` content part (a base64 data URL). With
 * `stream: true` the binding returns an SSE `ReadableStream`; a few models
 * ignore the flag and answer in one piece, so that shape is handled too.
 */
export function createWorkersAiGenerator(
  ai: WorkersAiBinding,
  model: string = DEFAULT_WORKERS_AI_MODEL,
): PoemGenerator {
  return {
    model,
    async *stream(image, form, style) {
      let result: unknown;
      try {
        result = await ai.run(model, {
          messages: [
            { role: "system", content: buildPrompt(form, style) },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Write the poem for the attached photo.",
                },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ],
          max_tokens: MAX_RESPONSE_TOKENS,
          stream: true,
        });
      } catch {
        throw new PoemSourceError("Could not reach the poem service.", 502);
      }

      if (isReadableStream(result)) {
        yield* sseTextDeltas(result);
        return;
      }

      const content = workersAiReply(result);
      if (content) yield content;
    },
  };
}
