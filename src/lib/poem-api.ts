/**
 * The `/api/poem` HTTP handler, shared by the production Worker and the local
 * dev server so both behave identically. Kept separate from `poem-source.ts` so
 * the AI logic can be tested without constructing requests.
 *
 * The success response is a stream of newline-delimited JSON (`application/
 * x-ndjson`): a `title` event, then one `line` event per completed line, then a
 * `done` event carrying the finished poem. Validation failures are still plain
 * JSON with an HTTP error status.
 */
import {
  PoemSourceError,
  createEndpointGenerator,
  createWorkersAiGenerator,
  streamPoem,
  type PoemGenerator,
  type PoemStreamEvent,
  type WorkersAiBinding,
} from "./poem-source";
import { POEM_FORM_NAMES, type PoemFormsNames } from "./poem-forms";
import { POEM_STYLE_NAMES, type PoemStyleNames } from "./poem-styles";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const STREAM_HEADERS = {
  "content-type": "application/x-ndjson; charset=utf-8",
  "cache-control": "no-store",
  // Ask any proxy (e.g. nginx in local setups) not to buffer the stream.
  "x-accel-buffering": "no",
};

/**
 * Upper bound on the incoming image data URL (in characters). The client caps
 * the long edge at ~1600px and re-encodes to JPEG, so this is generous; it
 * exists to stop an oversized body reaching the model.
 */
const MAX_IMAGE_CHARS = 12_000_000;

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+/=\s]+$/i;

/**
 * Choose a poem generator from a Worker `env` / process env bag. An explicitly
 * configured OpenAI-compatible endpoint (`AI_ENDPOINT` + `AI_API_KEY`) wins;
 * otherwise the Workers AI binding (`AI`) is used; otherwise it throws a 503
 * `PoemSourceError` so the caller can report the service as unconfigured.
 */
export function resolvePoemGenerator(
  env: Record<string, unknown>,
): PoemGenerator {
  const endpoint = typeof env.AI_ENDPOINT === "string" ? env.AI_ENDPOINT : "";
  const apiKey = typeof env.AI_API_KEY === "string" ? env.AI_API_KEY : "";
  const model = typeof env.AI_MODEL === "string" ? env.AI_MODEL : undefined;

  // The HTTP endpoint takes precedence, so pointing production at another
  // OpenAI-compatible provider (e.g. DeepSeek) only needs AI_ENDPOINT and
  // AI_API_KEY — the Workers AI binding may stay configured.
  if (endpoint && apiKey) {
    return createEndpointGenerator({ endpoint, apiKey, model });
  }

  const ai = env.AI as WorkersAiBinding | undefined;
  if (ai && typeof ai.run === "function") {
    return createWorkersAiGenerator(ai, model);
  }

  throw new PoemSourceError("The poem service is not configured.", 503);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/**
 * Turn a thrown `PoemSourceError` (e.g. from `resolvePoemGenerator` when nothing
 * is configured) into the JSON error response the API routes return.
 */
export function poemErrorResponse(error: unknown): Response {
  if (error instanceof PoemSourceError) {
    return json({ error: error.message }, error.status);
  }
  console.warn("[poem] unexpected error handling the request:", error);
  return json({ error: "Something went wrong writing the poem." }, 502);
}

function isForm(value: unknown): value is PoemFormsNames {
  return typeof value === "string" && POEM_FORM_NAMES.includes(value as PoemFormsNames);
}

function isStyle(value: unknown): value is PoemStyleNames {
  return typeof value === "string" && POEM_STYLE_NAMES.includes(value as PoemStyleNames);
}

/**
 * Wrap the line events in a streaming `Response`.
 *
 * The first event is awaited up front so a failure before the model says
 * anything (unconfigured, unreachable, empty reply) can still be reported as a
 * normal HTTP error instead of an error inside an already-started stream.
 */
async function poemStreamResponse(
  generator: PoemGenerator,
  image: string,
  form: PoemFormsNames,
  style: PoemStyleNames,
): Promise<Response> {
  const events = streamPoem(generator, image, form, style);

  let first: IteratorResult<PoemStreamEvent>;
  try {
    first = await events.next();
  } catch (error) {
    if (error instanceof PoemSourceError) {
      return json({ error: error.message }, error.status);
    }
    console.warn("[poem] unexpected error before the stream started:", error);
    return json({ error: "Something went wrong writing the poem." }, 502);
  }

  if (first.done) {
    return json({ error: "The poem service came back empty." }, 422);
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PoemStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The client went away; there is nobody left to send to.
        }
      };

      send(first.value);
      try {
        for await (const event of events) send(event);
      } catch (error) {
        if (!(error instanceof PoemSourceError)) {
          console.warn("[poem] unexpected error mid-stream:", error);
        }
        const streamError =
          error instanceof PoemSourceError
            ? error
            : new PoemSourceError("Something went wrong writing the poem.", 502);
        send({
          type: "error",
          message: streamError.message,
          status: streamError.status,
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by a cancelled stream.
        }
      }
    },
  });

  return new Response(body, { status: 200, headers: STREAM_HEADERS });
}

export async function handlePoemRequest(
  request: Request,
  generator: PoemGenerator | null,
): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "A JSON body is required." }, 400);
  }

  const { image, form, style } = (body ?? {}) as {
    image?: unknown;
    form?: unknown;
    style?: unknown;
  };

  if (!isForm(form)) {
    return json({ error: "That poem form is not supported." }, 400);
  }
  if (!isStyle(style)) {
    return json({ error: "That poem style is not supported." }, 400);
  }
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return json({ error: "A base64 image data URL is required." }, 400);
  }
  if (image.length > MAX_IMAGE_CHARS) {
    return json({ error: "That image is too large." }, 413);
  }
  if (!IMAGE_DATA_URL.test(image)) {
    return json({ error: "That image format is not supported." }, 415);
  }

  if (!generator) {
    return json({ error: "The poem service is not configured." }, 503);
  }

  return poemStreamResponse(generator, image, form, style);
}
