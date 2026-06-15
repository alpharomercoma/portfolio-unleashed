import { z } from "zod";

import { TALK_CATEGORIES, TALK_LEVELS, TALK_TYPES } from "./schema";

// The subset of a talk's fields that can be reasonably inferred from a slide
// deck. Events, durations, URLs, and images stay manual (the deck can't tell us
// where/when it was delivered). Constrained enums keep category/type/level valid.
// Shared by every TalkDrafter implementation so providers stay interchangeable.
export const draftSchema = z.object({
	title: z.string().describe("The talk's title — concise and specific."),
	tagline: z
		.string()
		.describe("A single-sentence hook, ≤ 140 characters. Empty if unclear."),
	abstract: z
		.string()
		.describe("A 2–4 sentence abstract of what the talk covers."),
	outline: z
		.array(z.string())
		.describe("4–8 outline points, each a short phrase (the deck's sections)."),
	keyTakeaways: z
		.array(z.string())
		.describe("3–5 concrete things the audience should remember."),
	tags: z
		.array(z.string())
		.describe("3–8 short topic/technology keywords (e.g. 'PyTorch', 'LLMs')."),
	category: z.enum(TALK_CATEGORIES).describe("The single best-fit category."),
	type: z.enum(TALK_TYPES).describe("The session format."),
	level: z
		.enum(TALK_LEVELS)
		.nullable()
		.describe("Audience level, or null if a podcast / not applicable."),
});

export type TalkDraft = z.infer<typeof draftSchema>;

export const DRAFT_PROMPT = `You are cataloging one of the speaker's own talks from the attached slide deck (PDF). Write a plain, factual draft of the talk's details.

Content:
- Use only what the slides actually show. Do not invent facts, names, numbers, or claims.
- If a field cannot be determined from the deck, return an empty string or empty array for it.
- title: the talk's title.
- tagline: one short sentence, or empty if the deck does not make one clear.
- abstract: three or four sentences on what the talk covers.
- outline: the deck's main sections, each a short phrase.
- keyTakeaways: the concrete things the audience leaves knowing.
- tags: short topic or technology keywords.
- Pick the single best-fit category and session type. Set level to null for a podcast or when it does not apply.

How to write it (important):
- Write the way a working engineer plainly describes their own talk. Clear and direct, never promotional.
- Never use em dashes or en dashes. Use a period or comma, or reword the sentence.
- Do not use marketing or AI-cliche words. Avoid words like: delve, dive, unlock, leverage, harness, robust, seamless, cutting-edge, game-changer, elevate, empower, realm, landscape, tapestry, testament, journey, embark, ecosystem, "in today's world", "fast-paced", "it's worth noting", "in conclusion".
- No hype and no filler adjectives. Prefer concrete nouns and simple verbs, and keep sentences short.`;
