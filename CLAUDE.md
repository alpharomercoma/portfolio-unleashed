# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This repo is **pnpm-only** — `npm install` fails an ERESOLVE peer conflict (`@sanity/code-input` wants `sanity@^5||^6`; the repo pins `sanity@4`).

```bash
pnpm install
pnpm dev            # Turbopack dev server on :3000 (runs Sanity typegen first via predev)
pnpm build          # production build — next build --webpack (runs typegen first)
pnpm start          # serve the production build
pnpm lint           # eslint . --max-warnings 0
pnpm lint:fix       # eslint . --fix
pnpm typecheck      # tsc --noEmit  (the webpack build also type-checks)
pnpm typegen        # regenerate sanity.types.ts from the Sanity schema
```

- **A local `pnpm build` writes `public/sw.js`.** If a browser still has a service worker registered for localhost:3000 from an earlier `pnpm start`, that file makes it take over the dev page and reload in a loop. `predev` deletes it; if you start `next dev` directly, delete `public/sw.js` yourself.
- **Production builds use webpack, dev uses Turbopack.** The Next 16 default Turbopack _production_ build panics for this project (`Dependency tracking is disabled…`), so `build` pins `--webpack`. Don't switch it back.
- **The app builds and runs with zero environment variables.** Every var in `src/env.ts` (typed via `@t3-oss/env-nextjs`) is optional; features degrade gracefully. Without creds the blog shows empty states, `/speaking` and collections serve committed JSON seeds, and admin is read-only. See `.env.sample` for the annotated list.
- There are **no tests** in this repo. Verify changes with `pnpm typecheck` + `pnpm build`.

### Seeding the data store

```bash
pnpm seed-talks                        # push data/talks.seed.json into Upstash
pnpm seed-collections                  # push all collection seeds
pnpm seed-collections recommendations  # push only one collection (won't clobber others)
```

These no-op with a message when Upstash isn't configured.

## Architecture

Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · shadcn-style Radix primitives. A marketing/portfolio site plus a session-gated `/admin` dashboard.

### Content stores and the seed-as-fallback pattern

Content lives in **Upstash Redis** (talks, collections, about) and **Sanity** (blog). The key pattern to understand before touching any data path (`src/lib/talks/store.ts`, `src/lib/collections/store.ts`, `src/lib/about/`):

- The committed `data/*.seed.json` files serve **three roles at once**: the no-credentials fallback (local dev / credential-less builds), the canonical data the `seed-*` scripts push into Redis, and the source-of-truth checked into git.
- Reads go through `unstable_cache` with a **tag** (e.g. `TALKS_TAG`). Admin write actions call `updateTag`/`revalidateTag`, so Redis is queried only on a cache miss, not per request.
- **Every write is Zod-validated at the store boundary** (`talkSchema.parse(...)` in `upsertTalk`, mirrored in collections) — invalid data never reaches Redis. Reads use `safeParse` and log-and-drop corrupt items rather than throwing.
- Legacy records are normalized forward in code (e.g. `normalizeLegacy` maps the old `needsReview` boolean onto the `status` draft/published field) instead of via data migrations.

### Registry-driven collections

`src/lib/collections/registry.ts` defines every admin-managed section (selected work, projects, awards, certifications, recommendations, gallery) declaratively. **Adding a new section = one `CollectionConfig` entry** (Zod schema + form `fields` + `sort` + `summary`); the generic list UI, form UI, and store all read from the registry. `reorderable: true` turns the admin list into a dnd-kit drag-to-reorder list (used for `byOrderAsc`-sorted collections; the `order` field is rewritten on drop and dropped from the form).

### Auth

`jose`-signed JWT in an HTTP-only cookie. `src/middleware.ts` gates `/admin/*` (matcher excludes `/admin/login`), redirecting unauthenticated requests to login with a `?next` back-link. Auth helpers live in `src/lib/auth.ts` / `session.ts`. Login is brute-force rate-limited (`src/lib/ratelimit.ts`, Upstash Ratelimit) and can email sign-in/lockout alerts via Resend (`src/lib/notify.ts`).

### AI "Draft from slides"

`/admin` can turn a Google Slides / public PDF link into a filled-in talk draft. Server actions in `src/app/admin/talk-ai-actions.ts`; logic in `src/lib/talks/{ai-draft,drafters,draft-schema}.ts` using the Vercel AI SDK + Mistral (`@ai-sdk/mistral`, model must support PDF document understanding). The deck fetch is SSRF-guarded and the action is rate-limited.

### Layout

```
src/
  app/
    (marketing)/         # /, /about, /gallery, /privacy
    speaking/            # /speaking + /speaking/[slug] — one talk → many events; draft/published status
    blog/  studio/       # Sanity-backed blog + embedded Studio
    admin/               # dashboard; *-actions.ts server actions (talks, auth, collections, talk-ai)
    api/admin/{upload,media}   # Blob upload + media library (session-gated)
    sitemap.ts robots.ts manifest.json sw.ts
  lib/                   # talks/ collections/ about/ + auth, session, ratelimit, blob, notify, redis, seo, logger
  middleware.ts env.ts
data/                    # JSON seeds (canonical + fallback)
scripts/                 # typegen, seed-*, migrate-images-to-blob
```

Images live in **Vercel Blob** under the `media/` prefix (public store required); uploads are magic-byte-validated.

## Conventions

- **Conventional Commits with lowercase subjects**, enforced by commitlint via a husky `commit-msg` hook. `lint-staged` runs `eslint --fix` + Prettier on staged files on commit.
- `sanity.types.ts` and `public/sw.js` / `public/swe-worker-*.js` are **generated** (git-ignored where applicable) — don't hand-edit; they're excluded from ESLint.
- PWA offline support via Serwist (`src/app/sw.ts` → generated worker, `/offline` fallback).
