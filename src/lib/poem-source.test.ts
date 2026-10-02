import { describe, expect, test } from "bun:test";
import {
  PoemSourceError,
  PoemStreamParser,
  buildPrompt,
  createEndpointGenerator,
  createWorkersAiGenerator,
  parsePoem,
  streamPoem,
  type PoemGenerator,
  type PoemStreamEvent,
  type WorkersAiBinding,
} from "./poem-source";
import { handlePoemRequest, resolvePoemGenerator } from "./poem-api";

const image = "data:image/jpeg;base64,AAAA";

/** A web ReadableStream carrying the given text chunks. */
function readable(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

/** One server-sent event line for an OpenAI-compatible stream. */
function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function delta(content: string): string {
  return sse({ choices: [{ delta: { content } }] });
}

/** Collect every event a generator produces. */
async function collect(generator: PoemGenerator): Promise<PoemStreamEvent[]> {
  const events: PoemStreamEvent[] = [];
  for await (const event of streamPoem(generator, image, "Haiku", "Humorous")) {
    events.push(event);
  }
  return events;
}

describe("buildPrompt", () => {
  test("names the form and the theme style", () => {
    const prompt = buildPrompt("Poem", "Humorous");
    expect(prompt).toContain("photo to Poem printer");
    expect(prompt).toContain("should be Humorous");
  });

  test("has a tongue twister special case", () => {
    expect(buildPrompt("Tongue Twister", "Humorous")).toContain(
      "alliterations",
    );
  });

  test("has a debug special case", () => {
    expect(buildPrompt("Debug", "Humorous")).toContain("data sheet");
  });

  test("treats named poets as if written by them", () => {
    expect(buildPrompt("Haiku", "Emily Dickinson")).toContain(
      "written by the famous poet Emily Dickinson",
    );
  });

  test("treats novelty voices as if written by them", () => {
    expect(buildPrompt("Haiku", "Master Yoda")).toContain(
      "written as-if it was written by a Master Yoda",
    );
  });

  test("treats an angry person specially", () => {
    expect(buildPrompt("Haiku", "An Angry Person")).toContain(
      "angry, insulting",
    );
  });
});

describe("parsePoem", () => {
  test("splits the first line into a title", () => {
    expect(parsePoem("## The Title\n\nline one\nline two")).toEqual({
      title: "The Title",
      body: "line one\nline two",
    });
  });

  test("strips bold markers around the title", () => {
    expect(parsePoem("**Bold**\nbody").title).toBe("Bold");
  });

  test("keeps blank lines inside the body", () => {
    expect(parsePoem("Title\none\n\ntwo").body).toBe("one\n\ntwo");
  });

  test("throws on an empty reply", () => {
    expect(() => parsePoem("   ")).toThrow(PoemSourceError);
  });
});

describe("PoemStreamParser", () => {
  test("emits the title first, then each body line", () => {
    const parser = new PoemStreamParser();
    const events = parser.push("# The Title\nline one\nline two\n");
    expect(events).toEqual([
      { type: "title", title: "The Title" },
      { type: "line", text: "line one" },
      { type: "line", text: "line two" },
    ]);
    expect(parser.result()).toEqual({
      title: "The Title",
      body: "line one\nline two",
    });
  });

  test("waits for the newline before emitting a split line", () => {
    const parser = new PoemStreamParser();
    expect(parser.push("# The Ti")).toEqual([]);
    expect(parser.push("tle\nline\n")).toEqual([
      { type: "title", title: "The Title" },
      { type: "line", text: "line" },
    ]);
  });

  test("skips blank lines before the title and after it", () => {
    const parser = new PoemStreamParser();
    const events = parser.push("\n\n## Title\n\nbody\n");
    expect(events).toEqual([
      { type: "title", title: "Title" },
      { type: "line", text: "body" },
    ]);
  });

  test("keeps inner stanza breaks but drops trailing blanks", () => {
    const parser = new PoemStreamParser();
    const events = parser.push("Title\none\n\ntwo\n\n\n");
    expect(events).toEqual([
      { type: "title", title: "Title" },
      { type: "line", text: "one" },
      { type: "line", text: "" },
      { type: "line", text: "two" },
    ]);
    expect(parser.result().body).toBe("one\n\ntwo");
  });

  test("flush emits an unterminated final line", () => {
    const parser = new PoemStreamParser();
    parser.push("Title\nlast line");
    expect(parser.flush()).toEqual([{ type: "line", text: "last line" }]);
  });

  test("falls back to Untitled for a markdown-only title", () => {
    const parser = new PoemStreamParser();
    expect(parser.push("##\nbody")[0]).toEqual({
      type: "title",
      title: "Untitled",
    });
  });
});

describe("streamPoem", () => {
  test("turns raw deltas into line events and a done poem", async () => {
    const generator: PoemGenerator = {
      model: "test-model",
      async *stream() {
        yield "# A Title\n";
        yield "the body\n";
        yield "second line";
      },
    };

    expect(await collect(generator)).toEqual([
      { type: "title", title: "A Title" },
      { type: "line", text: "the body" },
      { type: "line", text: "second line" },
      {
        type: "done",
        poem: {
          ai: "test-model",
          title: "A Title",
          body: "the body\nsecond line",
        },
      },
    ]);
  });

  test("throws when the model says nothing", async () => {
    const generator: PoemGenerator = {
      model: "test-model",
      async *stream() {},
    };
    await expect(collect(generator)).rejects.toThrow(PoemSourceError);
  });
});

describe("createEndpointGenerator", () => {
  const env = {
    endpoint: "https://example.test/v1/chat/completions",
    apiKey: "secret",
    model: "test-model",
  };

  test("streams SSE and posts the image as an image_url", async () => {
    let captured: { url: string; body: any; auth?: string } | null = null;

    const fetchImpl = (async (url: unknown, init: any) => {
      captured = {
        url: String(url),
        body: JSON.parse(String(init?.body)),
        auth: init?.headers?.authorization,
      };
      return new Response(
        readable(
          delta("## A Title\n"),
          delta("the body\n"),
          sse({ choices: [{ delta: { content: "" }, finish_reason: "stop" }] }),
          "data: [DONE]\n\n",
        ),
        { status: 200, headers: { "content-type": "text/event-stream" } },
      );
    }) as unknown as typeof fetch;

    const events = await collect(
      createEndpointGenerator(env, fetchImpl),
    );

    expect(events.at(-1)).toEqual({
      type: "done",
      poem: { ai: "test-model", title: "A Title", body: "the body" },
    });
    expect(captured!.url).toBe(env.endpoint);
    expect(captured!.auth).toBe("Bearer secret");
    expect(captured!.body.model).toBe("test-model");
    expect(captured!.body.stream).toBe(true);
    expect(captured!.body.messages[1].content[0]).toEqual({
      type: "image_url",
      image_url: { url: image },
    });
  });

  test("falls back to a whole JSON body when the provider ignores stream", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "A Title\nthe body" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as unknown as typeof fetch;

    const events = await collect(createEndpointGenerator(env, fetchImpl));
    expect(events).toEqual([
      { type: "title", title: "A Title" },
      { type: "line", text: "the body" },
      {
        type: "done",
        poem: { ai: "test-model", title: "A Title", body: "the body" },
      },
    ]);
  });

  test("throws when the service is not configured", async () => {
    await expect(
      collect(createEndpointGenerator({ endpoint: "", apiKey: "" })),
    ).rejects.toThrow(PoemSourceError);
  });

  test("throws when the provider fails", async () => {
    const failing = (async () =>
      new Response("nope", { status: 500 })) as unknown as typeof fetch;
    await expect(
      collect(createEndpointGenerator(env, failing)),
    ).rejects.toThrow(PoemSourceError);
  });
});

describe("createWorkersAiGenerator", () => {
  test("streams the binding's SSE output and parses the reply", async () => {
    let captured: { model?: string; inputs?: any } = null as never;
    const ai: WorkersAiBinding = {
      async run(model, inputs) {
        captured = { model, inputs };
        return readable(delta("A Title\n"), delta("the body\n"));
      },
    };

    const events = await collect(
      createWorkersAiGenerator(ai, "@cf/test/model"),
    );

    expect(events.at(-1)).toEqual({
      type: "done",
      poem: { ai: "@cf/test/model", title: "A Title", body: "the body" },
    });
    expect(captured.model).toBe("@cf/test/model");
    expect(captured.inputs.stream).toBe(true);
    expect(captured.inputs.messages[0]).toEqual({
      role: "system",
      content: buildPrompt("Haiku", "Humorous"),
    });
    expect(captured.inputs.messages[1].content).toEqual([
      { type: "text", text: "Write the poem for the attached photo." },
      { type: "image_url", image_url: { url: image } },
    ]);
  });

  test("ignores reasoning_content and only streams the answer", async () => {
    const ai: WorkersAiBinding = {
      async run() {
        return readable(
          sse({
            choices: [{ delta: { content: "", reasoning_content: "think" } }],
          }),
          delta("A Title\n"),
          sse({
            choices: [{ delta: { content: "", reasoning_content: "more" } }],
          }),
          delta("the body\n"),
        );
      },
    };

    const events = await collect(createWorkersAiGenerator(ai));
    expect(events).toEqual([
      { type: "title", title: "A Title" },
      { type: "line", text: "the body" },
      {
        type: "done",
        poem: {
          ai: "@cf/google/gemma-4-26b-a4b-it",
          title: "A Title",
          body: "the body",
        },
      },
    ]);
  });

  test("defaults to the Workers AI vision model", async () => {
    let model = "";
    const ai: WorkersAiBinding = {
      async run(name) {
        model = name;
        return { response: "A Title\nthe body" };
      },
    };
    await collect(createWorkersAiGenerator(ai));
    expect(model).toBe("@cf/google/gemma-4-26b-a4b-it");
  });

  test("reads a non-streamed OpenAI-style reply", async () => {
    const ai: WorkersAiBinding = {
      async run() {
        return {
          choices: [
            {
              message: {
                content: "A Title\nthe body",
                reasoning_content: "private chain of thought",
              },
            },
          ],
        };
      },
    };

    const events = await collect(createWorkersAiGenerator(ai));
    expect(events.at(-1)).toEqual({
      type: "done",
      poem: {
        ai: "@cf/google/gemma-4-26b-a4b-it",
        title: "A Title",
        body: "the body",
      },
    });
  });

  test("throws when the model comes back empty", async () => {
    const ai: WorkersAiBinding = {
      async run() {
        return { response: "   " };
      },
    };
    await expect(collect(createWorkersAiGenerator(ai))).rejects.toThrow(
      PoemSourceError,
    );
  });
});

describe("resolvePoemGenerator", () => {
  test("returns null without a binding, an endpoint or a key", () => {
    expect(resolvePoemGenerator({})).toBeNull();
    expect(resolvePoemGenerator({ AI_ENDPOINT: "x" })).toBeNull();
    expect(resolvePoemGenerator({ AI_API_KEY: "x" })).toBeNull();
  });

  test("returns an HTTP generator from the env vars", () => {
    expect(
      resolvePoemGenerator({ AI_ENDPOINT: "e", AI_API_KEY: "k", AI_MODEL: "m" }),
    ).not.toBeNull();
  });

  test("prefers the binding even when an endpoint is also configured", async () => {
    let used = "";
    const ai: WorkersAiBinding = {
      async run() {
        used = "binding";
        return { response: "T\nb" };
      },
    };

    const generator = resolvePoemGenerator({
      AI: ai,
      AI_ENDPOINT: "https://example.test",
      AI_API_KEY: "k",
    });

    await collect(generator!);
    expect(used).toBe("binding");
  });
});

describe("handlePoemRequest", () => {
  const generator = createEndpointGenerator({
    endpoint: "https://example.test",
    apiKey: "k",
  });
  const post = (body: unknown) =>
    new Request("https://poem.test/api/poem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  const textGenerator = (text: string): PoemGenerator => ({
    model: "test-model",
    async *stream() {
      yield text;
    },
  });

  test("rejects a non-POST request", async () => {
    const response = await handlePoemRequest(
      new Request("https://poem.test/api/poem"),
      generator,
    );
    expect(response.status).toBe(405);
  });

  test("rejects an unknown form", async () => {
    const response = await handlePoemRequest(
      post({ form: "Nope", style: "Humorous", image }),
      generator,
    );
    expect(response.status).toBe(400);
  });

  test("rejects an unknown style", async () => {
    const response = await handlePoemRequest(
      post({ form: "Haiku", style: "Nope", image }),
      generator,
    );
    expect(response.status).toBe(400);
  });

  test("rejects a non-image payload", async () => {
    const response = await handlePoemRequest(
      post({ form: "Haiku", style: "Humorous", image: "not-an-image" }),
      generator,
    );
    expect(response.status).toBe(400);
  });

  test("returns 503 when unconfigured", async () => {
    const response = await handlePoemRequest(
      post({ form: "Haiku", style: "Humorous", image }),
      null,
    );
    expect(response.status).toBe(503);
  });

  test("streams newline-delimited JSON for a valid request", async () => {
    const response = await handlePoemRequest(
      post({ form: "Haiku", style: "Humorous", image }),
      textGenerator("# A Title\nline one\nline two"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("x-ndjson");

    const events = (await response.text())
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    expect(events).toEqual([
      { type: "title", title: "A Title" },
      { type: "line", text: "line one" },
      { type: "line", text: "line two" },
      {
        type: "done",
        poem: {
          ai: "test-model",
          title: "A Title",
          body: "line one\nline two",
        },
      },
    ]);
  });

  test("reports a failure before the first line as an HTTP error", async () => {
    const response = await handlePoemRequest(
      post({ form: "Haiku", style: "Humorous", image }),
      createEndpointGenerator({ endpoint: "", apiKey: "" }),
    );
    expect(response.status).toBe(503);
    expect((await response.json()).error).toBe(
      "The poem service is not configured.",
    );
  });

  test("sends an error event when the stream fails midway", async () => {
    const flaky: PoemGenerator = {
      model: "test-model",
      async *stream() {
        yield "# A Title\n";
        throw new PoemSourceError("Boom.", 502);
      },
    };

    const response = await handlePoemRequest(
      post({ form: "Haiku", style: "Humorous", image }),
      flaky,
    );

    const events = (await response.text())
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    expect(events[0]).toEqual({ type: "title", title: "A Title" });
    expect(events.at(-1)).toEqual({
      type: "error",
      message: "Boom.",
      status: 502,
    });
  });
});
