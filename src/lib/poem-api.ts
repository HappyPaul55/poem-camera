/**
 * The `/api/poem` HTTP handler, shared by the production Worker and the local
 * dev server so both behave identically. Kept separate from `poem-source.ts` so
 * the AI logic can be tested without constructing requests.
 */
import {
  PoemSourceError,
  createEndpointGenerator,
  createWorkersAiGenerator,
  type PoemGenerator,
  type WorkersAiBinding,
} from "./poem-source";
import { POEM_FORM_NAMES, type PoemFormsNames } from "./poem-forms";
import { POEM_STYLE_NAMES, type PoemStyleNames } from "./poem-styles";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

/**
 * Upper bound on the incoming image data URL (in characters). The client caps
 * the long edge at ~1600px and re-encodes to JPEG, so this is generous; it
 * exists to stop an oversized body reaching the model.
 */
const MAX_IMAGE_CHARS = 12_000_000;

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+/=\s]+$/i;

/**
 * Choose a poem generator from a Worker `env` / process env bag. The Workers AI
 * binding (`AI`) wins when the Worker has one; otherwise an OpenAI-compatible
 * endpoint configured by `AI_ENDPOINT` / `AI_API_KEY` is used. `null` means the
 * poem service is not configured at all.
 */
export function resolvePoemGenerator(
  env: Record<string, unknown>,
): PoemGenerator | null {
  const ai = env.AI as WorkersAiBinding | undefined;
  if (ai && typeof ai.run === "function") {
    const model =
      typeof env.AI_MODEL === "string" && env.AI_MODEL
        ? env.AI_MODEL
        : undefined;
    return createWorkersAiGenerator(ai, model);
  }

  const endpoint = typeof env.AI_ENDPOINT === "string" ? env.AI_ENDPOINT : "";
  const apiKey = typeof env.AI_API_KEY === "string" ? env.AI_API_KEY : "";
  const model = typeof env.AI_MODEL === "string" ? env.AI_MODEL : undefined;

  if (!endpoint || !apiKey) return null;
  return createEndpointGenerator({ endpoint, apiKey, model });
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function isForm(value: unknown): value is PoemFormsNames {
  return typeof value === "string" && POEM_FORM_NAMES.includes(value as PoemFormsNames);
}

function isStyle(value: unknown): value is PoemStyleNames {
  return typeof value === "string" && POEM_STYLE_NAMES.includes(value as PoemStyleNames);
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

  try {
    return json(await generator.generate(image, form, style), 200);
  } catch (error) {
    if (error instanceof PoemSourceError) {
      return json({ error: error.message }, error.status);
    }
    return json({ error: "Something went wrong writing the poem." }, 502);
  }
}
