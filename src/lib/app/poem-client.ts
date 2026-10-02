/**
 * Client for our own `/api/poem` endpoint.
 *
 * The browser never talks to an AI provider directly — it calls this
 * same-origin route, which holds the API key server-side. The reply is a stream
 * of newline-delimited JSON; `onTitle` / `onLine` fire for whole lines as they
 * arrive, and the promise resolves with the finished poem.
 *
 * Errors are typed so the UI can offer the right recovery.
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

export interface StreamPoemOptions {
  form: PoemFormsNames;
  style: PoemStyleNames;
  image: string;
  signal?: AbortSignal;
  /** Called once, when the title line is complete. */
  onTitle?: (title: string) => void;
  /** Called for every completed body line, including blank stanza breaks. */
  onLine?: (text: string) => void;
}

type StreamEvent =
  | { type: "title"; title: string }
  | { type: "line"; text: string }
  | { type: "done"; poem: Poem }
  | { type: "error"; message: string; status: number };

function parseEvent(line: string): StreamEvent {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new PoemApiError(
      "format",
      "The poem service returned something we couldn't read. Please try again.",
    );
  }

  if (!value || typeof value !== "object") {
    throw new PoemApiError(
      "format",
      "The poem service returned an unexpected format. Please try again.",
    );
  }

  const event = value as Partial<StreamEvent> & { type?: unknown };
  switch (event.type) {
    case "title":
      if (typeof (event as { title?: unknown }).title === "string") {
        return event as StreamEvent;
      }
      break;
    case "line":
      if (typeof (event as { text?: unknown }).text === "string") {
        return event as StreamEvent;
      }
      break;
    case "done": {
      const poem = (event as { poem?: Poem }).poem;
      if (poem && typeof poem.title === "string" && typeof poem.body === "string") {
        return event as StreamEvent;
      }
      break;
    }
    case "error":
      if (typeof (event as { message?: unknown }).message === "string") {
        return event as StreamEvent;
      }
      break;
  }

  throw new PoemApiError(
    "format",
    "The poem service returned an unexpected format. Please try again.",
  );
}

export async function streamPoem({
  form,
  style,
  image,
  signal,
  onTitle,
  onLine,
}: StreamPoemOptions): Promise<Poem> {
  let response: Response;
  try {
    response = await fetch("/api/poem", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/x-ndjson",
      },
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

  if (!response.ok) {
    let message = "The poem service could not write that one. Please try again.";
    try {
      const data = (await response.json()) as { error?: unknown };
      if (typeof data.error === "string") message = data.error;
    } catch {
      // Keep the generic message.
    }
    throw new PoemApiError("server", message);
  }

  if (!response.body) {
    throw new PoemApiError(
      "format",
      "The poem service returned something we couldn't read. Please try again.",
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let poem: Poem | undefined;

  const handle = (line: string) => {
    const event = parseEvent(line);
    if (event.type === "title") {
      onTitle?.(event.title);
    } else if (event.type === "line") {
      onLine?.(event.text);
    } else if (event.type === "done") {
      poem = event.poem;
    } else {
      throw new PoemApiError("server", event.message);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) handle(line);
      }
    }

    buffer += decoder.decode();
    for (const line of buffer.split("\n")) {
      if (line.trim()) handle(line.trim());
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof PoemApiError) throw error;
    throw new PoemApiError(
      "format",
      "The poem service returned something we couldn't read. Please try again.",
    );
  } finally {
    reader.releaseLock();
  }

  if (!poem) {
    throw new PoemApiError(
      "format",
      "The poem service returned an unexpected format. Please try again.",
    );
  }

  return poem;
}
