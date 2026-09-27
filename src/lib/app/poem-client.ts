/**
 * Client for our own `/api/poem` endpoint.
 *
 * The browser never talks to an AI provider directly — it calls this
 * same-origin route, which holds the API key server-side. Errors are typed so
 * the UI can offer the right recovery.
 */
import type { Poem } from "./poem-types";
import type { PoemFormsNames } from "../poem-forms";
import type { PoemStyleNames } from "../poem-styles";

export type PoemApiErrorKind = "network" | "server" | "format";

export class PoemApiError extends Error {
  readonly kind: PoemApiErrorKind;

  constructor(kind: PoemApiErrorKind, message: string) {
    super(message);
    this.name = "PoemApiError";
    this.kind = kind;
  }
}

export interface FetchPoemOptions {
  form: PoemFormsNames;
  style: PoemStyleNames;
  image: string;
  signal?: AbortSignal;
}

export async function fetchPoem({
  form,
  style,
  image,
  signal,
}: FetchPoemOptions): Promise<Poem> {
  let response: Response;
  try {
    response = await fetch("/api/poem", {
      method: "POST",
      headers: { "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ form, style, image }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new PoemApiError(
      "network",
      "Could not reach the poem service. Check your connection and try again.",
    );
  }

  const text = await response.text();

  let parsed: { ai?: unknown; title?: unknown; body?: unknown; error?: unknown };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new PoemApiError(
      "format",
      "The poem service returned something we couldn't read. Please try again.",
    );
  }

  if (!response.ok) {
    const message =
      typeof parsed.error === "string"
        ? parsed.error
        : "The poem service could not write that one. Please try again.";
    throw new PoemApiError("server", message);
  }

  if (typeof parsed.title !== "string" || typeof parsed.body !== "string") {
    throw new PoemApiError(
      "format",
      "The poem service returned an unexpected format. Please try again.",
    );
  }

  return {
    ai: typeof parsed.ai === "string" ? parsed.ai : "",
    title: parsed.title,
    body: parsed.body,
  };
}
