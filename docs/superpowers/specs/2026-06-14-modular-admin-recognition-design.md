# Modular admin + editable recognition/recommendations + podcast talk type

Date: 2026-06-14

## Goal

Make Certifications, Awards, and Recommendations editable from the admin
(today they are hardcoded arrays in their section components), restructure the
admin from talks-only into a modular dashboard that hosts multiple content
types, and add a "Podcast" talk type that has no level.

## Decisions (confirmed with owner)

- Scope: Certifications + Awards + Recommendations all become admin-managed now.
- Architecture: a reusable "collection" framework drives the three flat content
  types from config. Talks keep their bespoke pages/form.
- Images (cert logos, award images): picked from files already in `public/`
  plus an optional custom path. No Blob upload (the Blob store is private).
- Add `Podcast` to the talk `type` enum; make talk `level` optional and hide it
  for podcasts.
- Persistence uses the existing Upstash store; without it the admin is
  read-only and the public sections render the committed seed (same contract as
  talks).

## Architecture

### Collection framework (`src/lib/collections/`)

- `schema.ts` — zod schemas: `Certification { id, title, issuer, logo, date, link }`,
  `Award { id, title, organization, year, image, context, category }`,
  `Recommendation { id, quote, author, role }`.
- `registry.ts` — one `CollectionConfig` per type:
  `{ key, labelSingular, labelPlural, schema, idFrom(item), fields: FieldConfig[],
sort(items), summary(item), seed }`.
  `FieldConfig = { name, label, kind, required?, options?, optionsFrom?, help?, placeholder? }`
  with `kind` in `text | textarea | date | number | select | checkbox | lines | image`.
  Adding a future section = add one config entry.
- `store.ts` — generic Upstash store keyed `col:<key>:item:<id>` plus a
  `col:<key>:ids` set, with `data/<key>.seed.json` fallback. Mirrors the talks
  store's try/catch + seed degradation so the build stays green with no creds.
  Exposes `getAll(key)`, `getItem(key, id)`, `upsert(key, item)`, `remove(key, id)`.

### Data migration (`data/`)

- `certifications.seed.json` (27), `awards.seed.json` (6), `recommendations.seed.json`
  (10) lifted verbatim from the current hardcoded arrays, each item given a
  stable slug id. Seeding pushes them to Upstash (extend the seed script).

### Admin (routes)

`talks` is a static segment, so a dynamic `[collection]` segment does not collide.

- `src/app/admin/layout.tsx` — shared header/nav (Talks · Certifications ·
  Awards · Recommendations) + logout.
- `/admin` — dashboard hub: a card per section with live counts + Manage link.
- `/admin/talks` — existing talks list (moved out of the old `/admin/page.tsx`);
  `/admin/talks/new`, `/admin/talks/[slug]` unchanged.
- `/admin/[collection]` — generic list (rows + edit/delete + New). 404 on unknown key.
- `/admin/[collection]/new`, `/admin/[collection]/[id]` — generic `CollectionForm`.

### Admin UI (`src/components/admin/`)

- `collection-form.tsx` — renders inputs from `FieldConfig` (image = picker of
  existing files + custom path; lines = textarea split on newlines).
- list rendering + delete reuse shadcn input/label/textarea/select/button.
- On-brand styling: ink/lime, hairline-bordered cards, consistent with the site.

### Server actions (`src/app/admin/collection-actions.ts`)

- `saveCollectionItem(key, formData)` and `removeCollectionItem(key, formData)`:
  session-gated, validate via the config schema, upsert/remove, then revalidate
  `/` and the relevant admin paths.

### Public sections become presentational

- `page.tsx` (server) fetches the three collections and passes them as props to
  `RecognitionSection` (awards + certifications) and `RecommendationsSection`.
  The carousel UI is unchanged.

### Podcast talk type

- `talkSchema`: `type` enum gains `Podcast`; `level` becomes optional.
- `talk-form.tsx`: add Podcast to the type select; hide Level when type is Podcast.
- `saveTalk`: persist a level only for types that have one.
- `TalkCard` + detail page: render meta as `[type, level, sessions].filter(Boolean).join(" · ")`.

## Verification

1. `tsc --noEmit` clean; `pnpm build` with no `.env` completes (seed fallback);
   `grep -rn "[—–]" src` empty.
2. With Upstash configured: create/edit/delete a certification persists and the
   public Recognition section reflects it.
3. Playwright/chromium screenshots: `/admin` hub, a `/admin/certifications/new`
   form, and the public Recognition + Recommendations sections still correct.
4. Podcast: a talk with type Podcast shows no level in the card/detail and the
   form hides the Level field.

## Out of scope

- Blob image upload (needs a public Blob store).
- Folding talks into the generic framework (talks stay bespoke).
