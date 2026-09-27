import { describe, expect, test } from "bun:test";
import {
  PoemSourceError,
  buildPrompt,
  createEndpointGenerator,
  createWorkersAiGenerator,
  generatePoem,
  parsePoem,
  type WorkersAiBinding,
} from "./poem-source";
import { handlePoemRequest, resolvePoemGenerator } from "./poem-api";

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

  test("throws on an empty reply", () => {
    expect(() => parsePoem("   ")).toThrow(PoemSourceError);
  });
});

describe("generatePoem", () => {
  const env = {
    endpoint: "https://example.test/v1/chat/completions",
    apiKey: "secret",
    model: "test-model",
  };
  const image = "data:image/jpeg;base64,AAAA";

  test("posts the image as an image_url and parses the reply", async () => {
    let captured: {
      url: string;
      body: any;
      auth?: string;
    } | null = null;

    const fetchImpl = (async (url: unknown, init: any) => {
      captured = {
        url: String(url),
        body: JSON.parse(String(init?.body)),
        auth: init?.headers?.authorization,
      };
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "A Title\nthe body" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const poem = await generatePoem(
      image,
      "Haiku",
      "Humorous",
      env,
      fetchImpl,
    );

    expect(poem).toEqual({ ai: "test-model", title: "A Title", body: "the body" });
    expect(captured!.url).toBe(env.endpoint);
    expect(captured!.auth).toBe("Bearer secret");
    expect(captured!.body.model).toBe("test-model");
    expect(captured!.body.messages[1].content[0]).toEqual({
      type: "image_url",
      image_url: { url: image },
    });
  });

  test("throws when the service is not configured", async () => {
    await expect(
      generatePoem(image, "Haiku", "Humorous", { endpoint: "", apiKey: "" }),
    ).rejects.toThrow(PoemSourceError);
  });

  test("throws when the provider fails", async () => {
    const failing = (async () =>
      new Response("nope", { status: 500 })) as unknown as typeof fetch;
    await expect(
      generatePoem(image, "Haiku", "Humorous", env, failing),
    ).rejects.toThrow(PoemSourceError);
  });
});

describe("createWorkersAiGenerator", () => {
  const image = "data:image/jpeg;base64,AAAA";

  test("calls env.AI with the image and parses the reply", async () => {
    let captured: { model?: string; inputs?: any } = null as never;
    const ai: WorkersAiBinding = {
      async run(model, inputs) {
        captured = { model, inputs };
        return { response: "A Title\nthe body" };
      },
    };

    const poem = await createWorkersAiGenerator(ai, "@cf/test/model").generate(
      image,
      "Haiku",
      "Humorous",
    );

    expect(poem).toEqual({
      ai: "@cf/test/model",
      title: "A Title",
      body: "the body",
    });
    expect(captured.model).toBe("@cf/test/model");
    expect(captured.inputs.image).toBe(image);
    expect(captured.inputs.messages[0]).toEqual({
      role: "system",
      content: buildPrompt("Haiku", "Humorous"),
    });
  });

  test("defaults to the Workers AI vision model", async () => {
    let model = "";
    const ai: WorkersAiBinding = {
      async run(name) {
        model = name;
        return { response: "T\nb" };
      },
    };
    await createWorkersAiGenerator(ai).generate(image, "Haiku", "Humorous");
    expect(model).toBe("@cf/meta/llama-4-scout-17b-16e-instruct");
  });

  test("throws when the model comes back empty", async () => {
    const ai: WorkersAiBinding = {
      async run() {
        return { response: "   " };
      },
    };
    await expect(
      createWorkersAiGenerator(ai).generate(image, "Haiku", "Humorous"),
    ).rejects.toThrow(PoemSourceError);
  });
});

describe("resolvePoemGenerator", () => {
  const image = "data:image/jpeg;base64,AAAA";

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

    await generator!.generate(image, "Haiku", "Humorous");
    expect(used).toBe("binding");
  });
});

describe("handlePoemRequest", () => {
  const generator = createEndpointGenerator({
    endpoint: "https://example.test",
    apiKey: "k",
  });
  const image = "data:image/jpeg;base64,AAAA";
  const post = (body: unknown) =>
    new Request("https://poem.test/api/poem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
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
});
