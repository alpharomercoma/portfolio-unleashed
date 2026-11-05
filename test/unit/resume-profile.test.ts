import { afterEach, describe, expect, it, vi } from "vitest";

import { pickHighlights } from "@/components/experience-section";
import { collectionInputs } from "@/lib/agent/schemas";
import { getResumeProfile } from "@/lib/resume";
import seed from "../../data/resume.seed.json";

function serveYaml(body: string, status = 200) {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response(body, { status })),
	);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("getResumeProfile", () => {
	it("keeps Experience when the release can't be fetched", async () => {
		serveYaml("", 404);
		expect(await getResumeProfile()).toEqual(seed);
	});

	it("keeps Experience when the YAML is unreadable", async () => {
		serveYaml("cv: [not: the shape");
		expect(await getResumeProfile()).toEqual(seed);
	});

	it("skips one bad role and keeps the others", async () => {
		serveYaml(`
cv:
  sections:
    Summary:
      - One line.
    Professional Experience:
      - company: "[Lab](https://example.com)"
        position: Engineer
        start_date: 2026-08
        end_date: present
        highlights: ["Did **a** thing."]
      - company: Missing its position
`);
		expect(await getResumeProfile()).toEqual({
			summary: "One line.",
			roles: [
				{
					organization: "Lab",
					url: "https://example.com",
					role: "Engineer",
					dates: "Aug 2026 to now",
					highlights: ["Did **a** thing."],
				},
			],
		});
	});
});

describe("agent project input", () => {
	const base = { title: "A project" };

	it("accepts chart rows the page can draw", () => {
		const r = collectionInputs.projects.safeParse({
			...base,
			bars: ["First = 5,852 ms", "*Second = 215 ms"],
		});
		expect(r.success).toBe(true);
	});

	it("refuses rows the page would silently leave out", () => {
		for (const bars of [
			["A = 900 ms", "B = 1.2 s"],
			["A = 1 ms", "B = unavailable"],
		]) {
			expect(
				collectionInputs.projects.safeParse({ ...base, bars }).success,
			).toBe(false);
		}
	});
});

describe("pickHighlights", () => {
	const told = "Shipped **OpenWeights** to Google Play.";
	const fresh = "Measured 9 models.";
	const grant = "Secured a **$2,000 compute grant** from Lambda.";

	it("prefers lines the page hasn't already told", () => {
		expect(pickHighlights([told, fresh, grant])).toEqual([fresh]);
	});

	it("falls back to a repeated line rather than showing nothing", () => {
		expect(pickHighlights([told])).toEqual([told]);
	});

	it("never brings back a grant or sponsorship line", () => {
		expect(pickHighlights([grant])).toEqual([]);
		expect(pickHighlights([told, grant])).toEqual([told]);
	});
});
