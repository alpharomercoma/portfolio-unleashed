# Alpha Romer Coma — Portfolio

A personal portfolio and speaking site built with the Next.js App Router. Beyond
the marketing pages it ships a self-serve **admin dashboard**: an editable talks
catalogue, registry-driven content collections, a markdown About page, an image
library, and an AI "draft a talk from your slides" feature. Content lives in
Upstash Redis (with committed JSON seeds as the no-credentials fallback), images
in Vercel Blob, and the blog in Sanity.

Production site: <https://alpharomer.com>

---

## Features

- **Home / About / Gallery / Privacy** — static-first marketing pages.
- **Speaking** (`/speaking`, `/speaking/[slug]`) — a talk catalogue modeled as one
  talk → many delivery events, with abstract, outline, takeaways, tags, slides
  embed, and per-event venue/date/audience. Talks have a **Draft / Published**
  status; drafts are hidden from the public site.
- **Blog** (`/blog`, `/blog/[slug]`) — powered by **Sanity**, edited in the
  embedded Studio at `/studio`.
- **Admin dashboard** (`/admin`) — session-gated:
  - **Talks** editor with a structured, repeatable events editor and a Blob image
    picker.
  - **Draft from slides** — paste a Google Slides or public PDF link and Mistral
    fills in the title, abstract, outline, key takeaways, and tags (the deck fetch
    is SSRF-guarded; the action is rate-limited).
  - **Collections** — generic, registry-driven CRUD for _selected work, projects,
    awards, certifications, recommendations, and gallery_. The order-based ones are
    **drag-to-reorder**.
  - **About** — markdown editor with image upload.
- **PWA** — offline support via Serwist (`/offline` fallback).
- **SEO** — native `sitemap.ts` / `robots.ts`, per-page metadata, JSON-LD, OG image.
- **Security** — JWT cookie auth + middleware gate, brute-force-rate-limited login,
  baseline security headers, magic-byte-validated uploads, schema validation on
  every write, and email alerts on sign-in / lockout.

---

## Tech stack

| Area                   | Choice                                                                     |
| ---------------------- | -------------------------------------------------------------------------- |
| Framework              | Next.js 16 (App Router), React 19, TypeScript                              |
| Styling                | Tailwind CSS v4, `tailwindcss-animate`, shadcn-style UI primitives (Radix) |
| Content store          | Upstash Redis (talks, collections, about) + committed JSON seeds           |
| Media                  | Vercel Blob                                                                |
| Blog CMS               | Sanity (+ embedded Studio)                                                 |
| AI                     | Vercel AI SDK + Mistral (`@ai-sdk/mistral`)                                |
| Auth                   | `jose` JWT in an HTTP-only cookie + middleware                             |
| Rate limiting / alerts | Upstash Ratelimit + Resend                                                 |
| Validation             | Zod                                                                        |
| PWA                    | Serwist                                                                    |
| Package manager        | **pnpm**                                                                   |

---

## Getting started

### Prerequisites

- **Node.js 20+** (developed on Node 22)
- **pnpm** — this repo is pnpm-only. `npm install` fails an ERESOLVE peer conflict
  (`@sanity/code-input` wants `sanity@^5||^6`, the repo pins `sanity@4`).

### Install & run

```bash
pnpm install
cp .env.sample .env.local   # optional — the site runs without any env vars
pnpm dev                    # http://localhost:3000  (Turbopack dev server)
```

The site **builds and runs with no environment variables** — the blog renders empty
states, `/speaking` and the collections serve their committed JSON seeds, and the
admin is read-only. Add credentials (below) to enable persistence, uploads, the
blog, and AI drafting.

### Build

```bash
pnpm build    # runs `next build --webpack`
pnpm start
```

> **Why `--webpack`?** The Next 16 default Turbopack production build panics for this
> project (`Dependency tracking is disabled…`), so the `build` script pins webpack.
> Dev still uses Turbopack (`next --turbo`).

---

## Environment variables

Every variable is **optional**; features degrade gracefully when one is absent. All
secrets are server-only (validated in `src/env.ts` via `@t3-oss/env-nextjs`). See
`.env.sample` for the annotated list. Provision Upstash + Blob from the Vercel
Marketplace.

| Variable                                                                                | Enables                                                                       | Notes                                                                        |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`                                   | Persistent talks, collections, about + login rate-limit + AI-draft rate-limit | `KV_REST_API_URL` / `KV_REST_API_TOKEN` also accepted                        |
| `BLOB_READ_WRITE_TOKEN`                                                                 | Image uploads / media library (must be a **public** Blob store)               |                                                                              |
| `ADMIN_PASSWORD` / `AUTH_SECRET`                                                        | Admin sign-in                                                                 | `AUTH_SECRET`: `openssl rand -base64 32`                                     |
| `MISTRAL_API_KEY`                                                                       | The "Draft from slides" button                                                | Disabled without it                                                          |
| `MISTRAL_MODEL_ID`                                                                      | Override the Mistral model                                                    | Defaults to `mistral-small-latest` (must support PDF document understanding) |
| `TALK_DRAFTER`                                                                          | Select the draft provider                                                     | Defaults to `mistral`                                                        |
| `RESEND_API_KEY` / `RESEND_FROM` / `ALERT_EMAIL`                                        | Email alerts on sign-in / lockout                                             | No-op without the key                                                        |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET` / `_API_VERSION` / `SANITY_API_READ_TOKEN` | The blog + Studio                                                             |                                                                              |
| `NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN`                                              | Studio Presentation/preview                                                   | e.g. `http://localhost:3000`                                                 |
| `NEXT_PUBLIC_SITE_URL`                                                                  | Canonical origin for metadata/sitemap/JSON-LD                                 | Defaults to `https://alpharomer.com`                                         |
| `NEXT_PUBLIC_API_URL`                                                                   | Contact-form API client base URL                                              |                                                                              |

---

## Content & data model

| Content                                                                                 | Store                         | Seed / source          | Edited at             |
| --------------------------------------------------------------------------------------- | ----------------------------- | ---------------------- | --------------------- |
| Talks (+ events)                                                                        | Upstash Redis                 | `data/talks.seed.json` | `/admin/talks`        |
| Collections (selected work, projects, awards, certifications, recommendations, gallery) | Upstash Redis                 | `data/*.seed.json`     | `/admin/<collection>` |
| About                                                                                   | Upstash Redis (singleton)     | `data/about.seed.json` | `/admin/about`        |
| Blog posts                                                                              | Sanity                        | —                      | `/studio`             |
| Images                                                                                  | Vercel Blob (`media/` prefix) | —                      | admin image picker    |

The committed JSON seeds are both the **no-credentials fallback** and the canonical
source the seed scripts push into Upstash. Reads are cached with `unstable_cache`
and tagged; admin writes call `updateTag` so Upstash is queried on change, not on
every request. Every write is validated through its Zod schema before it is stored.

Collections are defined declaratively in `src/lib/collections/registry.ts` — adding
a new section is one registry entry (schema + fields + sort), and the generic list,
form, and store read from it.

### Seeding

```bash
pnpm seed-talks                          # push data/talks.seed.json to Upstash
pnpm seed-collections                    # push all collection seeds
pnpm seed-collections recommendations    # push only one collection (won't clobber others)
```

(No-ops with a message when Upstash isn't configured.)

---

## Scripts

| Command                                     | Description                                        |
| ------------------------------------------- | -------------------------------------------------- |
| `pnpm dev`                                  | Dev server (Turbopack); runs Sanity typegen first  |
| `pnpm build`                                | Production build (**webpack**); runs typegen first |
| `pnpm start`                                | Serve the production build                         |
| `pnpm typegen`                              | Generate Sanity types (`sanity.types.ts`)          |
| `pnpm seed-talks` / `pnpm seed-collections` | Seed Upstash from the JSON in `data/`              |

There is no working `lint`/`next lint` (removed in Next 16); type-check with
`pnpm exec tsc --noEmit` — the webpack build also type-checks.

---

## Project structure

```
src/
  app/
    (marketing)          # /, /about, /gallery, /privacy
    speaking/            # /speaking + /speaking/[slug]
    blog/                # Sanity-backed blog
    gallery/
    admin/               # dashboard: talks, collections, about, login
      actions.ts         # talk server actions
      auth-actions.ts    # login / logout
      collection-actions.ts
      talk-ai-actions.ts # "Draft from slides"
    api/admin/{upload,media}   # Blob upload + media library (session-gated)
    studio/              # embedded Sanity Studio
    sitemap.ts, robots.ts, manifest.json, sw.ts
  components/            # UI + admin components (image picker, sortable list, …)
  lib/
    talks/               # schema, Upstash store, ai-draft, drafters, draft-schema
    collections/         # registry, schema, store
    about/               # singleton store
    auth.ts, session.ts, ratelimit.ts, blob.ts, notify.ts, redis.ts, seo.ts, logger.ts
  middleware.ts          # gates /admin/*
  env.ts                 # typed, validated env (all optional)
data/                    # JSON seeds + source material
docs/design-system.md    # design system notes
```

---

## Conventions

- **Commits** follow Conventional Commits with **lowercase** subjects, enforced by
  commitlint via a husky `commit-msg` hook; `lint-staged` runs Prettier on staged
  files.
- Type-check before pushing: `pnpm exec tsc --noEmit`, then `pnpm build`.

---

## Deployment

Deploys to **Vercel**. Set the environment variables above in the Vercel project
(Production + Preview). The PWA service worker and `public/sw.js` are generated by
the webpack build and are git-ignored. The Blob store must be created as **public**.
