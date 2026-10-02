// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

/**
 * Serves `POST /api/poem` during `astro dev` using the exact handler the Worker
 * runs in production, so local development exercises the real AI path. Reads
 * config from `.env` (and the ambient environment). Dev only — `apply: "serve"`.
 *
 * @returns {import("vite").Plugin}
 */
function devPoemApi() {
  return {
    name: "dev-poem-api",
    apply: "serve",
    configureServer(server) {
      const env = {
        ...loadEnv(server.config.mode, process.cwd(), ""),
        ...process.env,
      };

      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        if (path !== "/api/poem") {
          next();
          return;
        }

        try {
          const mod = /** @type {typeof import("./src/lib/poem-api")} */ (
            await server.ssrLoadModule("/src/lib/poem-api.ts")
          );

          /** @type {Buffer[]} */
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
          }
          const body = Buffer.concat(chunks);

          const request = new Request(new URL(req.url ?? "/", "http://localhost"), {
            method: req.method,
            headers: {
              "content-type": req.headers["content-type"] ?? "application/json",
            },
            body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
          });

          const response = await mod.handlePoemRequest(
            request,
            mod.resolvePoemGenerator(env),
          );

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));

          // Pipe the stream straight through so lines arrive as they are
          // written rather than after the whole poem is buffered.
          if (!response.body) {
            res.end();
            return;
          }
          try {
            for await (const chunk of response.body) {
              res.write(chunk);
            }
          } catch {
            // Client disconnected mid-stream; nothing left to do.
          }
          res.end();
        } catch (error) {
          server.config.logger.error(
            `[dev-poem-api] ${error instanceof Error ? error.message : String(error)}`,
          );
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "The dev poem service failed." }));
        }
      });
    },
  };
}

export default defineConfig({
  site: "https://poem-camera.happypaul55.com",
  build: {
    format: "file",
    inlineStylesheets: "always",
  },
  trailingSlash: "never",
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss(), devPoemApi()],
  },
});
