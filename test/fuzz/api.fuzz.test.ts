import fc from "fast-check";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getAbout } from "@/lib/about/store";
import { ADAPTERS } from "@/lib/agent/resources";
import { COLLECTION_KEYS, getCollection } from "@/lib/collections/registry";
import { getTypedItems } from "@/lib/collections/store";
import { getPublishedTalks } from "@/lib/talks/store";

import { harness } from "../agent-harness";
import { resetCache } from "../stubs/next-cache";
import { flush, seedAll, testRedis } from "../helpers";

const redis = testRedis();
const RESOURCES = Object.keys(ADAPTERS);
let h = harness();
let ids: Record<string, string[]> = {};

/**
 * Everything the public site shows, read through the same functions the pages
 * use (so seed fallbacks and visibility filters count), with a cold cache.
 */
async function liveSnapshot(): Promise<string> {
	resetCache();
	const out: Record<string, unknown> = {
		talks: await getPublishedTalks(),
		about: await getAbout(),
	};
	for (const key of COLLECTION_KEYS) {
		out[key] = await getTypedItems(key, getCollection(key)!.schema);
	}
	return JSON.stringify(out);
}

async function assertStoreValid() {
	for (const [name, a] of Object.entries(ADAPTERS)) {
		for (const row of await a.list()) {
			expect(row.issues, `${name}/${row.id}`).toBeUndefined();
		}
	}
}

const textish = fc.oneof(
	fc.string({ maxLength: 30 }),
	fc.constantFrom(
		"",
		"Agents",
		"javascript:alert(1)",
		"//evil.example",
		"https://evil.example/a.png",
		"https://abc.public.blob.vercel-storage.com/a.png",
		"/talks/covers/a.jpg",
		"x‮y",
		"2026-02-30",
		"2026-10-21",
		"published",
		"draft",
	),
);

// Bodies shaped like real inputs (so they often pass validation and reach the
// permission and write paths), mixed with arbitrary JSON.
const plausibleBody = fc.record(
	{
		title: textish,
		tagline: textish,
		status: fc.constantFrom("draft", "published", "archived", null),
		hidden: fc.oneof(fc.boolean(), fc.constant(null), fc.constant("false")),
		type: fc.constantFrom("Talk", "Podcast", "Keynote"),
		level: fc.constantFrom("Advanced", undefined),
		tags: fc.array(textish, { maxLength: 3 }),
		quote: textish,
		author: textish,
		organization: textish,
		issuer: textish,
		image: textish,
		body: fc.oneof(textish, fc.constant("[x](https://example.com)")),
		events: fc.array(
			fc.record({
				eventName: textish,
				organizerName: textish,
				date: fc.constantFrom("2026-10-21", "bad"),
			}),
			{ maxLength: 2 },
		),
		ids: fc.array(textish, { maxLength: 3 }),
		rev: fc.integer({ min: -1, max: 6 }),
		slug: textish,
		id: textish,
	},
	{ requiredKeys: [] },
);

// Known-valid creates per resource (one often matches the request's resource)
// with one field swapped for a fuzzed value.
const VALID_CREATES: Record<string, Record<string, unknown>> = {
	talks: {
		title: "Fuzz Talk",
		events: [{ eventName: "E", organizerName: "O", date: "2026-10-21" }],
	},
	projects: { title: "Fuzz Project", tags: ["a"] },
	"selected-work": { title: "Fuzz Work", href: "/speaking" },
	awards: { title: "Fuzz Award", organization: "Org", year: "2026" },
	certifications: { title: "Fuzz Cert", issuer: "Org", date: "2026-01-02" },
	recommendations: { quote: "Great.", author: "Someone" },
	gallery: { image: "/gallery/a.jpg", title: "Fuzz" },
	about: { title: "About", body: "Hello [there](/speaking)." },
};

const validish = fc
	.tuple(
		fc.constantFrom(...Object.values(VALID_CREATES)),
		fc.option(
			fc.tuple(
				fc.constantFrom(
					"title",
					"tagline",
					"status",
					"hidden",
					"image",
					"href",
					"body",
					"slug",
					"id",
				),
				fc.oneof(textish, fc.boolean(), fc.constant(null)),
			),
		),
	)
	.map(([base, swap]) => (swap ? { ...base, [swap[0]]: swap[1] } : base));

const smallPatch = fc.oneof(
	fc.record({ title: textish }),
	fc.record({ tagline: textish }),
	fc.record({ status: fc.constantFrom("draft", "published") }),
	fc.record({ hidden: fc.boolean() }),
	fc.record({ quote: textish }),
	fc.record({
		body: fc.constantFrom("New body.", "<b>x</b>", "[x](javascript:1)"),
	}),
	fc.record({ rev: fc.integer({ min: 0, max: 4 }) }),
);

const body = fc.oneof(
	{ weight: 4, arbitrary: validish },
	{ weight: 4, arbitrary: smallPatch },
	{ weight: 2, arbitrary: plausibleBody },
	{ weight: 2, arbitrary: fc.jsonValue({ maxDepth: 3 }) },
	{ weight: 1, arbitrary: fc.constant(undefined) },
);

/** Bodies that fit `resource`: a fuzzed valid create, or a one-field patch. */
function matching(resource: string) {
	const base = Object.hasOwn(VALID_CREATES, resource)
		? VALID_CREATES[resource]
		: {};
	return fc.oneof(
		fc.constant(base),
		fc
			.tuple(
				fc.constantFrom(...Object.keys(base), "hidden", "status", "tagline"),
				fc.oneof(textish, fc.boolean()),
			)
			.map(([k, v]) => ({ ...base, [k]: v })),
		smallPatch,
	);
}

// Coherent request shapes (method + path) most of the time, junk otherwise.
const SHAPES = {
	create: { method: "POST", id: null, sub: null },
	patch: { method: "PATCH", id: "__known__", sub: null },
	put: { method: "PUT", id: "__known__", sub: null },
	delete: { method: "DELETE", id: "__known__", sub: null },
	revert: { method: "POST", id: "__known__", sub: "revert" },
	history: { method: "GET", id: "__known__", sub: "history" },
	reorder: { method: "POST", id: "_order", sub: null },
	read: { method: "GET", id: "__known__", sub: null },
	list: { method: "GET", id: null, sub: null },
} as const;

const junkShape = fc.record({
	method: fc.constantFrom(
		"GET",
		"POST",
		"PUT",
		"PATCH",
		"DELETE",
		"HEAD",
		"OPTIONS",
	),
	id: fc.oneof(
		fc.constantFrom(
			null,
			"__known__",
			"fuzz-talk",
			"order",
			"_order",
			"history",
		),
		fc.string({ maxLength: 12 }),
	),
	sub: fc.constantFrom(null, "history", "revert", "x"),
});

function requestArb(tokens: string[]) {
	return fc
		.oneof(
			{ weight: 8, arbitrary: fc.constantFrom(...RESOURCES) },
			{
				weight: 1,
				arbitrary: fc.constantFrom(
					"_audit",
					"constructor",
					"__proto__",
					"",
					"TALKS",
				),
			},
		)
		.chain((resource) =>
			fc.record({
				resource: fc.constant(resource),
				shape: fc.oneof(
					{ weight: 6, arbitrary: fc.constantFrom(...Object.values(SHAPES)) },
					{ weight: 1, arbitrary: junkShape },
				),
				as: fc.oneof(
					{ weight: 8, arbitrary: fc.constantFrom(...tokens) },
					{
						weight: 1,
						arbitrary: fc.constantFrom(null, "pfa_" + "A".repeat(43)),
					},
				),
				pick: fc.nat(),
				ifMatch: fc.oneof(
					{ weight: 2, arbitrary: fc.constant(null) },
					{ weight: 4, arbitrary: fc.constantFrom("0", "1") },
					{ weight: 2, arbitrary: fc.integer({ min: 0, max: 4 }).map(String) },
					{ weight: 1, arbitrary: fc.string({ maxLength: 6 }) },
				),
				dryRun: fc.oneof(
					{ weight: 6, arbitrary: fc.constant(undefined) },
					{ weight: 2, arbitrary: fc.constantFrom("1", "0") },
					{ weight: 1, arbitrary: fc.constant("maybe") },
				),
				body: fc.oneof(
					{ weight: 3, arbitrary: matching(resource) },
					{
						weight: 1,
						arbitrary: fc.record({
							ids: fc.shuffledSubarray(
								Object.hasOwn(ids, resource) ? ids[resource] : [],
								{ minLength: 0 },
							),
						}),
					},
					{ weight: 2, arbitrary: body },
				),
			}),
		)
		.map(({ shape, ...r }) => ({ ...r, ...shape }));
}

type Req =
	ReturnType<typeof requestArb> extends fc.Arbitrary<infer T> ? T : never;

async function send(r: Req) {
	let id: string | null = r.id;
	if (id === "__known__") {
		const pool = Object.hasOwn(ids, r.resource) ? ids[r.resource] : [];
		id = pool.length ? pool[r.pick % pool.length] : "missing";
	}
	const segs = [r.resource, id, r.sub].filter(
		(s): s is string => s != null && s !== "",
	);
	const path =
		"/" +
		segs.map(encodeURIComponent).join("/") +
		(r.dryRun ? `?dryRun=${r.dryRun}` : "");
	const hasBody =
		r.body !== undefined && !["GET", "HEAD", "DELETE"].includes(r.method);
	return h.call(r.method, path, {
		as: r.as,
		body: hasBody ? r.body : undefined,
		ifMatch: r.ifMatch ?? undefined,
	});
}

function assertWellFormed(res: { status: number; body: unknown }, r: Req) {
	const label = JSON.stringify(r).slice(0, 300);
	expect(res.status, label).toBeLessThan(500);
	if (r.method === "HEAD") return;
	expect(res.body, label).toBeTypeOf("object");
	if (res.status >= 400) {
		expect(
			(res.body as { error?: { code?: string } }).error?.code,
			label,
		).toBeTypeOf("string");
	}
}

beforeAll(async () => {
	await flush(redis);
	await seedAll(redis);
	ids = Object.fromEntries(
		await Promise.all(
			Object.entries(ADAPTERS).map(async ([n, a]) => [
				n,
				(await a.list()).map((r) => r.id),
			]),
		),
	);
});

describe("agent API (fuzz)", () => {
	beforeEach(async () => {
		await flush(redis);
		await seedAll(redis);
		h = harness();
	});

	it("tokens without publish never change what the public site shows", async () => {
		const before = await liveSnapshot();
		await fc.assert(
			fc.asyncProperty(
				fc.array(requestArb(["writer", "reader", "deleter"]), {
					minLength: 1,
					maxLength: 6,
				}),
				async (reqs) => {
					for (const r of reqs) {
						const res = await send(r);
						assertWellFormed(res, r);
					}
					expect(await liveSnapshot()).toBe(before);
				},
			),
			{ numRuns: 150 },
		);
		await assertStoreValid();
	});

	it("never errors and never stores an invalid record, whatever the token", async () => {
		let writes = 0;
		await fc.assert(
			fc.asyncProperty(
				fc.array(requestArb(["admin", "publisher", "talks-only", "writer"]), {
					minLength: 1,
					maxLength: 6,
				}),
				async (reqs) => {
					for (const r of reqs) {
						const res = await send(r);
						assertWellFormed(res, r);
						if (res.status < 300 && r.method !== "GET") writes++;
					}
				},
			),
			{ numRuns: 600 },
		);
		await assertStoreValid();
		// Make sure the generator reaches the write paths, not just validation.
		// Most generated writes are rejected on purpose; a run lands ~20–30, so
		// the floor sits well below that to stay deterministic in practice.
		expect(writes).toBeGreaterThan(5);
	});

	it("revisions only move forward, one per successful write", async () => {
		const slug = ids.talks[0];
		let rev = 0;
		await fc.assert(
			fc.asyncProperty(
				fc.array(fc.tuple(fc.integer({ min: 0, max: 3 }), textish), {
					minLength: 1,
					maxLength: 5,
				}),
				async (steps) => {
					for (const [offset, tagline] of steps) {
						const res = await h.call("PATCH", `/talks/${slug}`, {
							ifMatch: Math.max(0, rev - offset),
							body: { tagline },
						});
						if (res.status === 200 && !res.body.unchanged) {
							expect(res.body.rev).toBe(rev + 1);
							rev = res.body.rev;
						} else if (res.status === 200) {
							expect(res.body.rev).toBe(rev);
						} else {
							expect([412, 422]).toContain(res.status);
						}
					}
					const cur = await h.call("GET", `/talks/${slug}`);
					expect(cur.body.rev).toBe(rev);
				},
			),
			{ numRuns: 100 },
		);
	});
});
