# Design system, alpharomer.com

The site belongs to the same family as its two labs: **Experimental Machines**
(cobalt) and **Experimental Intelligence** (violet). It has one colour, the indigo
halfway between them, and borrows their type and layout.

Read this before changing visuals. Tokens live in `src/app/globals.css`, and
`test/unit/contrast.test.ts` checks every colour pair against WCAG AA, so add new
pairs there too.

## Principles

- **Few words.** One short sentence under a title at most. Cards carry a title and
  a number, not a paragraph. Long copy lives on its own page; stored descriptions
  show their first sentence (`firstSentence`) and quotes are never cut.
- **Room.** Generous gaps between sections (`section-gap`) and inside cards.
- **Flat colour.** No gradients, blurs, glows, or drop shadows.
- **Findings first.** A number and one plain sentence, then a small chart, then
  the title. If it can't be measured, say what it is in words.
- **Only real data.** Every figure comes from a store (`talks`, the collections,
  About) or is copied from the study it links to. Nothing is illustrative.
- **Plain sentences.** Section titles are short and end in a full stop. Sentence
  case, no all-caps labels, no hype.
- **Only the charts move.** Bars draw in as they scroll into view, and not at all
  for anyone asking for less motion. Everything else moves because someone did
  something.
- **Substance first.** Every section should say what was shipped, measured, or
  said, with its number. Few words is not the same as saying nothing.
- **Type leads.** The hero is the name and one plain line. No portraits or cards
  in it, and no slogans: say what the thing is.

## Colour

One colour, plus ink, white, and grey. There is no secondary colour and no accent:
a chart's highlighted mark is white on ink and indigo on white.

| Token                       | Value                 | Use                                              |
| --------------------------- | --------------------- | ------------------------------------------------ |
| `brand`                     | `#5342E5` indigo      | Hero, nav, primary buttons, contact field        |
| `brand-strong`              | `#4232C8`             | Links and hover states on white                  |
| `ink` / `foreground`        | `#16133A`             | Text and data panels. Never pure black           |
| `muted-foreground`          | `#5A5A68`             | Secondary text                                   |
| `brand-wash`                | `#F5F5F8`             | Tinted panels                                    |
| `bar` / `bar-light`         | `#8F8FA6` / `#8B8B99` | Neutral chart marks on ink / on white            |
| `on-brand` / `on-deep`      | `#EFEEFC` / `#D8D8E4` | Secondary text on the brand field / ink panels   |
| `machines` / `intelligence` | `#2B44E6` / `#7B3FE4` | Only where a lab is named, matching its own site |

Use a `surface-*` class (`surface-brand`, `surface-ink`, `surface-machines`,
`surface-intelligence`) for any coloured block. It sets the text colour and makes
keyboard focus rings white. A white block inside one (a dialog) must set
`--focus` back.

## Type

Inter Tight for display, Inter for reading, the same pair as the labs.

| Class        | Size                   | Use                        |
| ------------ | ---------------------- | -------------------------- |
| `wordmark`   | 40 to 88px             | The name in the hero, only |
| `display-xl` | 32 to 44px, weight 500 | Page titles, the big quote |
| `display-lg` | 28 to 36px, weight 400 | Section titles             |
| `display-md` | 22 to 26px, weight 400 | Lead cards, subsections    |
| `display-sm` | 20px, weight 400       | Card titles                |
| `finding`    | 32 to 40px, tabular    | The number on a data panel |
| `lede`       | 17px, line-height 1.6  | The sentence under a title |

A step below the labs on purpose: the owner found their scale too big for a
personal site. Count words as well as size: a tile is a number if it has one, a
name, one line, and its links, nothing more.

Running text stays within `measure` (62 characters).

## Layout

- `site-container`: a 77rem column inside a 1 to 2rem gutter.
- Cards: 28px radius (`rounded-[1.75rem]`), a 1px `border`, no shadow. Lead cards
  split into a coloured panel and a white half; smaller ones stack the two.
- Lists of equals sit under a 2px `brand` rule with no card around them.
- Projects and data lead with what they measured. The first measured project opens
  the section at full size on ink, with its bars on one scale. The next are
  features: what it does, a real screen from the app, then its result and chart.
  Screens fill their panel: a phone app shows two screens side by side, not one small
  phone in empty space. Numbered tiles follow in one row, and anything else sits in a
  short "Other projects" list that opens on request. Student projects stay hidden.
- Recommendations are one voice at a time, large, on ink, with the row of names
  above the quote: quotes differ in length, so below it they would move under the
  finger.
- The homepage runs Projects, Research, Speaking, Experience (opening on the two
  lab cards), Certifications, recommendations, Data, Writing, Contact. A number sits
  beside what it measures; there is no detached row of stats. Contact is a call
  button and a short list of direct routes.
- Experience comes from the resume YAML, two lines a role, skipping what the page
  already told and any grant or sponsorship line.
- Certifications show the four machine learning credentials, with the rest
  behind a toggle. Logos are greyscale, as in the hero.
- Pills for actions and chips, `text-link` for links in text.

## Components

`SiteShell` (skip link, header, main, footer), `PageHeader`, `SectionHeader`,
`BarRows` and `Columns` (`src/components/charts.tsx`: every value is printed as
text, so bars are never the only carrier of a number).

## Accessibility floor

WCAG 2.2 AA throughout: 4.5:1 text and 3:1 marks and control boundaries (tested),
40px minimum targets, visible focus on every surface, no focus hidden under the
sticky bar, a working page at 320px wide and 200% zoom, semantic tables and lists,
native `dialog` for modals, and `prefers-reduced-motion` respected.
