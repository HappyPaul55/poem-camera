# AGENTS.md

## What this repo is

A standalone **web app** for **Poem Camera** (`poem-camera.happypaul55.com`),
published by **HappyPaul55**. It follows the agency client-site standard: one
self-contained repository, no monorepo, no shared template, no workspace or
submodule dependency. Structure follows the `client-lexiphanic-co-uk` /
`borings-baddies-bastards` reference builds; the **visual style is the shared
happypaul55.com brand** (the engineer's-notebook look), with only a small,
restrained thermal-print / Polaroid motif added on top.

The marketing pages (`/`, `/privacy`, `/404`) are plain Astro and ship no
JavaScript. **`/app` is a React island** (`@astrojs/react`, `client:load`) because
it is an interactive camera. A small **Cloudflare Worker** (`worker/index.ts`)
serves `POST /api/poem`.

Routes: `/` (landing), `/app` (the camera), `/privacy`, `/404`, `/api/poem`.

## Commands

```bash
cp .env.example .env   # poem-generation config for local dev
bun install
bun run dev      # dev server on http://localhost:4321 (serves /api/poem itself)
bun run build    # static build into dist/
bun run preview  # serve the built site
bun run check    # astro check — types for everything except the tests
bun test         # unit tests for the prompt/parse logic and the API handler
bun run icons    # regenerate public/icons from public/icons/brand-mark.svg
```

Use **Bun** for everything: `bun` (never `npm`) and `bunx` (never `npx`). The
lockfile is `bun.lock`; do not add `package-lock.json`, `yarn.lock` or
`pnpm-lock.yaml`. Verify every change with `bun run check`, `bun test` and
`bun run build`. There is no linter.

`src/lib/*.test.ts` are excluded from the `astro check` tsconfig because they
import `bun:test`; Bun runs and transpiles them natively (`bun test`).

## Key files

- `src/lib/poem-forms.ts` / `src/lib/poem-styles.ts` — the forms, themes, novelty
  voices and named poets. Single source of truth for both the settings UI and the
  API validation.
- `src/lib/poem-source.ts` — the prompt (`buildPrompt`), the reply parser
  (`parsePoem`) and the single `PoemGenerator` interface with two factory
  implementations: `createWorkersAiGenerator` (the `env.AI` binding) and
  `createEndpointGenerator` (OpenAI-compatible `fetch`). Runtime-free so the
  Worker and the dev server share it.
- `src/lib/poem-api.ts` — the `/api/poem` HTTP handler and
  `resolvePoemGenerator` (binding first, HTTP endpoint second, `null` otherwise).
  Used by both `worker/index.ts` and the dev plugin in `astro.config.mjs`.
- `src/lib/app/poem-client.ts` — the browser client for `/api/poem`; typed
  `PoemApiError` kinds (`network` / `server` / `format`).
- `src/lib/app/use-camera.ts` — camera access without a third-party webcam
  component: permission, `enumerateDevices`, camera switching, canvas capture.
- `src/lib/app/image.ts` — canvas JPEG normalisation (replaces the old server-side
  `sharp` conversion). Caps the long edge and strips EXIF.
- `src/lib/app/use-printer.ts` + `src/lib/app/web-bluetooth-receipt-printer/` —
  the Bluetooth thermal printer driver and `printPoem`.
- `worker/index.ts` — the Worker entry. Serves `/api/poem` and otherwise
  `env.ASSETS.fetch(request)`. Types are declared inline on purpose (see gotchas).
- `src/components/app/**` — the React island. `AppRoot.tsx` is the root;
  dialogs are native `<dialog>`, selects are native `<select>`/`<optgroup>`.
- `src/lib/app/*-settings.ts` — `localStorage`-backed hooks. Keep the keys
  (`appSettings`, `poemSettings`, `printerSettings`) unchanged.
- `src/lib/site.ts` — `SiteSettings`, derived from the Zod schema.
- `src/lib/button.ts` — button class names shared by `Button.astro` and `Button.tsx`.
- `src/content/site/settings.json` — site metadata, author, repo and licence. The
  `file()` loader requires an **array** with `id: "main"`.
- `src/content.config.ts` — Astro 5+ location (NOT `src/content/config.ts`).
- `src/components/layout/Seo.astro` — metadata + JSON-LD (`WebApplication` +
  `WebSite` + author `Person` + `BreadcrumbList`).
- `src/styles/global.css` — Tailwind v4 `@import` + `@theme` tokens, the notebook
  component classes, the app classes, and the print styles.

## Poem generation

Server-side only; the AI credential must never reach the browser. The client
calls `POST /api/poem` with `{ form, style, image }`; the handler validates the
form, style and image data URL and hands the request to a `PoemGenerator` that
returns `{ ai, title, body }`.

There are two generators behind the one interface, chosen at runtime by
`resolvePoemGenerator`:

1. **Workers AI binding** (`env.AI`) — used whenever the Worker has the `AI`
   binding (`ai.binding: "AI"` in `wrangler.jsonc`). Calls
   `env.AI.run(model, { messages, max_tokens })`, passing the frame as an
   OpenAI-style `image_url` content part, and reads the native `{ response }`.
   This is the production path and needs no secret.
2. **OpenAI-compatible HTTP** (`generatePoem`) — used when there is no binding
   but `AI_ENDPOINT` + `AI_API_KEY` are set. This is the `astro dev` path (no
   binding exists there) and the escape hatch to another provider.

The binding wins when both are configured. `AI_MODEL` overrides the model for
whichever implementation is active; the binding default is
`@cf/meta/llama-4-scout-17b-16e-instruct`, the HTTP default is `gpt-4o-mini`.
`AI_ENDPOINT` / `AI_API_KEY` / `AI_MODEL` are read from `.env` in local dev and
`.dev.vars` under `wrangler dev`; production normally sets no AI vars because it
uses the binding. Do not add these to `settings.json` or any client code.

Images are normalised to JPEG in the browser before they are sent; do not
reintroduce a server-side image library (`sharp` does not run on Workers).

## Client-side architecture

Only `/app` ships JavaScript; the other pages stay static and script-free. Keep
it that way.

- Do not add a UI component library. Radix/shadcn were deliberately dropped in the
  migration in favour of native `<dialog>` and `<select>`, plus the shared
  `src/lib/button.ts` classes.
- Keep camera, image, printer and network logic in `src/lib/app/**`; the
  components under `src/components/app/**` should stay presentational where
  possible. Never put camera or printer logic directly in a view.
- Render the poem as text, never with `dangerouslySetInnerHTML` — it is
  model-generated.
- The app preferences are persisted under the original `localStorage` keys; do not
  rename them without a migration.

## Design constraints (do not regress)

- The look is the shared **engineer's notebook** brand: ink (`--color-ink`),
  off-white paper (`--color-paper`) and electric yellow (`--color-yellow`). This
  is the same system as `happypaul55.com` and `b3.happypaul55.com`.
- Type is **Space Grotesk** (display + body) + **Space Mono** (labels).
- Structural motifs: graph-paper grid on light sections, dot grid on dark ones,
  monospace `//` "comment" labels, the yellow `.mark` highlighter, hard offset
  shadows, and a black header with a permanent yellow rule.
- The Poem Camera's only additions are the restrained `.photo-frame` (Polaroid)
  and `.poem-receipt` (thermal print) classes and the app shell. Keep them minor;
  this should still read as part of the main brand.

## Gotchas

- URL policy is `trailingSlash: "never"` + `build.format: "file"`. Output is
  `index.html` / `app.html` / etc.; canonical and sitemap URLs have no trailing
  slash. Active-nav logic in `Header.astro` normalises both `.html` and trailing
  slashes. Check `aria-current` in `dist/*.html`, not just in dev.
- **`Permissions-Policy` must be `camera=(self)`.** Copying B3's `camera=()` would
  silently break `getUserMedia` in production while still working in dev.
- **CSP** allows `img-src 'self' data:` for the captured frame and
  `connect-src 'self'` because the AI call happens in the Worker. If you ever call
  a third party from the browser, extend `public/_headers`.
- **`run_worker_first: ["/api/*"]` needs Wrangler ≥ 4.20.0**, and
  `assets.binding: "ASSETS"` must be set for `env.ASSETS.fetch` to work.
- `worker/index.ts` declares its `Env` type inline instead of using
  `@cloudflare/workers-types`, which clashes with the DOM lib on the Astro/React
  side. `Env` is a `type` alias (not `interface`) so it is assignable to
  `Record<string, unknown>` in `resolvePoemGenerator`. The Workers AI binding is
  typed the same way (`AI?` on `Env`, `WorkersAiBinding` in `poem-source.ts`) —
  do not import `@cloudflare/workers-types` for it.
- **Workers AI chat vision models need the frame as an `image_url` content part**
  (`{ type: "text" }, { type: "image_url", image_url: { url } }`), not the
  top-level `image` field. `image` is silently ignored by models like Llama 4
  Scout — the request succeeds but the model reports no photo. The top-level
  field only works for older models such as Llama 3.2 Vision.
- `@point-of-sale/receipt-printer-encoder` ships no types; they live in
  `src/types/receipt-printer-encoder.d.ts`. Web Bluetooth types come from
  `@types/web-bluetooth`, referenced from `src/types/web-bluetooth.d.ts`.
- Only the **Bluetooth** thermal driver is implemented (`use-printer.ts`); USB and
  serial are stored but not connected. This matches the original app.
- The camera does **not** mirror captured frames, even though the front-camera
  preview is mirrored — this matches the original `react-webcam` behaviour.
- Print mode: while a poem is open the app sets `body[data-print="poem"]`, and the
  print styles hide everything except `.print-poem`. Do not remove that attribute
  or the poem will print alongside the page chrome.
- TypeScript is on 6.x: `astro check` refuses TypeScript 7 (`@astrojs/check` peer
  range is `^5.0.0 || ^6.0.0`). Do not bump to 7.
- The pretty 404 depends on `wrangler.jsonc` setting
  `assets.not_found_handling: "404-page"`.

## Deployment and handover

- Deployed as a **Cloudflare Worker with static assets** via Workers Builds
  (`bun run build` → `bunx wrangler deploy`), configured by `wrangler.jsonc`
  (`name: poem-camera`, `main: worker/index.ts`, `assets.directory: ./dist`,
  `assets.binding: ASSETS`, `run_worker_first: ["/api/*"]`).
- Production uses the Workers AI `AI` binding (`wrangler.jsonc`), so no AI
  secret is needed. Only set `AI_API_KEY` (secret) plus `AI_ENDPOINT` /
  `AI_MODEL` if you switch to the HTTP implementation.
- `site` is `https://poem-camera.happypaul55.com`; keep `astro.config.mjs`,
  `settings.json.url` and `public/robots.txt` in step if the domain changes.
- Keep `README.md` accurate for handover: commands, build/output, deploy location,
  where data and copy live, the poem service and its env vars, the camera/privacy
  behaviour, icon/font replacement, and the AGPL-3.0 licence.
