import { beforeEach, describe, expect, it } from "vitest";

import { setFreeze } from "@/lib/agent/service";
import { generateToken, hashToken } from "@/lib/agent/tokens";
import { upsertTalk } from "@/lib/talks/store";
import { WriteConflictError } from "@/lib/content/revisions";

import { harness } from "../agent-harness";
import { SEED_COUNTS, flush, seedAll, testRedis } from "../helpers";

const redis = testRedis();
let h = harness();

const DRAFT_TALK = {
	title: "Agents in Production",
	tagline: "What breaks first",
	type: "Talk",
	level: "Intermediate",
	tags: ["agents", "ops"],
	abstract: "Line one.\r\nLine two.",
	events: [
		{
			eventName: "DevCon",
			organizerName: "DevCon PH",
			date: "2026-11-02",
			audienceSize: 120,
		},
	],
};

beforeEach(async () => {
	await flush(redis);
	await seedAll(redis);
	h = harness();
});

describe("configuration and authentication", () => {
	it("is off (501) without AGENT_TOKENS and fails closed (503) when malformed", async () => {
		expect((await harness({ tokensEnv: "" }).call("GET", "/")).status).toBe(
			501,
		);
		for (const bad of [
			"not json",
			"{}",
			"[]",
			'[{"name":"x","hash":"sha256:abc","scopes":["read"]}]',
			`[{"name":"x","hash":"${hashToken("a")}","scopes":["root"]}]`,
			`[{"name":"x","hash":"${hashToken("a")}","scopes":["read"],"resources":["secrets"]}]`,
			`[{"name":"x","hash":"${hashToken("a")}","scopes":["read"]},{"name":"x","hash":"${hashToken("b")}","scopes":["read"]}]`,
			`[{"name":"x","hash":"${hashToken("a")}","scopes":["read"],"extra":1}]`,
		]) {
			const r = await harness({ tokensEnv: bad }).call("GET", "/");
			expect(r.status, bad).toBe(503);
			expect(JSON.stringify(r.body)).not.toContain("sha256");
		}
	});

	it("rejects missing, malformed, unknown, and expired tokens", async () => {
		const none = await h.call("GET", "/talks", { as: null });
		expect(none.status).toBe(401);
		expect(none.headers.get("www-authenticate")).toMatch(/Bearer/);
		for (const t of [
			"nope",
			"pfa_short",
			generateToken(),
			`${h.tokens.admin}x`,
		]) {
			expect((await h.call("GET", "/talks", { as: t })).status).toBe(401);
		}
		const raw = await h.call("GET", "/talks", {
			as: null,
			headers: { authorization: h.tokens.admin },
		});
		expect(raw.status).toBe(401);
		const exp = await h.call("GET", "/", { as: "expired" });
		expect(exp.status).toBe(401);
		expect(exp.body.error.message).toMatch(/expired/);
	});

	it("authenticates before routing, so unknown paths don't leak", async () => {
		expect((await h.call("GET", "/secrets/x", { as: null })).status).toBe(401);
		expect(
			(await h.call("GET", "/talks/nope", { as: "talks-only" })).status,
		).toBe(404);
	});

	it("rate-limits failed auth per IP and per-token traffic", async () => {
		h.rate.fail.add("authfail");
		const r = await h.call("GET", "/", { as: generateToken() });
		expect(r.status).toBe(429);
		expect(Number(r.headers.get("retry-after"))).toBeGreaterThan(0);
		h.rate.fail.clear();
		h.rate.fail.add("write:writer");
		expect((await h.call("GET", "/talks", { as: "writer" })).status).toBe(200);
		expect(
			(await h.call("POST", "/talks", { as: "writer", body: DRAFT_TALK }))
				.status,
		).toBe(429);
	});
});

describe("discovery and reads", () => {
	it("describes the caller and only the resources it may use", async () => {
		const r = await h.call("GET", "/", { as: "talks-only" });
		expect(r.status).toBe(200);
		expect(r.body.agent).toMatchObject({
			name: "talks-only",
			scopes: ["read", "write", "publish"],
			resources: ["talks"],
		});
		expect(Object.keys(r.body.resources)).toEqual(["talks"]);
		expect(r.body.resources.talks.schema.properties.title).toBeTruthy();
		const all = await h.call("GET", "/", { as: "reader" });
		expect(Object.keys(all.body.resources).sort()).toEqual(
			Object.keys(SEED_COUNTS).concat("about").sort(),
		);
		expect(all.headers.get("cache-control")).toBe("no-store");
	});

	it("lists every stored record with its revision, and hides other resources", async () => {
		const r = await h.call("GET", "/talks", { as: "reader" });
		expect(r.status).toBe(200);
		expect(r.body.source).toBe("store");
		expect(r.body.items).toHaveLength(SEED_COUNTS.talks);
		expect(r.body.items[0]).toMatchObject({ rev: 0, live: true });
		expect(
			(await h.call("GET", "/projects", { as: "talks-only" })).status,
		).toBe(404);
	});

	it("reads one record with an ETag, and rejects bad ids and paths", async () => {
		const slug = "git-and-github-foundations";
		const r = await h.call("GET", `/talks/${slug}`, { as: "reader" });
		expect(r.status).toBe(200);
		expect(r.headers.get("etag")).toBe('"0"');
		expect(r.body.data.slug).toBe(slug);
		expect((await h.call("GET", "/talks/does-not-exist")).status).toBe(404);
		for (const p of [
			"/talks/UPPER",
			"/talks/a%2Fb",
			"/talks/a.b",
			"/talks/-x",
			"/talks/a b",
		]) {
			expect((await h.call("GET", p)).status, p).toBe(400);
		}
		for (const p of [
			"/constructor",
			"/__proto__",
			"/toString/x",
			"/talks/x/y/z",
			"/talks/x/nope",
		]) {
			expect((await h.call("GET", p)).status, p).toBe(404);
		}
	});

	it("serves the committed seed when the store is not seeded yet", async () => {
		await flush(redis);
		const r = await h.call("GET", "/projects", { as: "reader" });
		expect(r.body.source).toBe("seed");
		expect(r.body.items).toHaveLength(SEED_COUNTS.projects);
		const w = await h.call("POST", "/projects", {
			body: { title: "New thing" },
		});
		expect(w.status).toBe(409);
		expect(w.body.error.code).toBe("store_not_seeded");
		expect(await redis.dbsize()).toBe(0);
	});
});

describe("drafts, publishing, and scopes", () => {
	it("creates talks as drafts with a write token", async () => {
		const r = await h.call("POST", "/talks", {
			as: "writer",
			body: DRAFT_TALK,
		});
		expect(r.status).toBe(201);
		expect(r.body).toMatchObject({
			id: "agents-in-production",
			rev: 1,
			fromRev: null,
			live: false,
			touchedLive: false,
		});
		expect(r.body.data.status).toBe("draft");
		expect(r.body.data.abstract).toBe("Line one.\nLine two.");
		expect(r.body.data.events[0].id).toBe("agents-in-production-1");
		expect(r.body.data.createdAt).toMatch(/^\d{4}-/);
		expect(h.invalidated.at(-1)?.tags).toEqual(["talks"]);
		expect(h.notified).toHaveLength(0);
		const read = await h.call("GET", "/talks/agents-in-production", {
			as: "reader",
		});
		expect(read.body.updatedBy).toEqual({ type: "agent", name: "writer" });
	});

	it("refuses to create over an existing record", async () => {
		await h.call("POST", "/talks", { as: "writer", body: DRAFT_TALK });
		const dup = await h.call("POST", "/talks", {
			as: "writer",
			body: DRAFT_TALK,
		});
		expect(dup.status).toBe(409);
		expect(dup.body.error.code).toBe("already_exists");
		const seedDup = await h.call("POST", "/talks", {
			as: "writer",
			body: { ...DRAFT_TALK, slug: "git-and-github-foundations" },
		});
		expect(seedDup.status).toBe(409);
	});

	it("needs publish for anything live, before or after the change", async () => {
		const live = await h.call("POST", "/talks", {
			as: "writer",
			body: { ...DRAFT_TALK, status: "published" },
		});
		expect(live.status).toBe(403);
		expect(live.body.error.required).toBe("publish");

		const edit = await h.call("PATCH", "/talks/git-and-github-foundations", {
			as: "writer",
			ifMatch: 0,
			body: { tagline: "sneaky" },
		});
		expect(edit.status).toBe(403);

		await h.call("POST", "/talks", { as: "writer", body: DRAFT_TALK });
		const draftEdit = await h.call("PATCH", "/talks/agents-in-production", {
			as: "writer",
			ifMatch: 1,
			body: { tagline: "Still a draft" },
		});
		expect(draftEdit.status).toBe(200);
		expect(draftEdit.body.changed).toEqual(["tagline"]);

		const publish = await h.call("PATCH", "/talks/agents-in-production", {
			as: "writer",
			ifMatch: 2,
			body: { status: "published" },
		});
		expect(publish.status).toBe(403);

		const ok = await h.call("PATCH", "/talks/agents-in-production", {
			as: "publisher",
			ifMatch: 2,
			body: { status: "published" },
		});
		expect(ok.status).toBe(200);
		expect(ok.body).toMatchObject({ live: true, touchedLive: true, rev: 3 });
		expect(h.notified).toHaveLength(1);
		expect(h.notified[0].subject).toContain("publisher");
		expect(h.invalidated.at(-1)?.paths).toContain(
			"/speaking/agents-in-production",
		);
	});

	it("requires About writes to hold publish", async () => {
		const r = await h.call("PATCH", "/about", {
			as: "writer",
			ifMatch: 0,
			body: { title: "Hi" },
		});
		expect(r.status).toBe(403);
	});

	it("keeps lifecycle fields on PUT unless sent", async () => {
		const slug = "git-and-github-foundations";
		const before = await h.call("GET", `/talks/${slug}`);
		const {
			slug: _s,
			createdAt,
			updatedAt,
			status,
			...rest
		} = before.body.data;
		void _s;
		void updatedAt;
		const put = await h.call("PUT", `/talks/${slug}`, {
			ifMatch: 0,
			body: { ...rest, title: "Git & GitHub Foundations (2026)" },
		});
		expect(put.status).toBe(200);
		expect(put.body.data.status).toBe(status);
		expect(put.body.data.createdAt).toBe(createdAt);
		expect(put.body.changed).toEqual(["title"]);
	});

	it("restricts tokens to their resources", async () => {
		const r = await h.call("POST", "/projects", {
			as: "talks-only",
			body: { title: "X" },
		});
		expect(r.status).toBe(404);
	});
});

describe("optimistic concurrency", () => {
	const slug = "git-and-github-foundations";

	it("requires a well-formed, current If-Match", async () => {
		const missing = await h.call("PATCH", `/talks/${slug}`, {
			body: { tagline: "x" },
		});
		expect(missing.status).toBe(428);
		for (const bad of [
			"*",
			"abc",
			'"1", "2"',
			"-1",
			"1.5",
			'"',
			"99999999999999999",
		]) {
			const r = await h.call("PATCH", `/talks/${slug}`, {
				ifMatch: bad,
				body: { tagline: "x" },
			});
			expect(r.status, bad).toBe(400);
		}
		const stale = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 5,
			body: { tagline: "x" },
		});
		expect(stale.status).toBe(412);
		expect(stale.body.error.currentRev).toBe(0);
		for (const ok of ['"0"', 'W/"0"', "0"]) {
			const r = await h.call("PATCH", `/talks/${slug}`, {
				ifMatch: ok,
				body: { tagline: "dry" },
				headers: {},
			});
			expect([200, 412]).toContain(r.status);
		}
	});

	it("lets one of two racing agents win and tells the other", async () => {
		const [a, b] = await Promise.all(
			["one", "two"].map((t) =>
				h.call("PATCH", `/talks/${slug}`, { ifMatch: 0, body: { tagline: t } }),
			),
		);
		expect([a.status, b.status].sort()).toEqual([200, 412]);
	});

	it("stops a stale admin save from clobbering an agent edit", async () => {
		await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 0,
			body: { tagline: "agent" },
		});
		const current = (await h.call("GET", `/talks/${slug}`)).body.data;
		await expect(
			upsertTalk(
				{ ...current, tagline: "admin" },
				{ mustExist: true, expectedRev: 0 },
			),
		).rejects.toBeInstanceOf(WriteConflictError);
	});
});

describe("validation guardrails", () => {
	const create = (body: unknown) =>
		h.call("POST", "/talks", { as: "writer", body });

	it("rejects unknown and server-managed fields", async () => {
		for (const extra of [
			{ createdAt: "2020-01-01" },
			{ updatedAt: "x" },
			{ rev: 3 },
			{ titel: "typo" },
			JSON.parse('{"__proto__": {"admin": true}}'),
			{ constructor: { prototype: { x: 1 } } },
		]) {
			const r = await create({ ...DRAFT_TALK, ...extra });
			expect(r.status, JSON.stringify(extra)).toBe(422);
		}
	});

	it("rejects unsafe URLs and images", async () => {
		for (const field of [
			{ primarySlideUrl: "javascript:alert(1)" },
			{ primarySlideUrl: "data:text/html,<script>" },
			{ primarySlideUrl: "//evil.example/x" },
			{ primarySlideUrl: "https://user:pw@docs.google.com/x" },
			{ primarySlideUrl: "https://docs.google.com/presentation/d/x y" },
			{ videoUrl: "ftp://example.com/v" },
			{ showcaseImage: "https://evil.example/a.png" },
			{ showcaseImage: "http://x.public.blob.vercel-storage.com/a.png" },
			{ showcaseImage: "https://a.b.public.blob.vercel-storage.com/a.png" },
			{ showcaseImage: "/../../etc/passwd.png" },
			{ showcaseImage: "//evil.example/a.png" },
			{ showcaseImage: "/talks/covers/x.html" },
			{ showcaseImage: "cover.png" },
		]) {
			const r = await create({ ...DRAFT_TALK, ...field });
			expect(r.status, JSON.stringify(field)).toBe(422);
		}
		const ok = await create({
			...DRAFT_TALK,
			showcaseImage:
				"https://abc123.public.blob.vercel-storage.com/media/a.png",
			primarySlideUrl: "https://docs.google.com/presentation/d/abc/edit",
		});
		expect(ok.status).toBe(201);
	});

	it("takes a talk with no recorded duration", async () => {
		const ok = await create({ ...DRAFT_TALK, title: "No Duration Known" });
		expect(ok.status).toBe(201);
		expect(ok.body.data.durationMinutes).toBe(0);
	});

	it("rejects invisible and control characters, and bad shapes", async () => {
		for (const body of [
			{ ...DRAFT_TALK, title: "Hello‮evil" },
			{ ...DRAFT_TALK, title: "two\nlines" },
			{ ...DRAFT_TALK, title: "nul\u0000" },
			{ ...DRAFT_TALK, title: "bad \ud800 surrogate" },
			{ ...DRAFT_TALK, title: "   " },
			{ ...DRAFT_TALK, title: "x".repeat(201) },
			{ ...DRAFT_TALK, durationMinutes: "60" },
			{ ...DRAFT_TALK, durationMinutes: 1e308 },
			{ ...DRAFT_TALK, durationMinutes: 1.5 },
			{ ...DRAFT_TALK, durationMinutes: -1 },
			{
				...DRAFT_TALK,
				primarySlideUrl: "https://docs.google.com/presentation/d/a/edit",
				events: [
					{
						...DRAFT_TALK.events[0],
						slideUrl: "https://docs.google.com/presentation/d/b/edit",
					},
				],
			},
			{ ...DRAFT_TALK, tags: ["a", "A"] },
			{ ...DRAFT_TALK, type: "Podcast", level: "Advanced" },
			{
				...DRAFT_TALK,
				events: [{ ...DRAFT_TALK.events[0], date: "2026-02-30" }],
			},
			{
				...DRAFT_TALK,
				events: [{ ...DRAFT_TALK.events[0], audienceSize: -1 }],
			},
			{
				...DRAFT_TALK,
				events: [
					{ ...DRAFT_TALK.events[0], id: "e-1" },
					{ ...DRAFT_TALK.events[0], id: "e-1" },
				],
			},
			{ ...DRAFT_TALK, slug: "Bad Slug" },
			{ title: "!!!" }, // slugifies to ""
		]) {
			const r = await create(body);
			expect(r.status, JSON.stringify(body).slice(0, 120)).toBe(422);
			expect(r.body.error.issues.length).toBeGreaterThan(0);
		}
	});

	it("checks markdown in the About body", async () => {
		for (const body of [
			"<script>alert(1)</script>",
			"hi <img src=x onerror=alert(1)>",
			"[x](javascript:alert(1))",
			"[x](//evil.example)",
			"![x](https://evil.example/t.png)",
			"[ref][r]\n\n[r]: javascript:alert(1)",
			"![img][r]\n\n[r]: /a.png",
		]) {
			const r = await h.call("PUT", "/about", {
				as: "publisher",
				ifMatch: 0,
				body: { title: "About", body },
			});
			expect(r.status, body).toBe(422);
		}
		const ok = await h.call("PUT", "/about", {
			as: "publisher",
			ifMatch: 0,
			body: {
				title: "About",
				body: "Hi, see [talks](/speaking), [mail](mailto:a@b.co), <https://example.com>, ![me](/me.jpg).",
			},
		});
		expect(ok.status, JSON.stringify(ok.body)).toBe(200);
		expect(ok.body.rev).toBe(1);
	});

	it("handles merge-patch nulls", async () => {
		const slug = "git-and-github-foundations";
		const reset = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 0,
			body: { tagline: null },
		});
		expect(reset.status).toBe(200);
		expect(reset.body.data.tagline).toBe("");
		for (const body of [{ status: null }, { slug: null }, { nope: null }, {}]) {
			const r = await h.call("PATCH", `/talks/${slug}`, { ifMatch: 1, body });
			expect([400, 422], JSON.stringify(body)).toContain(r.status);
		}
		const title = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 1,
			body: { title: null },
		});
		expect(title.status).toBe(422);
	});

	it("refuses renames through the body", async () => {
		const r = await h.call("PATCH", "/talks/git-and-github-foundations", {
			ifMatch: 0,
			body: { slug: "other" },
		});
		expect(r.status).toBe(400);
	});
});

describe("request hygiene", () => {
	it("enforces content type, size, encoding, and JSON shape", async () => {
		const post = (opts: Parameters<typeof h.call>[2]) =>
			h.call("POST", "/talks", opts);
		expect(
			(
				await post({
					rawBody: JSON.stringify(DRAFT_TALK),
					headers: { "content-type": "text/plain" },
				})
			).status,
		).toBe(415);
		expect(
			(
				await post({
					rawBody: "{",
					headers: { "content-type": "application/json" },
				})
			).status,
		).toBe(400);
		expect(
			(
				await post({
					rawBody: new Uint8Array([0x7b, 0xff, 0x7d]),
					headers: { "content-type": "application/json" },
				})
			).status,
		).toBe(400);
		for (const body of [[], "str", 1, null]) {
			expect((await post({ body })).status, JSON.stringify(body)).toBe(400);
		}
		const big = { ...DRAFT_TALK, abstract: "x".repeat(300 * 1024) };
		expect((await post({ body: big })).status).toBe(413);
		const lying = await post({
			rawBody: JSON.stringify(big),
			headers: { "content-type": "application/json", "content-length": "10" },
		});
		expect(lying.status).toBe(413);
		const deep = "[".repeat(100_000) + "]".repeat(100_000);
		const d = await post({
			rawBody: deep,
			headers: { "content-type": "application/json" },
		});
		expect([400, 413]).toContain(d.status);
	});

	it("answers unsupported methods with 405 and Allow", async () => {
		const r = await h.call("POST", "/talks/git-and-github-foundations", {
			body: {},
		});
		expect(r.status).toBe(405);
		expect(r.headers.get("allow")).toContain("PATCH");
		expect((await h.call("DELETE", "/about", { ifMatch: 0 })).status).toBe(405);
		expect(
			(await h.call("POST", "/awards/_order", { body: { ids: [] } })).status,
		).toBe(405);
	});

	it("validates dryRun", async () => {
		expect(
			(await h.call("POST", "/talks?dryRun=maybe", { body: DRAFT_TALK }))
				.status,
		).toBe(400);
	});
});

describe("dry runs, no-ops, history, and revert", () => {
	const slug = "git-and-github-foundations";

	it("validates and authorizes a dry run without writing", async () => {
		const r = await h.call("PATCH", `/talks/${slug}?dryRun=1`, {
			ifMatch: 0,
			body: { tagline: "preview" },
		});
		expect(r.status).toBe(200);
		expect(r.body).toMatchObject({
			dryRun: true,
			rev: 0,
			changed: ["tagline"],
		});
		expect((await h.call("GET", `/talks/${slug}`)).body.rev).toBe(0);
		expect(h.invalidated).toHaveLength(0);
		const forbidden = await h.call("PATCH", `/talks/${slug}?dryRun=1`, {
			as: "writer",
			ifMatch: 0,
			body: { tagline: "preview" },
		});
		expect(forbidden.status).toBe(403);
	});

	it("does not bump the revision for a no-op", async () => {
		const cur = (await h.call("GET", `/talks/${slug}`)).body.data;
		const r = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 0,
			body: { tagline: cur.tagline },
		});
		expect(r.body).toMatchObject({ unchanged: true, rev: 0 });
		expect(h.invalidated).toHaveLength(0);
	});

	it("keeps history and reverts, including after a delete", async () => {
		await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 0,
			body: { tagline: "v1" },
		});
		await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 1,
			body: { tagline: "v2" },
		});
		const hist = await h.call("GET", `/talks/${slug}/history`, {
			as: "reader",
		});
		expect(hist.body.versions.map((v: { rev: number }) => v.rev)).toEqual([
			1, 0,
		]);
		expect(hist.body.versions[0].data.tagline).toBe("v1");

		const back = await h.call("POST", `/talks/${slug}/revert`, {
			ifMatch: 2,
			body: { rev: 1 },
		});
		expect(back.status).toBe(200);
		expect(back.body.data.tagline).toBe("v1");

		const del = await h.call("DELETE", `/talks/${slug}`, { ifMatch: 3 });
		expect(del.status).toBe(200);
		expect(del.body).toMatchObject({ deleted: true, rev: 4 });
		expect((await h.call("GET", `/talks/${slug}`)).status).toBe(404);
		expect(await redis.sismember("talks:slugs", slug)).toBe(0);

		const restore = await h.call("POST", `/talks/${slug}/revert`, {
			ifMatch: 4,
			body: { rev: 3 },
		});
		expect(restore.status).toBe(200);
		expect(await redis.sismember("talks:slugs", slug)).toBe(1);

		for (const body of [
			{ rev: 999 },
			{ rev: -1 },
			{ rev: "1" },
			{ rev: 1, x: 1 },
			{},
		]) {
			const r = await h.call("POST", `/talks/${slug}/revert`, {
				ifMatch: 5,
				body,
			});
			expect([400, 404], JSON.stringify(body)).toContain(r.status);
		}
	});

	it("re-creating a deleted record continues its revision count", async () => {
		await h.call("POST", "/talks", { as: "writer", body: DRAFT_TALK });
		await h.call("DELETE", "/talks/agents-in-production", {
			as: "deleter",
			ifMatch: 1,
		});
		const again = await h.call("POST", "/talks", {
			as: "writer",
			body: DRAFT_TALK,
		});
		expect(again.status).toBe(201);
		expect(again.body.rev).toBe(3);
	});
});

describe("deletes", () => {
	it("needs delete, and publish for live records", async () => {
		const slug = "git-and-github-foundations";
		expect(
			(
				await h.call("DELETE", `/talks/${slug}`, {
					as: "publisher",
					ifMatch: 0,
				})
			).status,
		).toBe(403);
		expect(
			(await h.call("DELETE", `/talks/${slug}`, { as: "deleter", ifMatch: 0 }))
				.status,
		).toBe(403);
		expect(
			(await h.call("DELETE", `/talks/${slug}`, { as: "admin" })).status,
		).toBe(428);
		await h.call("POST", "/talks", { as: "writer", body: DRAFT_TALK });
		const d = await h.call("DELETE", "/talks/agents-in-production", {
			as: "deleter",
			ifMatch: 1,
		});
		expect(d.status).toBe(200);
		expect(d.body.touchedLive).toBe(false);
		expect(
			(
				await h.call("DELETE", "/talks/agents-in-production", {
					as: "deleter",
					ifMatch: 2,
				})
			).status,
		).toBe(404);
	});
});

describe("collections", () => {
	it("creates hidden items at the end and reorders with publish", async () => {
		const r = await h.call("POST", "/projects", {
			as: "writer",
			body: {
				title: "Agent Console",
				tags: ["agents"],
				github: "https://github.com/x/y",
			},
		});
		expect(r.status).toBe(201);
		expect(r.body.data).toMatchObject({ id: "agent-console", hidden: true });
		const all = (await h.call("GET", "/projects")).body.items;
		const maxOrder = Math.max(
			...all
				.filter((i: { id: string }) => i.id !== "agent-console")
				.map((i: { data: { order: number } }) => i.data.order),
		);
		expect(r.body.data.order).toBe(maxOrder + 10);

		const ids: string[] = all.map((i: { id: string }) => i.id).reverse();
		const revs = Object.fromEntries(
			all.map((i: { id: string; rev: number }) => [i.id, i.rev]),
		);
		expect(
			(
				await h.call("POST", "/projects/_order", {
					as: "writer",
					body: { ids, revs },
				})
			).status,
		).toBe(403);
		for (const body of [
			{ ids },
			{ ids: ids.slice(1), revs },
			{ ids: [...ids, ids[0]], revs },
			{ ids: [...ids, "ghost"], revs: { ...revs, ghost: 0 } },
			{ ids: "x", revs },
			{ ids, revs, extra: 1 },
			{ ids, revs: { ...revs, [ids[0]]: "1" } },
			{ ids, revs: { ...revs, extra: 0 } },
			{ ids, revs: [] },
			{ ids: Array.from({ length: 600 }, (_, i) => `id-${i}`), revs },
		]) {
			const bad = await h.call("POST", "/projects/_order", {
				as: "publisher",
				body,
			});
			expect([400, 422], JSON.stringify(body).slice(0, 80)).toContain(
				bad.status,
			);
		}
		// Someone edits an item after this agent listed the collection: the
		// reorder must fail rather than overwrite with the old snapshot.
		await h.call("PATCH", `/projects/${ids[0]}`, {
			as: "publisher",
			ifMatch: revs[ids[0]],
			body: { demoLabel: "changed" },
		});
		const stale = await h.call("POST", "/projects/_order", {
			as: "publisher",
			body: { ids, revs },
		});
		expect(stale.status).toBe(412);
		// The error names the item that moved, not the reorder.
		expect(stale.body.error.message).toContain(`projects/${ids[0]}`);
		revs[ids[0]] += 1;
		const ok = await h.call("POST", "/projects/_order", {
			as: "publisher",
			body: { ids, revs },
		});
		expect(ok.status).toBe(200);
		const after = (await h.call("GET", "/projects")).body.items as {
			id: string;
			data: { order: number };
		}[];
		const byOrder = [...after]
			.sort((a, b) => a.data.order - b.data.order)
			.map((i) => i.id);
		expect(byOrder).toEqual(ids);
		expect(h.notified.at(-1)?.lines.join(" ")).toContain("order");
	});

	it("unhiding needs publish; collection-specific rules apply", async () => {
		await h.call("POST", "/awards", {
			as: "writer",
			body: {
				title: "Best Agent",
				organization: "Org",
				year: "2026",
				category: "Hackathon",
			},
		});
		expect(
			(
				await h.call("PATCH", "/awards/best-agent", {
					as: "writer",
					ifMatch: 1,
					body: { hidden: false },
				})
			).status,
		).toBe(403);
		expect(
			(
				await h.call("PATCH", "/awards/best-agent", {
					as: "publisher",
					ifMatch: 1,
					body: { hidden: false },
				})
			).status,
		).toBe(200);
		for (const [res, body] of [
			["awards", { title: "x", organization: "y", year: "20266" }],
			["awards", { title: "x", organization: "y", category: "Other" }],
			[
				"certifications",
				{ title: "x", issuer: "y", link: "javascript:alert(1)" },
			],
			["certifications", { title: "x", issuer: "y", date: "2026-13-01" }],
			["recommendations", { quote: "", author: "x" }],
			["gallery", { title: "no image" }],
			["gallery", { image: "photo.png" }],
			["selected-work", { title: "x", href: "//evil.example" }],
			["projects", { title: "x", order: 5 }],
		] as const) {
			const r = await h.call("POST", `/${res}`, { as: "writer", body });
			expect(r.status, `${res} ${JSON.stringify(body)}`).toBe(422);
		}
		const bare = await h.call("POST", "/certifications", {
			as: "writer",
			body: { title: "Cert", issuer: "Org", logo: "aws.png", link: "" },
		});
		expect(bare.status).toBe(201);
	});
});

describe("kill switches and audit", () => {
	it("freezes all agent writes, and read-only mode refuses them", async () => {
		await setFreeze(true, { type: "admin" }, "incident");
		const r = await h.call("POST", "/talks", {
			as: "writer",
			body: DRAFT_TALK,
		});
		expect(r.status).toBe(423);
		expect(r.body.error).toMatchObject({ code: "frozen", reason: "incident" });
		expect((await h.call("GET", "/talks", { as: "reader" })).status).toBe(200);
		expect((await h.call("GET", "/")).body.writes.allowed).toBe(false);
		await setFreeze(false, { type: "admin" });
		expect(
			(await h.call("POST", "/talks", { as: "writer", body: DRAFT_TALK }))
				.status,
		).toBe(201);

		const ro = harness({ readOnly: true });
		const w = await ro.call("PATCH", "/talks/agents-in-production", {
			as: "admin",
			ifMatch: 1,
			body: { tagline: "x" },
		});
		expect(w.status).toBe(423);
	});

	it("audits writes without exposing IPs, filtered to the token's resources", async () => {
		await h.call("POST", "/talks", {
			as: "writer",
			body: DRAFT_TALK,
			headers: { "x-forwarded-for": "203.0.113.9" },
		});
		await h.call("POST", "/projects", { as: "writer", body: { title: "P" } });
		const all = await h.call("GET", "/_audit?limit=10", { as: "reader" });
		expect(all.body.entries).toHaveLength(2);
		expect(all.body.entries[1]).toMatchObject({
			by: { type: "agent", name: "writer" },
			action: "create",
			resource: "talks",
			id: "agents-in-production",
		});
		expect(JSON.stringify(all.body)).not.toContain("203.0.113.9");
		expect(await redis.lindex("content:audit", 1)).toMatchObject({
			detail: { ip: "203.0.113.9" },
		});
		const scoped = await h.call("GET", "/_audit", { as: "talks-only" });
		expect(
			scoped.body.entries.map((e: { resource: string }) => e.resource),
		).toEqual(["talks"]);
		for (const q of ["0", "201", "x", "1.5"]) {
			expect((await h.call("GET", `/_audit?limit=${q}`)).status, q).toBe(400);
		}
	});
});

describe("review regressions (Codex round 1)", () => {
	it("refuses to delete the last record, so the seed can't come back live", async () => {
		await flush(redis);
		await redis.set("col:awards:item:only", {
			id: "only",
			title: "Only",
			organization: "Org",
			hidden: true,
		});
		await redis.sadd("col:awards:ids", "only");
		const r = await h.call("DELETE", "/awards/only", {
			as: "deleter",
			ifMatch: 0,
		});
		expect(r.status).toBe(409);
		expect(r.body.error.code).toBe("last_record");
		expect(await redis.smembers("col:awards:ids")).toEqual(["only"]);
	});

	it("applies the freeze inside the atomic write, not just before it", async () => {
		const { applyWrites, WriteConflictError } =
			await import("@/lib/content/revisions");
		const { FREEZE_KEY } = await import("@/lib/agent/service");
		await redis.set(FREEZE_KEY, {
			at: "now",
			by: { type: "admin" },
			reason: "",
		});
		await expect(
			applyWrites(redis, [{ key: "talk:x", op: "set", value: { a: 1 } }], {
				actor: { type: "agent", name: "w" },
				haltKey: FREEZE_KEY,
			}),
		).rejects.toMatchObject({ reason: "halted" });
		expect(await redis.exists("talk:x")).toBe(0);
		// The owner's writes don't pass a halt key and still go through.
		await applyWrites(redis, [{ key: "talk:x", op: "set", value: { a: 1 } }], {
			actor: { type: "admin" },
		});
		expect(WriteConflictError).toBeTruthy();
	});

	it("keeps an older bundled talk editable, splittable, and revertable", async () => {
		const slug = "git-and-github-foundations";
		const cur = (await h.call("GET", `/talks/${slug}`)).body.data;
		const deck = (id: string) =>
			`https://docs.google.com/presentation/d/${id}/edit`;
		const session = { ...cur.events[0], slideUrl: deck("a") };
		// Saved before the rule: two decks on one talk.
		await upsertTalk(
			{
				...cur,
				primarySlideUrl: deck("a"),
				events: [session, { ...session, id: "second", slideUrl: deck("b") }],
			},
			{ mustExist: true, expectedRev: 0 },
		);
		const edit = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 1,
			body: { tagline: "An edit that adds no deck" },
		});
		expect(edit.status).toBe(200);
		const third = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 2,
			body: { primarySlideUrl: deck("c") },
		});
		expect(third.status).toBe(422);
		const split = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 2,
			body: { events: [session] },
		});
		expect(split.status).toBe(200);
		const back = await h.call("POST", `/talks/${slug}/revert`, {
			ifMatch: 3,
			body: { rev: 2 },
		});
		expect(back.status).toBe(200);
		expect(back.body.data.events).toHaveLength(2);
	});

	it("won't let agents revert to a version that fails today's guardrails", async () => {
		const { adminRevert } = await import("@/lib/agent/service");
		const slug = "git-and-github-foundations";
		const cur = (await h.call("GET", `/talks/${slug}`)).body.data;
		// The owner once saved an image from a host next/image can't load.
		await upsertTalk(
			{ ...cur, showcaseImage: "https://evil.example/x.png" },
			{ mustExist: true, expectedRev: 0 },
		);
		await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 1,
			body: { showcaseImage: "" },
		});
		const r = await h.call("POST", `/talks/${slug}/revert`, {
			ifMatch: 2,
			body: { rev: 1 },
		});
		expect(r.status).toBe(409);
		expect(r.body.error.code).toBe("guardrail_failed");
		const owner = await adminRevert("talks", slug, 1, 2);
		expect(owner.data?.showcaseImage).toBe("https://evil.example/x.png");
	});

	it("rejects URLs that would make next/image throw at render time", async () => {
		for (const showcaseImage of [
			"https://cdn.sanity.io/\ud800.png",
			"https://cdn.sanity.io/%E0%A4%A.png",
			"/talks/covers/\udfff.jpg",
		]) {
			const r = await h.call("POST", "/talks", {
				as: "writer",
				body: { ...DRAFT_TALK, showcaseImage },
			});
			expect(r.status, showcaseImage).toBe(422);
		}
	});

	it("rejects oversized or deeply nested markdown quickly", async () => {
		for (const body of [
			"> ".repeat(100_000) + "x",
			"> ".repeat(9_000) + "x",
			"- ".repeat(9_000) + "x",
			"[".repeat(10_000) + "]".repeat(9_000),
		]) {
			const t = performance.now();
			const r = await h.call("PUT", "/about", {
				as: "writer",
				ifMatch: 0,
				body: { title: "About", body },
			});
			expect(r.status, body.slice(0, 10)).toBe(422);
			expect(performance.now() - t).toBeLessThan(1500);
		}
	});

	it("caps how many records an agent can create", async () => {
		const { MAX_RECORDS } = await import("@/lib/agent/service");
		const p = redis.pipeline();
		for (let i = 0; i < MAX_RECORDS; i++) {
			p.sadd("col:recommendations:ids", `r-${i}`);
		}
		await p.exec();
		const r = await h.call("POST", "/recommendations", {
			as: "writer",
			body: { quote: "Hi", author: "Someone New" },
		});
		expect(r.status).toBe(409);
		expect(r.body.error.code).toBe("too_many_records");
	});
});

describe("seed scripts", () => {
	it("bump revisions, so an agent holding the old one can't overwrite a reseed", async () => {
		const { execFileSync } = await import("node:child_process");
		const id = "nasa-space-apps-challenge-global-nominee";
		const before = await h.call("GET", `/awards/${id}`);
		expect(before.body.rev).toBe(0);
		execFileSync(process.execPath, ["scripts/seed-collections.mjs", "awards"], {
			env: {
				NODE_ENV: "test",
				PATH: process.env.PATH,
				UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
				UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
			},
			stdio: "ignore",
		});
		const stale = await h.call("PATCH", `/awards/${id}`, {
			ifMatch: 0,
			body: { context: "stale write" },
		});
		expect(stale.status).toBe(412);
		const after = await h.call("GET", `/awards/${id}`);
		expect(after.body.updatedBy).toEqual({
			type: "script",
			name: "seed-collections",
		});
	});
});

describe("about", () => {
	it("keeps the seed in history, so the first save can be reverted", async () => {
		const first = await h.call("PATCH", "/about", {
			as: "publisher",
			ifMatch: 0,
			body: { title: "Agent title" },
		});
		expect(first.status).toBe(200);
		const hist = await h.call("GET", "/about/history");
		expect(hist.body.versions).toHaveLength(1);
		expect(hist.body.versions[0]).toMatchObject({ rev: 0, writtenBy: null });
		const back = await h.call("POST", "/about/revert", {
			as: "publisher",
			ifMatch: 1,
			body: { rev: 0 },
		});
		expect(back.status).toBe(200);
		expect(back.body.data.title).toBe(hist.body.versions[0].data.title);
	});
});

describe("review regressions (Codex round 2)", () => {
	it("enforces the record cap atomically, for concurrent creates and restores", async () => {
		const { MAX_RECORDS } = await import("@/lib/agent/service");
		await flush(redis);
		const p = redis.pipeline();
		for (let i = 0; i < MAX_RECORDS - 1; i++)
			p.sadd("col:recommendations:ids", `r-${i}`);
		p.set("col:recommendations:item:r-0", {
			id: "r-0",
			quote: "q",
			author: "a",
			hidden: true,
		});
		await p.exec();
		const results = await Promise.all(
			["one", "two", "three"].map((n) =>
				h.call("POST", "/recommendations", {
					as: "writer",
					body: { quote: "Hi", author: `Author ${n}` },
				}),
			),
		);
		expect(results.filter((r) => r.status === 201)).toHaveLength(1);
		expect(await redis.scard("col:recommendations:ids")).toBe(MAX_RECORDS);
		// Restoring a deleted record is also a new member.
		const del = await h.call("DELETE", "/recommendations/r-0", {
			as: "deleter",
			ifMatch: 0,
		});
		expect(del.status).toBe(200);
		await h.call("POST", "/recommendations", {
			as: "writer",
			body: { quote: "Fill", author: "Filler" },
		});
		const restore = await h.call("POST", "/recommendations/r-0/revert", {
			as: "writer",
			ifMatch: 1,
			body: { rev: 0 },
		});
		expect(restore.status).toBe(409);
		expect(restore.body.error.code).toBe("too_many_records");
	});

	it("fails a reorder when an item was deleted after it was listed", async () => {
		const list = (await h.call("GET", "/gallery")).body.items as {
			id: string;
			rev: number;
		}[];
		const ids = list.map((i) => i.id);
		const revs = Object.fromEntries(list.map((i) => [i.id, i.rev]));
		const { reorderItems } = await import("@/lib/collections/store");
		await h.call("DELETE", `/gallery/${ids[0]}`, { as: "admin", ifMatch: 0 });
		await expect(
			reorderItems("gallery", ids, {
				actor: { type: "admin" },
				expectedRevs: revs,
			}),
		).rejects.toMatchObject({ reason: "missing" });
	});

	it("reports a deleted record's revision, so it can be restored", async () => {
		await h.call("POST", "/talks", { as: "writer", body: DRAFT_TALK });
		await h.call("DELETE", "/talks/agents-in-production", {
			as: "deleter",
			ifMatch: 1,
		});
		const gone = await h.call("GET", "/talks/agents-in-production");
		expect(gone.status).toBe(404);
		expect(gone.body.error.rev).toBe(2);
	});
});

describe("cross-field rules", () => {
	it("apply to the final record of patches and reverts", async () => {
		const slug = "git-and-github-foundations"; // a Workshop with a level
		const bad = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 0,
			body: { type: "Podcast" },
		});
		expect(bad.status).toBe(422);
		const ok = await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 0,
			body: { type: "Podcast", level: null },
		});
		expect(ok.status).toBe(200);
		expect(ok.body.data.level).toBeUndefined();
		// Owner sets the type back via the store; an agent revert to a version that
		// would combine Podcast with a level must still be refused.
		const cur = (await h.call("GET", `/talks/${slug}`)).body.data;
		await upsertTalk(
			{ ...cur, type: "Podcast", level: "Advanced" },
			{ expectedRev: 1 },
		);
		await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 2,
			body: { type: "Talk" },
		});
		const revert = await h.call("POST", `/talks/${slug}/revert`, {
			ifMatch: 3,
			body: { rev: 2 },
		});
		expect([409, 422]).toContain(revert.status);
	});
});

describe("review regressions (Codex round 2, continued)", () => {
	it("generates event ids that stay within the id rule, so versions stay revertable", async () => {
		const slug = "a".repeat(39) + "-" + "b".repeat(40); // 80 chars
		const created = await h.call("POST", "/talks", {
			as: "writer",
			body: { ...DRAFT_TALK, slug },
		});
		expect(created.status).toBe(201);
		const eventId = created.body.data.events[0].id as string;
		expect(eventId.length).toBeLessThanOrEqual(80);
		await h.call("PATCH", `/talks/${slug}`, {
			as: "writer",
			ifMatch: 1,
			body: { tagline: "x" },
		});
		const back = await h.call("POST", `/talks/${slug}/revert`, {
			as: "writer",
			ifMatch: 2,
			body: { rev: 1 },
		});
		expect(back.status).toBe(200);
	});

	it("dry runs refuse what the real request would refuse", async () => {
		await flush(redis);
		await redis.set("col:awards:item:only", {
			id: "only",
			title: "Only",
			organization: "O",
			hidden: true,
		});
		await redis.sadd("col:awards:ids", "only");
		const del = await h.call("DELETE", "/awards/only?dryRun=1", {
			as: "deleter",
			ifMatch: 0,
		});
		expect(del.status).toBe(409);
		await seedAll(redis);
		const list = (await h.call("GET", "/projects")).body.items as {
			id: string;
			rev: number;
		}[];
		const ids = list.map((i) => i.id);
		const revs = Object.fromEntries(list.map((i) => [i.id, i.rev + 5]));
		const dry = await h.call("POST", "/projects/_order?dryRun=1", {
			as: "publisher",
			body: { ids, revs },
		});
		expect(dry.status).toBe(412);
	});

	it("a dashboard form opened on unsaved About content can't overwrite a later save", async () => {
		const { getAboutForEdit } = await import("@/lib/about/store");
		const { saveAbout } = await import("@/lib/about/store");
		const form = await getAboutForEdit();
		expect(form.rev).toBe(0);
		await h.call("PATCH", "/about", {
			as: "publisher",
			ifMatch: 0,
			body: { title: "Agent" },
		});
		await expect(
			saveAbout(
				{ title: "Owner", body: form.about.body },
				{ expectedRev: form.rev },
			),
		).rejects.toMatchObject({ reason: "conflict" });
	});
});

describe("review regressions (Codex round 3)", () => {
	it("never serves the seed once a section is stored, even mid-write", async () => {
		const { getAllItems } = await import("@/lib/collections/store");
		const { readIndex } = await import("@/lib/content/revisions");
		await flush(redis);
		// Index lists an item whose record is gone (the race the old two-step
		// read could observe): the public read must not fall back to the seed.
		await redis.sadd("col:awards:ids", "ghost");
		expect(await getAllItems("awards")).toEqual([]);
		// Ids that look like JSON numbers survive the atomic read intact.
		await redis.sadd("col:awards:ids", "1e5");
		await redis.set("col:awards:item:1e5", {
			id: "1e5",
			title: "T",
			organization: "O",
		});
		const rows = await readIndex(redis, "col:awards:ids", "col:awards:item:");
		expect(rows.map((r) => r.id).sort()).toEqual(["1e5", "ghost"]);
	});

	it("rejects __proto__ and other unknown keys in a patch", async () => {
		await h.call("POST", "/projects", {
			as: "writer",
			body: { title: "Proto Test" },
		});
		const r = await h.call("PATCH", "/projects/proto-test?dryRun=1", {
			as: "writer",
			ifMatch: 1,
			rawBody: '{"__proto__":{"title":"Unexpected"},"description":"ok"}',
			headers: { "content-type": "application/json" },
		});
		expect(r.status).toBe(422);
	});

	it("rejects markdown nested through indentation inside blockquotes", async () => {
		const body = Array.from(
			{ length: 190 },
			(_, i) => "> " + "\t".repeat(i) + "- x",
		).join("\n");
		const r = await h.call("PUT", "/about", {
			as: "publisher",
			ifMatch: 0,
			body: { title: "About", body },
		});
		expect(r.status).toBe(422);
	});

	it("dry-run restores respect the record cap", async () => {
		const { MAX_RECORDS } = await import("@/lib/agent/service");
		await h.call("POST", "/recommendations", {
			as: "writer",
			body: { quote: "Hi", author: "Restorable" },
		});
		await h.call("DELETE", "/recommendations/restorable", {
			as: "deleter",
			ifMatch: 1,
		});
		const p = redis.pipeline();
		for (let i = 0; i < MAX_RECORDS; i++)
			p.sadd("col:recommendations:ids", `fill-${i}`);
		await p.exec();
		const dry = await h.call(
			"POST",
			"/recommendations/restorable/revert?dryRun=1",
			{
				as: "writer",
				ifMatch: 2,
				body: { rev: 1 },
			},
		);
		expect(dry.status).toBe(409);
	});

	it("only accepts remote organizer logos, which the store can save", async () => {
		const local = await h.call("POST", "/talks", {
			as: "writer",
			body: {
				...DRAFT_TALK,
				events: [{ ...DRAFT_TALK.events[0], organizerLogo: "/logo.png" }],
			},
		});
		expect(local.status).toBe(422);
		const remote = await h.call("POST", "/talks", {
			as: "writer",
			body: {
				...DRAFT_TALK,
				events: [
					{
						...DRAFT_TALK.events[0],
						organizerLogo: "https://abc.public.blob.vercel-storage.com/l.png",
					},
				],
			},
		});
		expect(remote.status).toBe(201);
	});
});

describe("review regressions (Codex round 4)", () => {
	it("an agent revert writes the normalized values it validated", async () => {
		await h.call("POST", "/projects", {
			as: "writer",
			body: { title: "Norm" },
		});
		// The owner once stored values the agent schema would trim.
		const { upsertItem } = await import("@/lib/collections/store");
		const cur = (await h.call("GET", "/projects/norm")).body.data;
		await upsertItem(
			"projects",
			{ ...cur, title: "  Norm  ", image: " /og.png" },
			{ expectedRev: 1 },
		);
		await h.call("PATCH", "/projects/norm", {
			as: "writer",
			ifMatch: 2,
			body: { title: "Clean" },
		});
		const r = await h.call("POST", "/projects/norm/revert", {
			as: "writer",
			ifMatch: 3,
			body: { rev: 2 },
		});
		expect(r.status).toBe(200);
		expect(r.body.data).toMatchObject({ title: "Norm", image: "/og.png" });
	});

	it("a reorder fails if an item was created after the list was read", async () => {
		const { reorderItems } = await import("@/lib/collections/store");
		const list = (await h.call("GET", "/gallery")).body.items as {
			id: string;
			rev: number;
		}[];
		const ids = list.map((i) => i.id);
		const revs = Object.fromEntries(list.map((i) => [i.id, i.rev]));
		await h.call("POST", "/gallery", {
			as: "writer",
			body: { image: "/gallery/new.jpg", title: "New" },
		});
		await expect(
			reorderItems("gallery", ids, {
				actor: { type: "admin" },
				expectedRevs: revs,
			}),
		).rejects.toMatchObject({ reason: "conflict" });
		await expect(
			reorderItems("gallery", ids, {
				actor: { type: "admin" },
				expectedRevs: { [ids[0]]: 0 },
			}),
		).rejects.toThrow(/cover every id/);
	});

	it("the owner's revert button refuses if the record moved on since it was shown", async () => {
		const { adminRevert } = await import("@/lib/agent/service");
		const slug = "git-and-github-foundations";
		await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 0,
			body: { tagline: "one" },
		});
		await h.call("PATCH", `/talks/${slug}`, {
			ifMatch: 1,
			body: { tagline: "two" },
		});
		// Dashboard showed the change that produced rev 1; the talk is now at 2.
		await expect(adminRevert("talks", slug, 0, 1)).rejects.toMatchObject({
			status: 412,
		});
		const ok = await adminRevert("talks", slug, 1, 2);
		expect(ok.data?.tagline).toBe("one");
	});
});
