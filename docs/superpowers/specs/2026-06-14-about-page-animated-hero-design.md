# Spec: Editable About page + animated lime hero (2026-06-14)

## Context

The portfolio (Next.js 16, React 19, Tailwind v4, Upstash Redis + Vercel Blob,
single-admin auth) needs two additions:

1. A personal **About** page that shows character, authored by the owner through
   the admin with a **markdown editor** (live preview + image upload to Vercel
   Blob), stored in **Upstash Redis**, rendered publicly, verified with Playwright.
2. The hero's static neon-green field should **drift** subtly (currently a static
   CSS radial-gradient), performant on mobile + desktop, respecting
   `prefers-reduced-motion`.

Owner decisions (brainstorm): dedicated `/about` page; markdown + live preview
editor; drifting-blobs animation.

## Feature 1 — About page

### Data model (Upstash Redis singleton)

A single document, NOT a collection. Key `about:doc`:

- `title: string` (page H1, e.g. "About me")
- `body: string` (markdown; embedded images are Blob URLs via `![alt](url)`)
- `updatedAt: string` (ISO)

Validated with `zod` (`src/lib/about/schema.ts`). Committed
`data/about.seed.json` is the no-credentials fallback and initial content
(tasteful placeholder the owner replaces).

### Store (`src/lib/about/store.ts`, server-only)

- `ABOUT_TAG = "about"`.
- `getAbout()` -> cached via `unstable_cache(readAbout, ["about"], { tags: [ABOUT_TAG] })`.
  `readAbout` reads `about:doc` from Redis; on missing/unconfigured/error returns
  the seed (graceful degradation, mirrors talks/collections stores).
- `saveAbout(doc)` -> validate, `redis.set("about:doc", parsed)`. Throws if Redis
  unconfigured.

### Image upload (`src/app/api/admin/upload/route.ts`)

- `POST`, session-gated (reject 401 if no session). Accepts multipart `file`.
- `put("about/<timestamp>-<name>", file, { access: "public", addRandomSuffix: true })`
  to Vercel Blob; returns `{ url }`. Requires `BLOB_READ_WRITE_TOKEN`; returns a
  clear 500 message when absent. Timestamp comes from the request (not build time).

### Admin (`/admin/about`)

- Singleton editor page (no list). Server page loads `getAbout()`, passes to a
  client `AboutForm`.
- `AboutForm` (`src/components/admin/about-form.tsx`, client): `@uiw/react-md-editor`
  (dynamic import, `ssr:false`) bound to a `body` state; a hidden input carries the
  markdown into the form. Toolbar includes an image command that uploads the chosen
  file to `/api/admin/upload` and inserts `![alt](url)` at the cursor; drag/drop and
  paste do the same.
- Submits through a directly-imported server action `saveAboutAction(formData)`
  (`src/app/admin/about-actions.ts`): session gate, build doc, `saveAbout`,
  `updateTag("about")`, `revalidatePath("/about")`, `revalidatePath("/")`, redirect
  back with a saved flag.
- Add an "About" item to the admin nav (`layout.tsx`) and an About card to the hub
  (`/admin`).

### Public page (`src/app/about/page.tsx`)

- `getAbout()`, render `title` + markdown `body` with `react-markdown` + `remark-gfm`
  (no raw-HTML rendering -> XSS-safe). Styled in the site's lime/ink system with a
  `prose`-like treatment; images rendered rounded/bordered via custom components.
- `generateMetadata`: title, description (first ~155 chars of body, stripped of
  markdown), canonical `/about`, OpenGraph (`type: article`, `/og.png` fallback
  image) + Twitter card. JSON-LD `ProfilePage`/`Person` + breadcrumb.
- Add "About" to navbar + footer nav.

### Libraries

`@uiw/react-md-editor` (editor + preview, client-only), `react-markdown` +
`remark-gfm` (public render). Fallback if `@uiw/react-md-editor` is incompatible
with React 19/Next 16: a plain textarea + a live `react-markdown` preview pane and
a manual upload button (same upload route).

## Feature 2 — Drifting lime hero blobs

- Keep the static `.hero-lime-field` background as the instant-paint base/fallback.
- Add 2-3 `aria-hidden`, `pointer-events-none` blurred lime blob `<div>`s behind the
  hero content (inside `#about`, before the content container).
- Animate ONLY `transform: translate()/scale()` with slow keyframes (22-32s,
  `ease-in-out`, `infinite`, `alternate`), staggered per blob; `will-change: transform`.
  Low opacity + small translate range => ambient, not overpowering. Same on mobile
  (transforms are GPU-composited).
- `@media (prefers-reduced-motion: reduce)`: `animation: none` (blobs rest static).
- Keyframes + blob classes live in `globals.css` (no bespoke inline CSS in TSX).

## Verification

1. `pnpm exec tsc --noEmit` clean.
2. Playwright: login -> `/admin/about` -> type markdown + upload an image ->
   save -> assert `/about` renders the new title, body, and the uploaded image ->
   (proves Blob + Redis + `updateTag` invalidation). Screenshot `/about` and the
   hero (desktop + mobile); confirm blobs render and motion is subtle.
3. `pnpm build` with `.env.local` moved aside completes (About falls back to seed;
   upload route degrades).
4. `grep -rn "[—–]" src` empty; lowercase commit subjects.

## Out of scope

Versioning/history of the About doc; multiple about documents; WYSIWYG (Tiptap);
animating the hero gradient via background-position (rejected for mobile jank).
