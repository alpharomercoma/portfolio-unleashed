import { z } from "zod";

// A talk is a topic (abstract, outline, takeaways, metadata). It is delivered at
// one or more events. Modeled on smatoto.dev: one talk -> many events.

export const TALK_TYPES = ["Talk", "Workshop", "Keynote"] as const;
export const TALK_LEVELS = [
	"Foundational",
	"Intermediate",
	"Advanced",
] as const;

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
	id: z.string().min(1),
	eventName: z.string().min(1),
	organizerName: z.string().min(1),
	organizerLogo: z.string().url().optional().or(z.literal("")),
	date: z.string().min(1), // ISO date "YYYY-MM-DD"
	venue: z.string().default(""),
	audienceSize: z.number().int().nonnegative().default(0),
	slideUrl: z.string().url().optional().or(z.literal("")),
	videoUrl: z.string().url().optional().or(z.literal("")),
});

export const talkSchema = z.object({
	slug: z
		.string()
		.min(1)
		.regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, and dashes only"),
	title: z.string().min(1),
	tagline: z.string().default(""),
	type: z.enum(TALK_TYPES).default("Talk"),
	category: z.string().default("Community"),
	level: z.enum(TALK_LEVELS).default("Foundational"),
	durationMinutes: z.number().int().positive().default(60),
	language: z.string().default("English"),
	tags: z.array(z.string()).default([]),
	abstract: z.string().default(""),
	outline: z.array(z.string()).default([]),
	keyTakeaways: z.array(z.string()).default([]),
	featured: z.boolean().default(false),
	// Set true when content was drafted from a deck/title and the owner should review.
	needsReview: z.boolean().default(false),
	showcaseImage: z.string().url().optional().or(z.literal("")),
	primarySlideUrl: z.string().url().optional().or(z.literal("")),
	videoUrl: z.string().url().optional().or(z.literal("")),
	events: z.array(talkEventSchema).default([]),
	createdAt: z.string().default(""),
	updatedAt: z.string().default(""),
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
