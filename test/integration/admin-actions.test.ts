import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveAboutAction } from "@/app/admin/about-actions";
import { removeTalk, saveTalk } from "@/app/admin/actions";
import {
	revertAgentChange,
	toggleAgentFreeze,
} from "@/app/admin/agent-actions";
import { getFreeze } from "@/lib/agent/service";
import { getTalkForEdit, readTalkVersioned } from "@/lib/talks/store";
import {
	removeCollectionItem,
	reorderCollectionItems,
	saveCollectionItem,
	toggleCollectionItemVisibility,
} from "@/app/admin/collection-actions";
import {
	getAllItems,
	getItemsForAdmin,
	readItemVersioned,
} from "@/lib/collections/store";

import { harness } from "../agent-harness";
import { flush, seedAll, testRedis } from "../helpers";

vi.mock("@/lib/session", () => ({ requireAdmin: async () => {} }));
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT ${url}`);
	},
}));

const redis = testRedis();

beforeEach(async () => {
	await flush(redis);
	await seedAll(redis);
});

function form(fields: Record<string, string>) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.set(k, v);
	return fd;
}

describe("admin saves next to agent writes", () => {
	it("doesn't undo an agent's hide from a stale cached copy", async () => {
		const h = harness();
		// A visible item, so the agent's hide is a real change. Primes the cache.
		const id = (await getAllItems("projects")).find((p) => !p.hidden)!.id;
		const hide = await h.call("PATCH", `/projects/${id}`, {
			as: "publisher",
			ifMatch: 0,
			body: { hidden: true },
		});
		expect(hide.status).toBe(200);
		// The owner opens the edit form after the agent's change (rev 1) and
		// saves a title edit; the form has no `hidden` field.
		await expect(
			saveCollectionItem(
				form({
					collection: "projects",
					id,
					rev: "1",
					title: "Owner title",
					category: "Machine Learning",
				}),
			),
		).rejects.toThrow(/REDIRECT \/admin\/projects$/);
		const saved = await readItemVersioned("projects", id);
		expect(saved.value).toMatchObject({ title: "Owner title", hidden: true });
	});

	it("rejects a save from a form opened before an agent's change", async () => {
		const h = harness();
		const id = (await getAllItems("projects"))[0].id;
		await h.call("PATCH", `/projects/${id}`, {
			as: "publisher",
			ifMatch: 0,
			body: { demoLabel: "agent" },
		});
		await expect(
			saveCollectionItem(
				form({
					collection: "projects",
					id,
					rev: "0",
					title: "Owner title",
					category: "Machine Learning",
				}),
			),
		).rejects.toThrow(/REDIRECT .*changed%20since%20you%20opened%20it/);
		expect((await readItemVersioned("projects", id)).value).toMatchObject({
			demoLabel: "agent",
		});
	});
});

describe("dashboard guardrails", () => {
	it("won't delete the last item of a section", async () => {
		await flush(redis);
		await redis.set("col:awards:item:only", {
			id: "only",
			title: "Only",
			organization: "Org",
		});
		await redis.sadd("col:awards:ids", "only");
		await expect(
			removeCollectionItem(form({ collection: "awards", id: "only" })),
		).rejects.toThrow(/REDIRECT \/admin\/awards\?error=.*last%20one/);
		expect(await redis.smembers("col:awards:ids")).toEqual(["only"]);
	});

	it("refuses About markdown that would crash the renderer", async () => {
		await expect(
			saveAboutAction(form({ title: "About", body: ">".repeat(3000) + "x" })),
		).rejects.toThrow(/REDIRECT \/admin\/about\?error=Not%20saved/);
		expect(await redis.get("about:doc")).toBeNull();
	});
});

describe("adding to a list the owner has ordered", () => {
	it("puts a new recommendation last, so the chosen first stays first", async () => {
		await expect(
			saveCollectionItem(
				form({
					collection: "recommendations",
					quote: "A new quote.",
					author: "New Person",
				}),
			),
		).rejects.toThrow(/REDIRECT \/admin\/recommendations$/);
		const items = await getAllItems("recommendations");
		expect(items[0].id).toBe("justine-jude-pura");
		expect(items.at(-1)?.id).toBe("new-person");
	});
});

describe("dashboard drag-to-reorder", () => {
	it("fails when an agent changed the list after it was rendered, and keeps working after", async () => {
		const items = await getItemsForAdmin("gallery");
		const ids = items.map((i) => i.id).reverse();
		const revs = Object.fromEntries(items.map((i) => [i.id, i._rev!]));
		await harness().call("PATCH", `/gallery/${ids[0]}`, {
			as: "publisher",
			ifMatch: revs[ids[0]],
			body: { title: "Agent caption" },
		});
		const stale = await reorderCollectionItems("gallery", ids, revs);
		expect(stale.ok).toBe(false);
		const fresh = await getItemsForAdmin("gallery");
		const freshRevs = Object.fromEntries(fresh.map((i) => [i.id, i._rev!]));
		const first = await reorderCollectionItems("gallery", ids, freshRevs);
		expect(first.ok).toBe(true);
		// A second drag with the revisions the first one returned also works.
		const second = await reorderCollectionItems(
			"gallery",
			[...ids].reverse(),
			first.ok ? first.revs : {},
		);
		expect(second.ok).toBe(true);
		expect((await readItemVersioned("gallery", ids[0])).value).toMatchObject({
			title: "Agent caption",
		});
	});
});

describe("dashboard row actions use the revision they showed", () => {
	it("won't delete or toggle a newer version than the list displayed", async () => {
		const items = await getItemsForAdmin("projects");
		const { id, _rev } = items[0];
		await harness().call("PATCH", `/projects/${id}`, {
			as: "publisher",
			ifMatch: _rev!,
			body: { demoLabel: "agent" },
		});
		await expect(
			removeCollectionItem(
				form({ collection: "projects", id, rev: String(_rev) }),
			),
		).rejects.toThrow(/REDIRECT \/admin\/projects\?error=.*changed%20since/);
		await expect(
			toggleCollectionItemVisibility(
				form({ collection: "projects", id, rev: String(_rev), hidden: "true" }),
			),
		).rejects.toThrow(/REDIRECT \/admin\/projects\?error=/);
		expect((await readItemVersioned("projects", id)).value).toMatchObject({
			demoLabel: "agent",
		});
	});

	it("refuses a drag without a complete revision map", async () => {
		const items = await getItemsForAdmin("gallery");
		const ids = items.map((i) => i.id);
		expect((await reorderCollectionItems("gallery", ids)).ok).toBe(false);
		expect(
			(await reorderCollectionItems("gallery", ids, { [ids[0]]: 0 })).ok,
		).toBe(false);
	});
});

describe("talk actions", () => {
	const slug = "git-and-github-foundations";

	async function talkForm(rev: number, overrides: Record<string, string> = {}) {
		const { talk } = (await getTalkForEdit(slug))!;
		return form({
			slug,
			rev: String(rev),
			title: talk.title,
			tagline: talk.tagline,
			type: talk.type,
			level: talk.level ?? "",
			category: talk.category,
			durationMinutes: String(talk.durationMinutes),
			abstract: talk.abstract,
			status: talk.status,
			events: JSON.stringify(talk.events),
			createdAt: talk.createdAt,
			...overrides,
		});
	}

	it("saves at the opened revision and rejects a stale form", async () => {
		await expect(
			saveTalk(await talkForm(0, { tagline: "Owner" })),
		).rejects.toThrow(/REDIRECT \/admin\/talks$/);
		expect((await readTalkVersioned(slug)).value).toMatchObject({
			tagline: "Owner",
		});
		await expect(
			saveTalk(await talkForm(0, { tagline: "Stale" })),
		).rejects.toThrow(/changed%20since%20you%20opened%20it/);
		expect((await readTalkVersioned(slug)).value).toMatchObject({
			tagline: "Owner",
		});
	});

	it("deletes only the revision the list showed", async () => {
		await harness().call("PATCH", `/talks/${slug}`, {
			as: "publisher",
			ifMatch: 0,
			body: { tagline: "agent" },
		});
		await expect(removeTalk(form({ slug, rev: "0" }))).rejects.toThrow(
			/REDIRECT \/admin\/talks\?error=.*changed%20since/,
		);
		await expect(removeTalk(form({ slug, rev: "1" }))).rejects.toThrow(
			/REDIRECT \/admin\/talks$/,
		);
		expect((await readTalkVersioned(slug)).value).toBeNull();
	});
});

describe("agents page actions", () => {
	it("freezes and unfreezes agent writes", async () => {
		await expect(
			toggleAgentFreeze(form({ freeze: "true", reason: "maintenance" })),
		).rejects.toThrow(/saved=frozen/);
		expect(await getFreeze()).toMatchObject({ reason: "maintenance" });
		const blocked = await harness().call("POST", "/talks", {
			as: "writer",
			body: { title: "Blocked" },
		});
		expect(blocked.status).toBe(423);
		await expect(toggleAgentFreeze(form({ freeze: "false" }))).rejects.toThrow(
			/saved=unfrozen/,
		);
		expect(await getFreeze()).toBeNull();
	});

	it("reverts an agent change, only from the revision it showed", async () => {
		const slug = "git-and-github-foundations";
		const h = harness();
		await h.call("PATCH", `/talks/${slug}`, {
			as: "publisher",
			ifMatch: 0,
			body: { tagline: "a" },
		});
		await h.call("PATCH", `/talks/${slug}`, {
			as: "publisher",
			ifMatch: 1,
			body: { tagline: "b" },
		});
		await expect(
			revertAgentChange(
				form({ resource: "talks", id: slug, toRev: "0", fromRev: "1" }),
			),
		).rejects.toThrow(/error=/);
		await expect(
			revertAgentChange(
				form({ resource: "talks", id: slug, toRev: "1", fromRev: "2" }),
			),
		).rejects.toThrow(/saved=Restored/);
		expect((await readTalkVersioned(slug)).value).toMatchObject({
			tagline: "a",
		});
		await expect(
			revertAgentChange(
				form({ resource: "constructor", id: "x", toRev: "0", fromRev: "1" }),
			),
		).rejects.toThrow(/error=/);
	});
});
