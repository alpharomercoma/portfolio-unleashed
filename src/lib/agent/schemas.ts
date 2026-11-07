import { z } from "zod";

import { isChartable } from "@/lib/chart-rows";
import { AWARD_CATEGORIES, PROJECT_CATEGORIES } from "@/lib/collections/schema";
import {
	TALK_LEVELS,
	TALK_STATUSES,
	TALK_TYPES,
	TYPES_WITHOUT_LEVEL,
} from "@/lib/talks/schema";

import {
	agentId,
	imageOrEmpty,
	isoDate,
	line,
	lineList,
	linkOrEmpty,
	markdown,
	multiline,
	optionalIsoDate,
	optionalYear,
	webUrlOrEmpty,
} from "./guards";

// What an agent may send for each resource. Every object is strict, so a
// misspelled or server-managed field (createdAt, updatedAt, order, rev) is an
// error rather than silently ignored. Omitted fields take the store defaults on
// create; on PUT, lifecycle fields (status / hidden) keep their current value.

export const talkEventInput = z.strictObject({
	id: agentId.optional(),
	eventName: line(200, { min: 1 }),
	organizerName: line(200, { min: 1 }),
	// The store keeps this as an absolute URL, so no /public paths here.
	organizerLogo: imageOrEmpty({ remoteOnly: true }).optional(),
	date: isoDate,
	venue: line(200).optional(),
	audienceSize: z.number().int().min(0).max(10_000_000).optional(),
	slideUrl: webUrlOrEmpty.optional(),
	videoUrl: webUrlOrEmpty.optional(),
});

export const talkInput = z.strictObject({
	slug: agentId.optional(),
	title: line(200, { min: 1 }),
	tagline: line(200).optional(),
	type: z.enum(TALK_TYPES).optional(),
	category: line(80, { min: 1 }).optional(),
	level: z.enum(TALK_LEVELS).optional(),
	durationMinutes: z
		.number()
		.int()
		.min(0)
		.max(24 * 60)
		.optional(),
	tags: lineList(30, 60).optional(),
	abstract: multiline(6000).optional(),
	outline: z
		.array(line(500, { min: 1 }))
		.max(100)
		.optional(),
	keyTakeaways: z
		.array(line(500, { min: 1 }))
		.max(50)
		.optional(),
	featured: z.boolean().optional(),
	status: z.enum(TALK_STATUSES).optional(),
	showcaseImage: imageOrEmpty().optional(),
	primarySlideUrl: webUrlOrEmpty.optional(),
	videoUrl: webUrlOrEmpty.optional(),
	events: z
		.array(talkEventInput)
		.max(100)
		.superRefine((events, ctx) => {
			const ids = events.flatMap((e) => (e.id ? [e.id] : []));
			const dup = ids.find((id, i) => ids.indexOf(id) !== i);
			if (dup) {
				ctx.addIssue({
					code: "custom",
					message: `duplicate event id "${dup}"`,
				});
			}
		})
		.optional(),
});

type TalkDecks = {
	primarySlideUrl?: string;
	events?: { slideUrl?: string }[];
};

/** What identifies a deck: its id, however the link to it is written. */
function deckKey(url: string): string {
	const id = url.match(
		/(?:canva\.com\/design|docs\.google\.com\/presentation\/d(?:\/e)?)\/([^/?#]+)/,
	);
	return id ? id[1] : url;
}

/** The decks a talk points at. Two links to one deck count once. */
function decksOf(talk: TalkDecks): Set<string> {
	return new Set(
		[talk.primarySlideUrl, ...(talk.events ?? []).map((e) => e.slideUrl)]
			.filter((url): url is string => Boolean(url))
			.map(deckKey),
	);
}

/**
 * Rules that span fields, checked on the merged record. `before` is what the store
 * already holds: only a write that brings in another deck can bundle, so an older
 * bundled record can still be edited, unpublished, or split.
 */
export function talkCrossIssues(
	talk: TalkDecks & { type?: string; level?: string },
	before?: TalkDecks | null,
): { path: string; message: string }[] {
	const issues: { path: string; message: string }[] = [];
	if (
		talk.level &&
		TYPES_WITHOUT_LEVEL.includes(talk.type as (typeof TALK_TYPES)[number])
	) {
		issues.push({
			path: "level",
			message: `a ${talk.type} has no level; remove "level"`,
		});
	}
	const decks = decksOf(talk);
	const known = before ? decksOf(before) : new Set<string>();
	if (decks.size > 1 && [...decks].some((deck) => !known.has(deck))) {
		issues.push({
			path: "events",
			message: "a talk has one deck; give a different deck its own talk",
		});
	}
	return issues;
}

export const aboutInput = z.strictObject({
	title: line(120, { min: 1 }),
	body: markdown(20_000),
});

const hidden = z.boolean().optional();

/** Chart rows, which the page would otherwise silently leave undrawn. */
const chartBars = (max: number) =>
	lineList(max, 100).refine(isChartable, {
		message:
			'Each row must read "Label = 42 ms", with one number and the same unit on every row.',
	});

export const collectionInputs = {
	research: z.strictObject({
		id: agentId.optional(),
		title: line(200, { min: 1 }),
		finding: line(40, { min: 1 }),
		findingNote: line(300).optional(),
		when: line(80).optional(),
		summary: multiline(2000).optional(),
		href: linkOrEmpty.optional(),
		bars: chartBars(8).optional(),
		hidden,
	}),
	"selected-work": z.strictObject({
		id: agentId.optional(),
		title: line(200, { min: 1 }),
		tag: line(60).optional(),
		description: multiline(2000).optional(),
		image: imageOrEmpty({ bare: true }).optional(),
		href: linkOrEmpty.optional(),
		cta: line(40).optional(),
		hidden,
	}),
	projects: z.strictObject({
		id: agentId.optional(),
		title: line(200, { min: 1 }),
		description: multiline(2000).optional(),
		category: z.enum(PROJECT_CATEGORIES).optional(),
		org: line(80).optional(),
		headline: line(120).optional(),
		finding: line(40).optional(),
		findingNote: line(300).optional(),
		bars: chartBars(12).optional(),
		tags: lineList(30, 60).optional(),
		metrics: lineList(20, 120).optional(),
		github: webUrlOrEmpty.optional(),
		demo: linkOrEmpty.optional(),
		demoLabel: line(40).optional(),
		image: imageOrEmpty({ bare: true }).optional(),
		shot: imageOrEmpty({ bare: true }).optional(),
		shotAlt: line(400).optional(),
		shotKind: z.enum(["phone", "wide"]).optional(),
		hidden,
	}),
	awards: z.strictObject({
		id: agentId.optional(),
		title: line(200, { min: 1 }),
		organization: line(160, { min: 1 }),
		year: optionalYear.optional(),
		image: imageOrEmpty({ bare: true }).optional(),
		context: multiline(2000).optional(),
		category: z.enum(AWARD_CATEGORIES).optional(),
		hidden,
	}),
	certifications: z.strictObject({
		id: agentId.optional(),
		title: line(200, { min: 1 }),
		issuer: line(120, { min: 1 }),
		logo: imageOrEmpty({ bare: true }).optional(),
		date: optionalIsoDate.optional(),
		link: webUrlOrEmpty.optional(),
		hidden,
	}),
	recommendations: z.strictObject({
		id: agentId.optional(),
		quote: multiline(3000, { min: 1 }),
		author: line(120, { min: 1 }),
		role: line(160).optional(),
		date: optionalIsoDate.optional(),
		hidden,
	}),
	gallery: z.strictObject({
		id: agentId.optional(),
		// Rendered with a plain <img src>, so no bare file names here.
		image: imageOrEmpty().refine((s) => s !== "", "an image is required"),
		title: line(200).optional(),
		hidden,
	}),
} as const;

export type CollectionInputKey = keyof typeof collectionInputs;
