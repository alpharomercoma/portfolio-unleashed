# Design System, alpharomer.com

> Reference for the Nebius-inspired rebrand. Read this before changing visuals so
> the site stays consistent. The goal: build rapport, showcase real achievements,
> and make "book a call / get in touch" feel easy, never pushy.

## 1. Direction

Bold lime on black and white, modeled on the current **Nebius homepage** (not the
muted About page): a large flowing lime gradient hero, confident black headlines,
dramatic full-bleed dark sections, and lime-tinted surfaces. Energetic, premium,
and distinctive. The bar is a top-tier big-tech employee portfolio, never a
generic minimal AI-startup template.

**Tone:** precise, engineering-forward, confident. Let the work and the numbers
talk. No hype words, no invented copy, no sections without real data.

**Lesson from v1:** copying the muted About page (flat white, lime as a tiny 10%
dot, lots of gray) read as bland and generic. Use lime **boldly**.

## 2. Color, black, white, and bold lime

Three colors only. Lime is a **dominant brand color**, not a timid accent. Mix is
roughly: white/off-white as the base canvas, ink for text and full dark sections,
and lime used confidently as gradients, large fills, tinted surfaces, marker
highlights, and the primary CTA.

| Role             | Tokens                                                                                      | Usage                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Base** (white) | `background` `#FFFFFF`, `secondary`/`muted` `#F4F5F3`                                       | Page canvas, most cards                                                                      |
| **Ink** (black)  | `foreground` `#16171A`; dark sections via `.dark` (`#0D0E10`)                               | Text, one or two full-bleed dark feature sections                                            |
| **Lime** (bold)  | `lime` **`#E0FF4F`**, `lime-soft` `#EAFF8C`, `lime-wash` `#F3FFCE`, `lime-strong` `#AACF1F` | Hero gradient field, the CTA field, lime-wash sections, marker highlights, primary CTA, tags |

**Lime rules (do not break):**

- Use lime **boldly**: the hero gradient (`.hero-lime-field`), a full lime CTA
  panel, `bg-lime-wash` section surfaces, and `.lime-mark` keyword highlights are
  all encouraged. It is the brand, not a garnish.
- Lime is light, so **text/icons on lime must be ink** (`text-ink`), never white.
  Verified WCAG AA: ink on `#E0FF4F` is ~15:1.
- Never use `lime` or `lime-strong` as **text or meaningful icons on white** (they
  fail contrast). For a lime word on a light surface, use `.lime-mark` (lime
  background, ink text). On **dark** sections, `text-lime` is fine and pops.
- Keep it to these three colors. Do not reintroduce the old multicolor.

Exact Nebius source values sampled from nebius.com: lime `#E0FF4F` (+ `#E8FF7E`),
used as a `background` fill on the live site. We use neutral (hue-less) grays so
lime is the only chromatic note.

Tokens live in `src/app/globals.css` (`:root` light, `.dark` sections) and are the
**only** place colors are defined. Components consume them through Tailwind
utilities (`bg-background`, `text-foreground`, `bg-lime`, `bg-lime-wash`,
`text-ink`, `text-muted-foreground`, `border-border`). Never hard-code a hex in a
component.

### Dark feature sections

Wrap a section in `className="dark bg-background text-foreground"` and it flips to
the ink palette using the same shadcn tokens; `text-lime` and `bg-lime` accents
pop against it (e.g. the Speaking section, our "Built by builders" moment). Use
one or two per page.

### Accessibility (WCAG AA)

All body/secondary text must clear 4.5:1; `--muted-foreground` is `#52555B` for
this. Icons that carry meaning must clear 3:1. Audit token pairs after any color
change. Keyboard focus rings stay visible.

### Copy

No em (—) or en (–) dashes anywhere in copy. Reword with commas, periods, or
colons. (Hyphens and × are fine.)

## 3. Typography

| Role                            | Family                | Token / utility       | Notes                                               |
| ------------------------------- | --------------------- | --------------------- | --------------------------------------------------- |
| Display (h1–h4, section titles) | **Schibsted Grotesk** | `font-display`        | Tight tracking (−0.02 to −0.03em), weight 600–700   |
| Body / UI                       | **Hanken Grotesk**    | `font-sans` (default) | 400/500/600, `leading-relaxed` for prose            |
| Mono (stats, tags, dates)       | **Geist Mono**        | `font-mono`           | The "engineering" motif: numbers, tag labels, dates |

Loaded via `next/font/google` in `src/app/layout.tsx`. Headings auto-use
`font-display` and are **bold** (700) for energy. Helpers: `.display-xl/lg/md`,
`.lede` (muted subtitle), `.lime-mark` (lime keyword highlight).

Scale guide: hero `display-xl` (to `text-7xl`), section title `display-lg`,
card/sub `display-md`. Body `text-base`/`text-lg`.

**No uppercase mono "eyebrow" labels above headings** (a generic AI-template tic,
removed in v2). The section is identified by its bold statement heading, often
with a `.lime-mark` keyword.

## 4. Spacing, borders, radius

Consistency here is what separates polished from amateur, the brief called it
out explicitly.

- **Container:** `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` (one container, reused).
- **Section rhythm:** vertical padding `py-20 sm:py-24 lg:py-28`. Keep it uniform
  section-to-section; alternate `bg-background` / `bg-secondary` for separation
  rather than ad-hoc margins.
- **Grid gaps:** `gap-4` (tight), `gap-6` (default cards), `gap-8` (lead layouts).
  Pick one per grid; don't mix.
- **Card padding:** `p-6` (default) → `p-8` (lead/feature).
- **Borders:** 1px hairline only, `border border-border`. On dark, `border-white/10`.
  No heavy/colored borders. Lime is never a border on light surfaces.
- **Radius:** base `--radius` = `0.875rem`. Cards `rounded-2xl`/`rounded-3xl`,
  buttons & tags **pill** (`rounded-full`), inputs `rounded-lg`. Be consistent
  within a component group.
- **Dividers:** prefer whitespace + a single `border-border` hairline over rules.

## 5. Components (shadcn + Tailwind only)

Build from the existing shadcn primitives in `src/components/ui/` (`button`,
`badge`, `card`, `carousel`, `input`, …). No bespoke CSS rules, no inline
`style={}` except genuinely dynamic values (e.g. an image aspect ratio).

- **Buttons:** primary = lime pill, ink text (`bg-primary text-primary-foreground
rounded-full`). Secondary = `variant="outline"` (ink border/text). Ghost for
  tertiary. One primary action per view.
- **Tags / category chips:** small pill, `border-border` + `text-muted-foreground`,
  or ink-filled on dark. Used to label work (e.g. "Accelerated Computing").
- **Cards:** white, hairline border, `rounded-2xl`, subtle hover lift
  (`hover:-translate-y-0.5 transition` + `hover:border-foreground/20`). No drop
  shadows heavier than `shadow-sm`.
- **Stat block:** mono numerals, oversized, ink panel (`.dark`) with lime on the
  single hero metric.

## 6. Motion

Restraint, one orchestrated entrance per section, no scattered micro-animations.
Current implementation: a shared `IntersectionObserver` adds `.animate-fade-up`
to elements marked `.animate-on-scroll opacity-0` as they enter view (staggered
via `animationDelay`); card grids use the `fadeIn` keyframe on mount. Keyframes
live in `globals.css`. `framer-motion` is installed and is the preferred tool for
any richer/new motion. Keep the affiliations marquee subtle; respect
`prefers-reduced-motion`.

## 7. Section inventory (home)

Lean, "big-tech minimal" order, every section earns its place with real data:

1. **Navbar**, wordmark (ink + lime mark), anchors, one lime CTA.
2. **Hero**, name + one-line positioning, primary CTA, mono stat block (one lime
   metric), affiliations marquee.
3. **Selected work**, _merged_ value-props + featured: 1 lead card + 3 supporting
   cards, each tagged with a pillar (Multimodality / Accelerated Computing /
   Community / Applied AI). Keeps the strongest real images.
4. **Projects**, ML + software, carousel.
5. **Speaking**, talks grid.
6. **Writing**, latest posts (Sanity; empty-state safe).
7. **Recognition**, _merged_ certifications + awards.
8. **Recommendations**, short quote strip (compact, not a heavy section).
9. **CTA**, "Book a call" + email, calm and non-pushy (reuses `calendar-modal`).
10. **Footer**.

Content guardrails: results-first (quantify with real numbers, $376K grant, 92%
VLM accuracy, 25+ talks). Never fabricate metrics, logos, testimonials, or
sections. If there's no data for a section, it doesn't exist.

## 8. Responsive

Breakpoints to verify every change at: **1440** (desktop), **768** (tablet),
**375** (mobile). Single-column on mobile, 2–3 up on desktop. Tap targets ≥ 44px.
Test with the Playwright CLI:

```
npx playwright screenshot --browser=chromium --viewport-size=1440,2400 --full-page http://localhost:3000 shot.png
```

## 9. Do / Don't

**Do:** use lime boldly (gradient hero, lime CTA field, lime-wash sections, marker
highlights); **vary** section surfaces and headers for rhythm (white, secondary,
dark, lime-wash); single container; hairline borders; mono for numbers; quantify
outcomes; one primary CTA per view; bold display headings.

**Don't:** reintroduce the old blue/red/yellow/green multicolor; use lime or
lime-strong as text/icons on white (fails contrast); add uppercase mono eyebrow
labels; use a centered dark "let's build together" SaaS CTA; repeat one formulaic
eyebrow + heading + grid rhythm; write filler copy or empty sections; use em/en
dashes; mix radius/gap scales within a group.

## 10. Speaking pages (`/speaking`)

Talk-centric, text-forward (content is king), modeled on smatoto.dev but in our
brand. Data lives in Upstash Redis (`src/lib/talks/store.ts`) with the committed
`data/talks.seed.json` as fallback + seed source; managed via the authed `/admin`.

- **Model:** a _talk_ (topic) has type, category, level, duration, language, tags,
  abstract, outline, key takeaways, and an `events[]` array (each delivery:
  organizer, date, venue, audience, slide/video links). One talk, many events.
- **Index (`/speaking`):** stat band (talks, sessions, developers reached, years),
  category filter chips, lean `TalkCard`s (lime category dot, mono meta).
- **Detail (`/speaking/[slug]`):** statement title, metadata bar (hairline-divided
  cells), tag chips, abstract, numbered outline, lime-dot key takeaways, slide
  embed + open-in-new-tab, and a "Delivered N times" events table.
- **Restraint:** lime only as the category dot, one stat highlight, and key-takeaway
  bullets. No per-card imagery by default; showcase images are optional (Blob).
- **Admin (`/admin`):** password + signed-cookie auth (`src/lib/auth.ts`,
  `src/middleware.ts`); CRUD via server actions; line-based fields for arrays and a
  JSON editor for events; optional image upload to Vercel Blob.
