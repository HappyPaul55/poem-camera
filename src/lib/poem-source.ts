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
  generate(
    image: string,
    form: PoemFormsNames,
    style: PoemStyleNames,
  ): Promise<Poem>;
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

/** How long to wait for the model before giving up. Vision calls can be slow. */
const REQUEST_TIMEOUT_MS = 30_000;

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

/**
 * Turn a model reply into a title and body. The first line is the title (with
 * any stray markdown heading/bold markers stripped); everything else is the
 * body.
 */
export function parsePoem(text: string): { title: string; body: string } {
  const parts = text.trim().split("\n");
  const title = (parts.shift() ?? "")
    .trim()
    .replace(/^##+/, "")
    .replace(/^\*+/, "")
    .replace(/\*+$/, "")
    .trim();
  const body = parts.join("\n").trim();

  if (!title && !body) {
    throw new PoemSourceError("The poem service came back empty.", 422);
  }

  return { title: title || "Untitled", body };
}

export async function generatePoem(
  image: string,
  form: PoemFormsNames,
  style: PoemStyleNames,
  env: PoemSourceEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<Poem> {
  if (!env.endpoint || !env.apiKey) {
    throw new PoemSourceError("The poem service is not configured.", 503);
  }

  const model = env.model || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetchImpl(env.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_RESPONSE_TOKENS,
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

  if (!content.trim()) {
    throw new PoemSourceError("The poem service came back empty.", 422);
  }

  const { title, body } = parsePoem(content);

  return { ai: model, title, body };
}

/** The OpenAI-compatible HTTP implementation. */
export function createEndpointGenerator(config: PoemSourceEnv): PoemGenerator {
  return {
    generate: (image, form, style) => generatePoem(image, form, style, config),
  };
}

/**
 * Pull the assistant text out of a Workers AI reply. The binding is
 * inconsistent: some models (e.g. Llama 4 Scout) return a top-level `response`
 * string, while others (e.g. Gemma 4) only return OpenAI-style
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
 * as an OpenAI-style `image_url` content part (a base64 data URL) and answer
 * with `{ response }`. The top-level `image` field only works for a few older
 * models (e.g. Llama 3.2 Vision) and is silently ignored by models like
 * Llama 4 Scout, so the content-part form is used instead.
 */
export function createWorkersAiGenerator(
  ai: WorkersAiBinding,
  model: string = DEFAULT_WORKERS_AI_MODEL,
): PoemGenerator {
  return {
    async generate(image, form, style) {
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
        });
      } catch {
        throw new PoemSourceError("Could not reach the poem service.", 502);
      }

      const content = workersAiReply(result);

      if (!content.trim()) {
        throw new PoemSourceError("The poem service came back empty.", 422);
      }

      const { title, body } = parsePoem(content);

      return { ai: model, title, body };
    },
  };
}
