import { z } from "zod";

// A talk is a topic (abstract, outline, takeaways, metadata). It is delivered at
// one or more events. Modeled on smatoto.dev: one talk -> many events.

export const TALK_TYPES = ["Talk", "Workshop", "Keynote", "Podcast"] as const;
export const TALK_LEVELS = [
	"Foundational",
	"Intermediate",
	"Advanced",
] as const;

// Types that carry an audience level. Podcasts (conversational) do not.
export const TYPES_WITHOUT_LEVEL: readonly (typeof TALK_TYPES)[number][] = [
	"Podcast",
];

// Publication state. Drafts are admin-only (e.g. a talk freshly drafted from a
// slide deck by the AI, awaiting review); published talks appear on /speaking.
export const TALK_STATUSES = ["draft", "published"] as const;
export type TalkStatus = (typeof TALK_STATUSES)[number];

// Suggested categories for this ML/dev portfolio. Stored as a free string so the
// admin can add new ones, but the UI offers these.
export const TALK_CATEGORIES = [
	"AI & ML",
	"Accelerated Computing",
	"Developer Tools",
	"Open Source",
	"Web Development",
	"Career",
	"Community",
] as const;

export const talkEventSchema = z.object({
	id: z.string().min(1).max(120),
	eventName: z.string().min(1).max(200),
	organizerName: z.string().min(1).max(200),
	organizerLogo: z.string().url().optional().or(z.literal("")),
	date: z.string().min(1).max(40), // ISO date "YYYY-MM-DD"
	venue: z.string().max(200).default(""),
	audienceSize: z.number().int().nonnegative().max(100_000_000).default(0),
});

export const talkSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(80)
		.regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, and dashes only"),
	title: z.string().min(1).max(200),
	tagline: z.string().max(200).default(""),
	type: z.enum(TALK_TYPES).default("Talk"),
	category: z.string().max(80).default("Community"),
	// Optional: podcasts and other conversational formats carry no level.
	level: z.enum(TALK_LEVELS).optional(),
	durationMinutes: z.number().int().positive().max(100_000).default(60),
	tags: z.array(z.string().max(100)).max(50).default([]),
	abstract: z.string().max(6000).default(""),
	outline: z.array(z.string().max(500)).max(100).default([]),
	keyTakeaways: z.array(z.string().max(500)).max(50).default([]),
	featured: z.boolean().default(false),
	// Draft talks are hidden from the public site until published. New talks
	// default to published; AI-drafted talks are saved as drafts to review first.
	status: z.enum(TALK_STATUSES).default("published"),
	// URL or a local /public path (e.g. /talks/covers/<slug>.jpg).
	showcaseImage: z.string().max(2000).default(""),
	primarySlideUrl: z.string().url().optional().or(z.literal("")),
	videoUrl: z.string().url().optional().or(z.literal("")),
	events: z.array(talkEventSchema).max(100).default([]),
	createdAt: z.string().max(40).default(""),
	updatedAt: z.string().max(40).default(""),
});

export type TalkEvent = z.infer<typeof talkEventSchema>;
export type Talk = z.infer<typeof talkSchema>;

export type SpeakingStats = {
	talks: number;
	sessions: number;
	developersReached: number;
	yearsSpeaking: number;
};

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

/** Latest event date for a talk (ISO string), or "" if none. */
export function latestEventDate(talk: Talk): string {
	return talk.events.reduce((max, e) => (e.date > max ? e.date : max), "");
}

/** Sort talks newest-first by their most recent delivery. */
export function sortTalksByRecency(talks: Talk[]): Talk[] {
	return [...talks].sort((a, b) =>
		latestEventDate(b).localeCompare(latestEventDate(a)),
	);
}

export function computeStats(talks: Talk[]): SpeakingStats {
	const sessions = talks.reduce((n, t) => n + t.events.length, 0);
	const developersReached = talks.reduce(
		(n, t) => n + t.events.reduce((s, e) => s + (e.audienceSize || 0), 0),
		0,
	);
	const years = talks
		.flatMap((t) => t.events.map((e) => Number(e.date.slice(0, 4))))
		.filter((y) => Number.isFinite(y) && y > 2000);
	const yearsSpeaking =
		years.length > 0 ? Math.max(...years) - Math.min(...years) + 1 : 0;
	return { talks: talks.length, sessions, developersReached, yearsSpeaking };
}
