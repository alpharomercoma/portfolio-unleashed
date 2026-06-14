# Design System — alpharomer.com

> Reference for the Nebius-inspired rebrand. Read this before changing visuals so
> the site stays consistent. The goal: build rapport, showcase real achievements,
> and make "book a call / get in touch" feel easy — never pushy.

## 1. Direction

Monochrome canvas + a single electric-lime accent, modeled on the current
[Nebius](https://nebius.com/about) brand: confident black headlines on white,
generous negative space, hairline borders, and lime used only where it counts.
Distinctive but professional — the bar is a top-tier big-tech employee portfolio,
not a generic template.

**Tone:** precise, engineering-forward, quietly confident. Let the work and the
numbers talk. No hype words, no invented copy, no sections without real data.

## 2. Color — the 60 / 30 / 10 rule

This is the most important rule. Every screen should read as:

| Share   | Role                       | Tokens                                                                           | Usage                                                                        |
| ------- | -------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **60%** | White / off-white surfaces | `background` `#FFFFFF`, `secondary`/`muted` `#F4F5F3`                            | Page + most section backgrounds, cards                                       |
| **30%** | Ink black                  | `foreground` `#16171A`; dark panels via `.dark` (`#0D0E10`)                      | Text, a few full-bleed dark feature blocks                                   |
| **10%** | Lime                       | `lime` **`#E0FF4F`** (`primary`), `lime-soft` `#EAFF8C`, `lime-strong` `#B6D62F` | Primary CTA, one key stat/word, tags, focus ring (on dark), small highlights |

**Lime discipline (do not break):**

- Lime is for **emphasis only** — never a large fill on a light page. One or two
  lime moments per viewport, max.
- Lime is light, so **text/icons on lime must be ink** (`primary-foreground`),
  never white. (Verified WCAG AA: ink on `#E0FF4F` ≈ 15:1.)
- Need lime as text/icon on a white surface? Use `lime-strong` (`#B6D62F`) for
  contrast, or just use ink. Plain `#E0FF4F` text on white fails contrast.
- On dark panels, lime pops as the accent and as the focus ring.

Exact Nebius source values sampled from nebius.com: lime `#E0FF4F` (+ `#E8FF7E`,
`#D4F43E`), inks `#212529`/`#262626`, off-whites `#F2F2F2`/`#EFF2F8`, border
`#E8E8E8`. We use neutral (hue-less) grays so lime is the only chromatic note.

Tokens live in `src/app/globals.css` (`:root` light, `.dark` panels) and are the
**only** place colors are defined. Components consume them through Tailwind
utilities (`bg-background`, `text-foreground`, `bg-primary`, `bg-lime`,
`text-muted-foreground`, `border-border`). Never hard-code a hex in a component.

### Dark feature panels

Wrap a section (or card) in `className="dark"` and it flips to the ink palette
using the same shadcn tokens — `bg-background` becomes near-black, `bg-primary`
stays lime. Use sparingly: the hero stat block and at most one or two feature
blocks. That selective ink is the "30%".

## 3. Typography

| Role                            | Family                | Token / utility       | Notes                                             |
| ------------------------------- | --------------------- | --------------------- | ------------------------------------------------- |
| Display (h1–h4, section titles) | **Schibsted Grotesk** | `font-display`        | Tight tracking (−0.02 to −0.03em), weight 600–700 |
| Body / UI                       | **Hanken Grotesk**    | `font-sans` (default) | 400/500/600, `leading-relaxed` for prose          |
| Mono (stats, code, eyebrows)    | **Geist Mono**        | `font-mono`           | The "engineering" motif — numbers, labels, kbd    |

Loaded via `next/font/google` in `src/app/layout.tsx`. Headings auto-use
`font-display` (set in the base layer). Helpers: `.display-xl/lg/md`, `.eyebrow`
(mono, uppercase, tracked), `.lede` (muted subtitle).

Scale guide: hero `display-xl` (→ `text-6xl`), section title `display-lg`,
card/sub `display-md`. Body `text-base`/`text-lg`. Don't exceed this scale.

## 4. Spacing, borders, radius

Consistency here is what separates polished from amateur — the brief called it
out explicitly.

- **Container:** `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` (one container, reused).
- **Section rhythm:** vertical padding `py-20 sm:py-24 lg:py-28`. Keep it uniform
  section-to-section; alternate `bg-background` / `bg-secondary` for separation
  rather than ad-hoc margins.
- **Grid gaps:** `gap-4` (tight), `gap-6` (default cards), `gap-8` (lead layouts).
  Pick one per grid; don't mix.
- **Card padding:** `p-6` (default) → `p-8` (lead/feature).
- **Borders:** 1px hairline only — `border border-border`. On dark, `border-white/10`.
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

Restraint. One orchestrated entrance per section (staggered fade/translate-up via
`framer-motion`, already a dependency) on scroll into view. Avoid scattered
micro-animations. Marquee for the affiliations strip. Respect
`prefers-reduced-motion`.

## 7. Section inventory (home)

Lean, "big-tech minimal" order — every section earns its place with real data:

1. **Navbar** — wordmark (ink + lime mark), anchors, one lime CTA.
2. **Hero** — name + one-line positioning, primary CTA, mono stat block (one lime
   metric), affiliations marquee.
3. **Selected work** — _merged_ value-props + featured: 1 lead card + 3 supporting
   cards, each tagged with a pillar (Multimodality / Accelerated Computing /
   Community / Applied AI). Keeps the strongest real images.
4. **Projects** — ML + software, carousel.
5. **Speaking** — talks grid.
6. **Writing** — latest posts (Sanity; empty-state safe).
7. **Recognition** — _merged_ certifications + awards.
8. **Recommendations** — short quote strip (compact, not a heavy section).
9. **CTA** — "Book a call" + email, calm and non-pushy (reuses `calendar-modal`).
10. **Footer**.

Content guardrails: results-first (quantify with real numbers — $376K grant, 92%
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

**Do:** keep it monochrome + lime; align to a single container; uniform section
rhythm; hairline borders; mono for numbers; quantify outcomes; one primary CTA.

**Don't:** reintroduce the old blue/red/yellow/green multicolor; use lime as a
large fill or as low-contrast text on white; add gradients-on-white or purple AI
clichés; write filler copy or empty sections; hard-code colors/CSS in components;
mix radius/gap scales within a group.
