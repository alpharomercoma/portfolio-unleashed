import { format, parseISO } from "date-fns";

import { type Talk, type TalkEvent, isDelivered } from "@/lib/talks/schema";

/** "28 October 2026", the way the labs' sites write dates. */
export function longDate(iso: string): string {
	try {
		return format(parseISO(iso), "d MMMM yyyy");
	} catch {
		return iso;
	}
}

export function latestEvent(talk: Talk): TalkEvent | null {
	const delivered = talk.events.filter((e) => isDelivered(e));
	const pool = delivered.length > 0 ? delivered : talk.events;
	return pool.reduce<TalkEvent | null>(
		(latest, e) => (!latest || e.date > latest.date ? e : latest),
		null,
	);
}

/** Where and when a talk was given: "PyTorch Conference Europe 2026, 8 April 2026". */
export function lastGiven(talk: Talk): string {
	const e = latestEvent(talk);
	return e ? `${e.eventName}, ${longDate(e.date)}` : "";
}

/** A talk's deck and recording, or its only session's if it has none of its own. */
export function talkLinks(talk: Talk): { slides: string; video: string } {
	const only = talk.events.length === 1 ? talk.events[0] : null;
	const web = (url?: string) => (url && /^https?:\/\//.test(url) ? url : "");
	return {
		slides: talk.primarySlideUrl || web(only?.slideUrl),
		video: talk.videoUrl || web(only?.videoUrl),
	};
}

/**
 * The event a talk is best known by: the next one if it's still to come, otherwise
 * the one with the largest audience.
 */
export function headlineEvent(talk: Talk): TalkEvent | null {
	const upcoming = talk.events
		.filter((e) => !isDelivered(e))
		.sort((a, b) => a.date.localeCompare(b.date));
	if (upcoming[0]) return upcoming[0];
	return talk.events.reduce<TalkEvent | null>(
		(top, e) => (!top || e.audienceSize > top.audienceSize ? e : top),
		null,
	);
}
