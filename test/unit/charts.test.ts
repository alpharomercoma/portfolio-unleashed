import { describe, expect, it } from "vitest";

import { chartRows, parseBar } from "@/components/charts";
import { talkLinks } from "@/components/speaking/talk-meta";
import { talkCrossIssues } from "@/lib/agent/schemas";
import { isChartable } from "@/lib/chart-rows";
import {
	computeStats,
	sessionsByYear,
	talkEventSchema,
	talkSchema,
	talksByCategory,
	talksByYear,
} from "@/lib/talks/schema";
import type { Talk } from "@/lib/talks/schema";
import { firstSentence } from "@/lib/utils";

import talksSeed from "../../data/talks.seed.json";

describe("parseBar", () => {
	it("reads a label, a printed value, and the number behind the bar", () => {
		expect(parseBar("Pro+, Auto = 92%")).toEqual({
			label: "Pro+, Auto",
			display: "92%",
			value: 92,
			unit: "%",
			highlight: false,
		});
		expect(parseBar("M5 GPU = 5,604 tok/s")?.value).toBe(5604);
		expect(parseBar("MI300X = 102.25 GiB")?.value).toBe(102.25);
	});

	it("marks a row highlighted with a leading star", () => {
		expect(parseBar("*Qwen3.6, 4090 = 42%")).toMatchObject({
			label: "Qwen3.6, 4090",
			highlight: true,
		});
	});

	it("keeps an equals sign inside the label", () => {
		expect(parseBar("a = b = 3 ms")).toMatchObject({
			label: "a = b",
			value: 3,
		});
	});

	it("reads the whole quantity, not the first digits it finds", () => {
		expect(parseBar("A = .5 s")?.value).toBe(0.5);
		expect(parseBar("A = ~1,067 jobs/min")).toMatchObject({
			value: 1067,
			unit: "jobs/min",
			display: "~1,067 jobs/min",
		});
	});

	it("rejects entries it can't chart instead of drawing a wrong bar", () => {
		for (const bad of [
			"",
			"no separator",
			" = 3 ms",
			"label = none",
			"*",
			"loss = -3%",
			"cost = $3",
			"range = 1 to 3 ms",
			"typo = 1.2.3 ms",
			"typo = 12,34 ms",
			`huge = ${"9".repeat(310)} ms`,
		]) {
			expect(parseBar(bad)).toBeNull();
		}
	});
});

const talk = (category: string, dates: string[]) =>
	({
		category,
		events: dates.map((date) => ({ date })),
	}) as unknown as Talk;

describe("chartRows", () => {
	it("keeps rows that share a unit and drops the ones it can't read", () => {
		expect(chartRows(["a = 1 ms", "junk", "b = 2 ms"])).toMatchObject([
			{ label: "a", value: 1 },
			{ label: "b", value: 2 },
		]);
	});

	it("draws no chart when units differ, because one scale would mislead", () => {
		expect(chartRows(["fast = 900 ms", "slow = 1.2 s"])).toEqual([]);
		expect(chartRows(["a = 1.2K", "b = 900"])).toEqual([]);
	});
});

describe("talk events", () => {
	it("keeps a session's own slides and video through the schema", () => {
		const parsed = talkEventSchema.parse({
			id: "e",
			eventName: "Event",
			organizerName: "Org",
			date: "2026-01-01",
			slideUrl: "https://example.com/deck",
			videoUrl: "https://example.com/video",
		});
		expect(parsed.slideUrl).toBe("https://example.com/deck");
		expect(parsed.videoUrl).toBe("https://example.com/video");
	});

	it("doesn't count a future event as delivered", () => {
		const t = talk("A", ["2026-01-01", "2999-01-01"]);
		expect(computeStats([t]).sessions).toBe(1);
		expect(sessionsByYear([t])).toEqual([{ year: "2026", sessions: 1 }]);
	});
});

describe("speaking charts", () => {
	it("counts sessions per year, oldest first, and skips bad dates", () => {
		expect(
			sessionsByYear([
				talk("A", ["2026-01-01", "2025-05-05"]),
				talk("B", ["2026-03-03", "not a date"]),
			]),
		).toEqual([
			{ year: "2025", sessions: 1 },
			{ year: "2026", sessions: 2 },
		]);
		expect(sessionsByYear([])).toEqual([]);
	});

	it("ranks categories by talk count, then alphabetically", () => {
		expect(
			talksByCategory([
				talk("B", []),
				talk("A", []),
				talk("C", []),
				talk("C", []),
			]),
		).toEqual([
			{ category: "C", talks: 2 },
			{ category: "A", talks: 1 },
			{ category: "B", talks: 1 },
		]);
	});
});

describe("firstSentence", () => {
	it("stops at the first full stop", () => {
		expect(firstSentence("One thing. Another thing.")).toBe("One thing.");
	});

	it("doesn't stop inside an abbreviation or a version number", () => {
		expect(firstSentence("A globe of U.S. Greenhouse data. It spins.")).toBe(
			"A globe of U.S. Greenhouse data.",
		);
		expect(firstSentence("Runs TPU v6e-8.5 fast. Really.")).toBe(
			"Runs TPU v6e-8.5 fast.",
		);
	});

	it("returns text with no second sentence whole", () => {
		expect(firstSentence("Just one sentence")).toBe("Just one sentence");
		expect(firstSentence("  ")).toBe("");
	});
});

describe("isChartable", () => {
	it("accepts rows that will all be drawn", () => {
		expect(isChartable([])).toBe(true);
		expect(isChartable(["A = 1 ms", "*B = 2 ms"])).toBe(true);
	});

	it("refuses rows the page would silently leave out", () => {
		expect(isChartable(["A = 1 ms", "B = unavailable"])).toBe(false);
		expect(isChartable(["A = 900 ms", "B = 1.2 s"])).toBe(false);
	});
});

describe("the talk catalogue", () => {
	const dated = (slug: string, ...dates: string[]) =>
		talkSchema.parse({
			slug,
			title: slug,
			events: dates.map((date, i) => ({
				id: `${slug}-${i}`,
				eventName: "Event",
				organizerName: "Org",
				date,
			})),
		});

	it("groups talks by year, newest year and newest talk first", () => {
		const groups = talksByYear([
			dated("old", "2024-04-20"),
			dated("mid", "2026-01-08"),
			dated("new", "2026-11-06"),
		]);
		expect(groups.map((g) => [g.year, g.talks.map((t) => t.slug)])).toEqual([
			["2026", ["new", "mid"]],
			["2024", ["old"]],
		]);
	});

	it("files a talk under its latest session, and an undated one last", () => {
		const groups = talksByYear([
			dated("none"),
			dated("twice", "2025-01-01", "2026-01-01"),
		]);
		expect(groups.map((g) => g.year)).toEqual(["2026", "Undated"]);
	});

	it("doesn't claim a duration nobody recorded", () => {
		expect(dated("a", "2026-01-01").durationMinutes).toBe(0);
	});

	it("refuses two decks on one talk, and allows a deck given twice", () => {
		const session = (slideUrl?: string) => ({ slideUrl });
		const a = "https://docs.google.com/presentation/d/a/edit";
		const b = "https://docs.google.com/presentation/d/b/edit";
		const paths = (...args: Parameters<typeof talkCrossIssues>) =>
			talkCrossIssues(...args).map((i) => i.path);
		expect(paths({ primarySlideUrl: a, events: [session(b)] })).toEqual([
			"events",
		]);
		expect(paths({ events: [session(a), session(b)] })).toEqual(["events"]);
		expect(
			paths({ primarySlideUrl: a, events: [session(a), session(a)] }),
		).toEqual([]);
		expect(
			paths({ primarySlideUrl: a, events: [session(""), session()] }),
		).toEqual([]);
	});

	it("counts two links to one deck once", () => {
		const a = "https://docs.google.com/presentation/d/a/edit";
		expect(
			talkCrossIssues({
				primarySlideUrl: a,
				events: [{ slideUrl: `${a}?usp=sharing` }],
			}),
		).toEqual([]);
		const canva = "https://www.canva.com/design/DAGSHoSgVYE/token/view";
		expect(
			talkCrossIssues({
				primarySlideUrl: canva,
				events: [{ slideUrl: `${canva}?embed` }],
			}),
		).toEqual([]);
		expect(
			talkCrossIssues({
				primarySlideUrl: canva,
				events: [
					{ slideUrl: "https://www.canva.com/design/DAGgCsmcztc/t/view" },
				],
			}).map((i) => i.path),
		).toEqual(["events"]);
	});

	it("lets an older bundle be edited or split, but adds no deck to it", () => {
		const deck = (id: string) =>
			`https://docs.google.com/presentation/d/${id}/edit`;
		const bundled = {
			primarySlideUrl: deck("a"),
			events: [{ slideUrl: deck("a") }, { slideUrl: deck("b") }],
		};
		expect(talkCrossIssues(bundled, bundled)).toEqual([]);
		expect(
			talkCrossIssues(
				{ primarySlideUrl: deck("a"), events: [{ slideUrl: deck("a") }] },
				bundled,
			),
		).toEqual([]);
		expect(
			talkCrossIssues(
				{
					...bundled,
					events: [{ slideUrl: deck("c") }, { slideUrl: deck("b") }],
				},
				bundled,
			).map((i) => i.path),
		).toEqual(["events"]);
	});

	it("takes the deck and recording from a talk's only session", () => {
		const deck = "https://docs.google.com/presentation/d/a/edit";
		const video = "https://youtu.be/a";
		const session = {
			id: "e",
			eventName: "Event",
			organizerName: "Org",
			date: "2026-01-01",
			slideUrl: deck,
			videoUrl: video,
		};
		const talk = (events: (typeof session)[]) =>
			talkSchema.parse({ slug: "a", title: "A", events });
		expect(talkLinks(talk([session]))).toEqual({ slides: deck, video });
		// With several sessions, the table lists each session's own links.
		expect(talkLinks(talk([session, { ...session, id: "f" }]))).toEqual({
			slides: "",
			video: "",
		});
		expect(
			talkLinks(talk([{ ...session, slideUrl: "javascript:alert(1)" }])).slides,
		).toBe("");
	});

	it("seeds a valid catalogue, with one deck per talk", () => {
		const slugs = talksSeed.map((t) => t.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		for (const raw of talksSeed) {
			const talk = talkSchema.parse(raw);
			expect(talkCrossIssues(talk), talk.slug).toEqual([]);
		}
	});
});
