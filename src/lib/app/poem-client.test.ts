import { afterEach, describe, expect, test } from "bun:test";
import { PoemApiError, streamPoem } from "./poem-client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function ndjsonResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(line));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/x-ndjson" },
  });
}

function mockFetch(response: Response | (() => Response)): void {
  globalThis.fetch = (async () =>
    typeof response === "function" ? response() : response) as typeof fetch;
}

const options = {
  form: "Haiku" as const,
  style: "Humorous" as const,
  image: "data:image/jpeg;base64,AAAA",
};

describe("streamPoem", () => {
  test("fires callbacks per line and resolves with the finished poem", async () => {
    // Deliberately split a line across two chunks.
    mockFetch(
      ndjsonResponse([
        '{"type":"title","title":"A Title"}\n{"type":',
        '"line","text":"line one"}\n{"type":"line","text":""}\n',
        '{"type":"line","text":"line two"}\n',
        '{"type":"done","poem":{"ai":"m","title":"A Title","body":"line one\\n\\nline two"}}\n',
      ]),
    );

    const titles: string[] = [];
    const lines: string[] = [];
    const poem = await streamPoem({
      ...options,
      onTitle: (title) => titles.push(title),
      onLine: (text) => lines.push(text),
    });

    expect(titles).toEqual(["A Title"]);
    expect(lines).toEqual(["line one", "", "line two"]);
    expect(poem).toEqual({
      ai: "m",
      title: "A Title",
      body: "line one\n\nline two",
    });
  });

  test("surfaces a server error event", async () => {
    mockFetch(
      ndjsonResponse([
        '{"type":"error","message":"Boom.","status":502}\n',
      ]),
    );

    await expect(streamPoem(options)).rejects.toThrow("Boom.");
  });

  test("throws a server error for a non-OK response", async () => {
    mockFetch(
      new Response(JSON.stringify({ error: "Not configured." }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );

    try {
      await streamPoem(options);
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PoemApiError);
      expect((error as PoemApiError).kind).toBe("server");
      expect((error as Error).message).toBe("Not configured.");
    }
  });

  test("throws a format error when the stream ends without a poem", async () => {
    mockFetch(ndjsonResponse(['{"type":"title","title":"A Title"}\n']));
    await expect(streamPoem(options)).rejects.toThrow(PoemApiError);
  });
});
