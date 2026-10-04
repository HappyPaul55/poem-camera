# Poem Camera

A camera that doesn't take photos — it takes poems. Point it at the world and an
AI writes a short poem about what's in front of you, ready to print to a thermal
receipt printer or your own printer.

Built with [Astro](https://astro.build) and [Tailwind CSS v4](https://tailwindcss.com),
with a [React](https://react.dev) island for the camera itself and a small
Cloudflare Worker that talks to the AI. It follows the same structure and visual
brand as the other client sites (`client-happypaul55-com`, `borings-baddies-bastards`).

The site is **Poem Camera** (`poem-camera.happypaul55.com`); the full name is set
in `src/content/site/settings.json`.

## Routes

| Route      | What it is                                                              |
| ---------- | ----------------------------------------------------------------------- |
| `/`        | Landing page: hero, features, how it works, call to open the camera     |
| `/app`     | The camera itself (the only page with client-side JavaScript; no site header/footer) |
| `/privacy` | Privacy notice (rendered from `src/content/legal/privacy.md`)           |
| `/404`     | Not found — `noindex` and excluded from the sitemap                     |
| `/api/poem` | POST · turns an image into a poem (server-side, see below)             |
| `/api/session` | GET/POST · Turnstile human check → 30-minute session (see below)    |

## Local development

```bash
cp .env.example .env   # then fill in AI_ENDPOINT / AI_API_KEY (poem generation)
bun install
bun run dev      # dev server on http://localhost:4321
bun run build    # production build into dist/
bun run preview  # serve the built site locally
bun run check    # type-check .astro and .ts/.tsx files (astro check)
bun test         # unit tests for the prompt/parse logic and the API handler
bun run icons    # regenerate public/icons from public/icons/brand-mark.svg
```

Requires Node.js 20+ and [Bun](https://bun.sh). Use `bun` (never `npm`) and `bunx`
(never `npx`). The lockfile is `bun.lock`; do not add `package-lock.json`,
`yarn.lock` or `pnpm-lock.yaml`. There is no linter; the gates are `bun run check`,
`bun test` and `bun run build`.

`astro dev` serves `/api/poem` and `/api/session` itself, using the same handlers
the Worker runs in production, reading `.env`. Without `AI_ENDPOINT`/`AI_API_KEY`
the camera still runs and simply shows an error when a poem is requested. Without
`TURNSTILE_SECRET`/`TURNSTILE_HOSTNAMES` the app refuses to start (the human check
fails closed).

## Poem generation

The poem is produced **server-side** — the AI API key never reaches the browser.
`src/lib/app/poem-client.ts` (browser) calls `POST /api/poem` with
`{ form, style, image }`; the handler in `src/lib/poem-api.ts` validates the
request and delegates to `src/lib/poem-source.ts`. The reply is a stream of
newline-delimited JSON — a `title` event, one `line` event per finished line,
then a `done` event carrying the finished `{ ai, title, body }` — so the browser
can show the title and each line as it is written instead of waiting for the
whole poem. Partial words are never shown: the server buffers the model's tokens
into whole lines first.

`src/lib/poem-source.ts` exposes a single **`PoemGenerator`** interface with two
implementations, chosen at runtime by `resolvePoemGenerator`:

| Implementation | Used when | How |
| --- | --- | --- |
| **Cloudflare Workers AI** | the Worker has an `AI` binding (production) | `env.AI.run(model, { messages, stream: true })` with an `image_url` content part |
| **OpenAI-compatible HTTP** | no binding, but `AI_ENDPOINT` + `AI_API_KEY` are set | `fetch` to a chat-completions endpoint with `stream: true` |

Both stream server-sent events, parsed by the same code. If a provider ignores
`stream` and replies with one JSON body, that shape is handled too. Reasoning
models (like Gemma 4) send their thinking in a separate `reasoning_content`
field, which is ignored so only the poem reaches the screen.

The binding wins when both are present, so production runs entirely inside
Cloudflare on the Workers AI free tier. Local `astro dev` has no binding, so it
always uses the HTTP implementation — the same handler, a different generator.

The prompt keeps the original Poem Camera behaviour: a short poem about what is
actually in the frame, with special handling for the `Tongue Twister` and `Debug`
forms and for theme, novelty and named-poet styles.

### Cloudflare Workers AI (recommended, free)

The Worker binds Workers AI in `wrangler.jsonc`:

```jsonc
"ai": { "binding": "AI" }
```

Workers AI is included in the Workers Free plan with **10,000 Neurons/day free**,
resetting at 00:00 UTC. No API key or account ID is needed. The default model is
`@cf/google/gemma-4-26b-a4b-it`, a vision-capable model on the free tier. It is a
**reasoning** model, so it spends tokens thinking before it writes the poem;
`MAX_RESPONSE_TOKENS` (8192) is deliberately generous — enough for a
~5,000-character poem plus the thinking. It is only a cap, so unused tokens cost
nothing (roughly 100+ poems/day on the free tier). Set `AI_MODEL` to use a
different vision model. Some frontier models (Kimi, GLM-5.2/5.3, DeepSeek V4) require the
paid plan and return `403` on Free.

### OpenAI-compatible HTTP (local dev / other providers)

Configuration is entirely via environment variables:

| Variable      | Required               | Notes                                                              |
| ------------- | ---------------------- | ------------------------------------------------------------------ |
| `AI_ENDPOINT` | for the HTTP implementation | Full URL of an OpenAI-compatible, vision-capable endpoint      |
| `AI_API_KEY`  | for the HTTP implementation | Secret. `wrangler secret put AI_API_KEY` in production         |
| `AI_MODEL`    | no                     | Binding default is `@cf/google/gemma-4-26b-a4b-it`; HTTP default is `gpt-4o-mini` |

For local development put them in `.env` (git-ignored); for `wrangler dev` use
`.dev.vars`. Production uses the binding and normally sets none of them. Do not
add these to `settings.json` or any client code.

### Images

The original app converted WebP to JPEG on the server with `sharp`; that is not
available on Cloudflare Workers, so every frame is normalised to a JPEG data URL
**in the browser** instead (`src/lib/app/image.ts`). The long edge is capped at
1600px, which keeps the payload small and strips EXIF location data.

## Human check (Cloudflare Turnstile)

Because every photo calls the AI model, `/api/poem` is gated behind a **Cloudflare
Turnstile** check. Turnstile tokens are single-use and expire in minutes, so the
check is *not* repeated per photo. Instead:

1. When `/app` opens, the React island asks the worker for a session
   (`GET /api/session`) and, if there is none, renders the Turnstile widget in
   place of the intro.
2. On success the widget token is sent to `POST /api/session`, which runs
   canonical **siteverify** (`success`, `action: "open"` and an allowed
   `hostname`), then returns a signed session token valid for **30 minutes**.
3. The browser keeps that token in `sessionStorage` and sends it as
   `x-turnstile-session` on every `/api/poem` call. `/api/poem` returns
   `401 { code: "turnstile_required" }` when the session is missing or has
   expired, and the gate reappears (then the pending frame is retried).

The session is an HMAC-SHA256 token over its own expiry, keyed by a derivation of
`TURNSTILE_SECRET`; there is no session database. The browser **never** calls
siteverify.

| Variable                    | Required | Notes                                                                 |
| --------------------------- | -------- | --------------------------------------------------------------------- |
| `PUBLIC_TURNSTILE_SITEKEY`  | no       | Public widget site key; baked in at build time, literal fallback in code |
| `TURNSTILE_HOSTNAMES`       | yes      | Comma-separated hostnames accepted from siteverify. Production sets this in `wrangler.jsonc`; local dev uses `localhost,127.0.0.1` |
| `TURNSTILE_SECRET`          | yes      | Secret. `wrangler secret put TURNSTILE_SECRET` in production           |

Production must never include `localhost` or `127.0.0.1` in `TURNSTILE_HOSTNAMES`.
The widget itself must be registered for each hostname that serves it.

## Deployment

The site is static assets plus a small Worker, deployed to **Cloudflare Workers**
via Workers Builds:

```text
Build command:    bun run build
Deploy command:   bunx wrangler deploy
Output directory: dist
```

`wrangler.jsonc` uploads `dist/` as static assets (binding `ASSETS`) and routes
`/api/*` to the Worker first (`run_worker_first`), leaving everything else
asset-first with the pretty 404 page (`not_found_handling: "404-page"`).
**Selective `run_worker_first` needs Wrangler ≥ 4.20.0.** The Worker lives at
`worker/index.ts` and is bundled and deployed by `wrangler`; Astro still builds
the frontend as a plain static site, so no Astro adapter is used.

The production origin is `https://poem-camera.happypaul55.com`, set as `site` in
`astro.config.mjs` and mirrored in `src/content/site/settings.json` (`url`) and
`public/robots.txt`. If the domain changes, change all three and rebuild.

Production uses the Workers AI binding, so no AI secret is required. If you
prefer the OpenAI-compatible HTTP path instead, set the secret before the first
deploy. `TURNSTILE_SECRET` is always required for the human check:

```bash
bunx wrangler secret put TURNSTILE_SECRET
bunx wrangler secret put AI_API_KEY
# and AI_ENDPOINT / AI_MODEL as vars or secrets; TURNSTILE_HOSTNAMES is a var in wrangler.jsonc
```

## Content and code layout

| What                                                | Where                                |
| --------------------------------------------------- | ------------------------------------ |
| Site metadata, author, repo/licence                 | `src/content/site/settings.json`     |
| Page copy and sections                              | `src/components/sections/*.astro`    |
| Header / footer / metadata + JSON-LD                | `src/components/layout/*.astro`      |
| Design tokens and component classes                 | `src/styles/global.css` (`@theme`)   |
| Poem forms (single source of truth)                 | `src/lib/poem-forms.ts`              |
| Poem styles / poets (single source of truth)        | `src/lib/poem-styles.ts`             |
| Prompt, streaming line parser and generators        | `src/lib/poem-source.ts`             |
| `/api/poem` handler                                 | `src/lib/poem-api.ts`                |
| Human check: server / browser / gate                | `src/lib/turnstile.ts` · `src/lib/turnstile-client.ts` · `src/components/app/TurnstileGate.tsx` |
| React island (app shell, camera, dialogs, settings) | `src/components/app/**`              |
| Client hooks and printer driver                     | `src/lib/app/**`                     |
| `/app` page shell that mounts the island            | `src/pages/app.astro`                |
| Worker entry (Worker + static assets)               | `worker/index.ts`                    |
| Privacy notice                                      | `src/content/legal/privacy.md`       |
| Zod schemas for the two collections                 | `src/content.config.ts`              |
| Icons, favicons, manifest                           | `public/icons/`                      |
| Self-hosted fonts                                   | `public/fonts/`                      |

`src/content/site/settings.json` is an **array** with `id: "main"` (required by
Astro's `file()` loader); the site reads `getEntry("site", "main")`. Adding a field
there without updating the schema in `src/content.config.ts` fails the build.

## How the app is built

The landing, privacy and 404 pages ship **no JavaScript**. Only `/app` does,
because it is interactive, and it is a React island
([`@astrojs/react`](https://docs.astro.build/en/guides/integrations-guide-react/),
`client:load`) that Astro server-renders into the page and then hydrates.

- **`src/lib/app/use-camera.ts`** — camera access with no third-party component:
  permission, device enumeration, camera switching, and canvas frame capture.
- **`src/lib/poem-source.ts`** exposes a single **`PoemGenerator`** interface with
  two implementations, chosen at runtime by `resolvePoemGenerator`: the Workers
  AI binding (`env.AI`) and any OpenAI-compatible HTTP endpoint. `poem-api.ts`
  picks the binding when the Worker has one and falls back to
  `AI_ENDPOINT` + `AI_API_KEY` otherwise.
- **`src/lib/app/poem-client.ts`** — the browser client for `/api/poem`. It reads
  the newline-delimited stream, calls back as the title and each line complete,
  and resolves with the finished poem; errors carry typed `PoemApiError` kinds
  (`network` / `server` / `format`).
- **`src/lib/app/use-poem.ts`** — turns a captured frame into a poem via
  `/api/poem`, streaming the title and lines into `draft` state and aborting any
  in-flight request when the frame changes.
- **`src/lib/app/use-printer.ts`** and **`src/lib/app/web-bluetooth-receipt-printer/`**
  — the Bluetooth thermal printer driver (ported from the original app).
- **`src/components/app/**`** — the views. Dialogs are native `<dialog>` elements;
  selects are native `<select>`/`<optgroup>`. There is no UI component library.

App preferences are persisted in `localStorage` under the original keys
(`appSettings`, `poemSettings`, `printerSettings`), so returning users keep their
settings.

Only the **Bluetooth** thermal driver is wired up, exactly as before; the USB and
serial options are recorded but not connected.

## Privacy

The camera stream stays on the device. A single frame is sent to this site's own
`/api/poem` endpoint — and on to the configured AI provider — only when you ask
for a poem, and it is not stored. Opening `/app` also runs a Cloudflare Turnstile
human check (IP address and standard request details) to protect that endpoint,
and the resulting 30-minute token is kept in `sessionStorage`. There are no
accounts, no cookies of our own and no analytics. `src/content/legal/privacy.md`
explains this and must be updated before anything else that collects personal data
is added.

## Icons and fonts

- Icons are generated from `public/icons/brand-mark.svg` (an ink camera on an
  electric-yellow tile) with `bun run icons` (the `favicons` package via
  `scripts/generate-icons.mjs`). Replace the SVG and re-run the script to rebrand.
  The social/Open Graph image is `public/icons/apple-touch-icon-1024x1024.png`.
- Fonts are self-hosted latin-subset woff2 files in `public/fonts/`: Space Grotesk
  (variable, display + body) and Space Mono (400/700, labels). Space Grotesk is
  preloaded in `src/layouts/BaseLayout.astro`. To swap typefaces, update the
  `@font-face` rules, the preload link and the `--font-display` / `--font-body` /
  `--font-mono` tokens in `src/styles/global.css`. `scripts/fetch-fonts.mjs` is a
  one-off Google Fonts helper, not part of the build.

## SEO, headers and caching

- Unique `<title>`, meta description and canonical URL per indexable page; Open
  Graph and Twitter cards; a generated icon set and web manifest.
- JSON-LD `@graph` of `WebApplication` (the camera), `Website` and the author
  `Person` (linking to `happypaul55.com`), plus a `BreadcrumbList` on sub-pages.
- `sitemap-index.xml` (via `@astrojs/sitemap`) and `robots.txt`; the 404 is
  `noindex` and excluded from the sitemap.
- `public/_headers` sets security headers (CSP, HSTS, `nosniff`, frame denial) and
  long-lived caching. Note `Permissions-Policy: camera=(self)` — the camera is
  needed, so `camera=()` would silently break it. The CSP allows `img-src data:`
  for the captured frame, keeps the AI call server-side (`connect-src 'self'`),
  and adds `https://challenges.cloudflare.com` to `script-src`/`connect-src`/
  `frame-src` for the Turnstile widget.
- `public/_redirects` is present and empty (no legacy URLs yet).

## Licence

Released under the **GNU Affero General Public License v3.0** — see `LICENSE`.
The licence is linked from the site footer and recorded in `settings.json`
(`license`, `licenseUrl`).
