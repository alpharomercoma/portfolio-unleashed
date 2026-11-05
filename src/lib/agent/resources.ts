import "server-only";

import type { z } from "zod";

import {
	ABOUT_KEY,
	ABOUT_TAG,
	aboutSeed,
	isAboutStoreConfigured,
	readAboutVersioned,
	saveAbout,
} from "@/lib/about/store";
import { aboutSchema } from "@/lib/about/schema";
import { COLLECTION_KEYS, getCollection } from "@/lib/collections/registry";
import {
	ITEM_KEY,
	collectionTag,
	isCollectionSeeded,
	isCollectionsStoreConfigured,
	listItemsVersioned,
	readItemVersioned,
	removeItem,
	reorderItems,
	upsertItem,
} from "@/lib/collections/store";
import type { Actor, VersionMeta, WriteOptions } from "@/lib/content/revisions";
import { type Talk, slugify } from "@/lib/talks/schema";
import {
	TALKS_TAG,
	TALK_KEY,
	deleteTalk,
	isStoreConfigured as isTalksStoreConfigured,
	isTalksStoreSeeded,
	listTalksVersioned,
	parseTalk,
	readTalkVersioned,
	upsertTalk,
} from "@/lib/talks/store";
import seedTalks from "../../../data/talks.seed.json";

import { isValidId } from "./guards";
import {
	type CollectionInputKey,
	aboutInput,
	collectionInputs,
	talkCrossIssues,
	talkInput,
} from "./schemas";

// One adapter per agent-addressable resource, so the API service treats talks,
// the collections, and the About singleton the same way.

export type Rec = Record<string, unknown>;

export type Row = {
	id: string;
	/** Parsed record, or null when absent. */
	record: Rec | null;
	rev: number;
	meta: VersionMeta;
	/** Validation problems when a stored value fails the store schema. */
	issues?: string[];
};

export type BuildMode = "create" | "replace" | "patch";

export class BuildError extends Error {
	constructor(readonly issues: { path: string; message: string }[]) {
		super(issues.map((i) => `${i.path}: ${i.message}`).join("; "));
	}
}

export type Adapter = {
	name: string;
	kind: "collection" | "singleton";
	description: string;
	idField: "slug" | "id" | null;
	/** Field that takes a record on/off the live site, if any. */
	lifecycle: { field: "status" | "hidden"; draftValue: unknown } | null;
	liveRule: string;
	reorderable: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	input: z.ZodObject<any>;
	configured: boolean;
	isLive(record: Rec): boolean;
	seeded(): Promise<boolean>;
	seedRows(): Row[];
	list(): Promise<Row[]>;
	read(id: string): Promise<Row>;
	recordKey(id: string): string;
	/** Validate a stored/historical value against the store schema. */
	parse(
		value: unknown,
	): { ok: true; record: Rec } | { ok: false; issues: string[] };
	/**
	 * Turn validated agent input into the full record to store. `current` is the
	 * stored record (null on create); `siblings` are the other records (for ids
	 * and ordering). Throws BuildError.
	 */
	build(
		mode: BuildMode,
		input: Rec,
		ctx: { id?: string; current: Rec | null; siblings: Row[] },
	): Rec;
	/** Rules spanning fields, checked on the final record of every agent write. */
	crossIssues?(record: Rec): { path: string; message: string }[];
	write(record: Rec, opts: WriteOptions): Promise<{ record: Rec; rev: number }>;
	remove?(id: string, opts: WriteOptions): Promise<number>;
	reorder?(
		ids: string[],
		opts: {
			actor: Actor;
			haltKey?: string;
			expectedRevs: Record<string, number>;
		},
	): Promise<unknown>;
	invalidations(id?: string): { tags: string[]; paths: string[] };
};

function issuesOf(err: { issues: { path: PropertyKey[]; message: string }[] }) {
	return err.issues.map(
		(i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`,
	);
}

function storeParse<T>(schema: z.ZodType<T>, value: unknown) {
	const res = schema.safeParse(value);
	return res.success
		? ({ ok: true, record: res.data as Rec } as const)
		: ({ ok: false, issues: issuesOf(res.error) } as const);
}

function toRow(
	id: string,
	v: { value: unknown; rev: number; meta: VersionMeta },
	parse: Adapter["parse"],
): Row {
	if (v.value == null) return { id, record: null, rev: v.rev, meta: v.meta };
	const p = parse(v.value);
	return p.ok
		? { id, record: p.record, rev: v.rev, meta: v.meta }
		: { id, record: null, rev: v.rev, meta: v.meta, issues: p.issues };
}

/** Lifecycle fields keep their stored value on replace unless sent explicitly. */
function keepLifecycle(
	input: Rec,
	current: Rec | null,
	field: string,
	draftValue: unknown,
): unknown {
	if (field in input) return input[field];
	return current ? current[field] : draftValue;
}

// ── talks ───────────────────────────────────────────────────────────────────

function withEventIds(slug: string, events: unknown): unknown {
	if (!Array.isArray(events)) return events;
	const used = new Set(
		events.flatMap((e) => (e && typeof e.id === "string" ? [e.id] : [])),
	);
	// Generated ids must pass the same id rule as agent input (max 80 chars),
	// or a version holding them could never be restored by an agent.
	const base = slug.slice(0, 74).replace(/-+$/, "") || "event";
	let n = 1;
	return events.map((e) => {
		if (!e || typeof e !== "object" || e.id) return e;
		while (used.has(`${base}-${n}`)) n++;
		const id = `${base}-${n}`;
		used.add(id);
		return { ...e, id };
	});
}

const talks: Adapter = {
	name: "talks",
	kind: "collection",
	description:
		"Talks, workshops, keynotes, and podcasts on /speaking. One talk has many events.",
	idField: "slug",
	lifecycle: { field: "status", draftValue: "draft" },
	liveRule: 'status === "published"',
	reorderable: false,
	input: talkInput,
	configured: isTalksStoreConfigured,
	isLive: (r) => r.status === "published",
	seeded: isTalksStoreSeeded,
	seedRows: () =>
		(seedTalks as unknown[]).flatMap((raw) => {
			const p = parseTalk(raw);
			return p.success
				? [{ id: p.data.slug, record: p.data as Rec, rev: 0, meta: null }]
				: [];
		}),
	async list() {
		const rows = await listTalksVersioned();
		return rows.map((r) => toRow(r.slug, r, talks.parse));
	},
	async read(id) {
		return toRow(id, await readTalkVersioned(id), talks.parse);
	},
	recordKey: TALK_KEY,
	parse(value) {
		const res = parseTalk(value);
		return res.success
			? { ok: true, record: res.data as Rec }
			: { ok: false, issues: issuesOf(res.error) };
	},
	build(mode, input, { id, current }) {
		let rec: Rec;
		if (mode === "patch") {
			rec = { ...current, ...input };
		} else {
			const slug =
				id ?? ((input.slug as string) || slugify(String(input.title)));
			if (!isValidId(slug)) {
				throw new BuildError([
					{
						path: "slug",
						message: `could not derive a valid slug from the title; pass "slug" explicitly`,
					},
				]);
			}
			rec = {
				...input,
				slug,
				status: keepLifecycle(input, current, "status", "draft"),
				createdAt: current?.createdAt ?? "",
			};
		}
		rec.events = withEventIds(String(rec.slug), rec.events);
		return rec;
	},
	crossIssues: (rec) =>
		talkCrossIssues(rec as { type?: string; level?: string }).map(
			(message) => ({ path: "level", message }),
		),
	async write(record, opts) {
		const res = await upsertTalk(record as Talk, opts);
		return { record: res.talk as Rec, rev: res.rev };
	},
	remove: deleteTalk,
	invalidations: (slug) => ({
		tags: [TALKS_TAG],
		paths: [
			"/",
			"/speaking",
			...(slug ? [`/speaking/${slug}`] : []),
			"/admin",
			"/admin/talks",
		],
	}),
};

// ── collections ─────────────────────────────────────────────────────────────

function collectionAdapter(key: CollectionInputKey): Adapter {
	const cfg = getCollection(key)!;
	const adapter: Adapter = {
		name: key,
		kind: "collection",
		description: cfg.description,
		idField: "id",
		lifecycle: { field: "hidden", draftValue: true },
		liveRule: "hidden === false",
		reorderable: Boolean(cfg.reorderable),
		input: collectionInputs[key],
		configured: isCollectionsStoreConfigured,
		isLive: (r) => r.hidden !== true,
		seeded: () => isCollectionSeeded(key),
		seedRows: () =>
			cfg.seed.flatMap((raw: unknown) => {
				const p = storeParse(cfg.schema, raw);
				return p.ok
					? [{ id: String(p.record.id), record: p.record, rev: 0, meta: null }]
					: [];
			}),
		async list() {
			const rows = await listItemsVersioned(key);
			return rows.map((r) => toRow(r.id, r, adapter.parse));
		},
		async read(id) {
			return toRow(id, await readItemVersioned(key, id), adapter.parse);
		},
		recordKey: (id) => ITEM_KEY(key, id),
		parse: (value) => storeParse(cfg.schema, value),
		build(mode, input, { id, current, siblings }) {
			if (mode === "patch") return { ...current, ...input };
			const itemId = id ?? ((input.id as string) || cfg.idFrom(input));
			if (!isValidId(itemId)) {
				throw new BuildError([
					{
						path: "id",
						message: `could not derive a valid id from this item; pass "id" explicitly`,
					},
				]);
			}
			const rec: Rec = {
				...input,
				id: itemId,
				hidden: keepLifecycle(input, current, "hidden", true),
			};
			if (cfg.reorderable) {
				// New items go last; existing ones keep their place. Order changes
				// only through the reorder endpoint.
				rec.order =
					current?.order ??
					siblings.reduce(
						(max, r) => Math.max(max, Number(r.record?.order) || 0),
						0,
					) + 10;
			}
			return rec;
		},
		async write(record, opts) {
			const saved = await upsertItem(key, record, opts);
			const { rev, ...rest } = saved;
			return { record: rest, rev };
		},
		remove: (id, opts) => removeItem(key, id, opts),
		reorder: cfg.reorderable
			? (ids, opts) =>
					reorderItems(key, ids, { ...opts, audit: { via: "agent-api" } })
			: undefined,
		invalidations: () => ({
			tags: [collectionTag(key)],
			paths: ["/", ...(key === "gallery" ? ["/gallery"] : []), `/admin/${key}`],
		}),
	};
	return adapter;
}

// ── about ───────────────────────────────────────────────────────────────────

const ABOUT_ID = "about";

const about: Adapter = {
	name: "about",
	kind: "singleton",
	description: "The About page (/about): a title and a markdown body.",
	idField: null,
	lifecycle: null,
	liveRule: "always live",
	reorderable: false,
	input: aboutInput,
	configured: isAboutStoreConfigured,
	isLive: () => true,
	// A missing document just means the seed is served; writing creates it.
	seeded: async () => true,
	seedRows: () => [{ id: ABOUT_ID, record: aboutSeed(), rev: 0, meta: null }],
	async list() {
		return [await about.read(ABOUT_ID)];
	},
	async read() {
		const v = await readAboutVersioned();
		const row = toRow(ABOUT_ID, v, about.parse);
		// Nothing stored yet: the seed is what is live, at revision 0.
		return row.record || row.issues
			? row
			: { ...row, record: aboutSeed() as Rec };
	},
	recordKey: () => ABOUT_KEY,
	parse: (value) => storeParse(aboutSchema, value),
	build(mode, input, { current }) {
		// updatedAt is stamped by saveAbout; carry the current one so the record
		// validates (and diffs) before the write.
		return mode === "patch"
			? { ...current, ...input }
			: { ...input, updatedAt: current?.updatedAt ?? "" };
	},
	async write(record, opts) {
		const { rev, ...saved } = await saveAbout(
			{ title: String(record.title), body: String(record.body) },
			opts,
		);
		return { record: saved, rev };
	},
	invalidations: () => ({
		tags: [ABOUT_TAG],
		paths: ["/about", "/", "/admin/about"],
	}),
};

export const ADAPTERS: Record<string, Adapter> = Object.fromEntries([
	["talks", talks],
	["about", about],
	...COLLECTION_KEYS.map((k) => [
		k,
		collectionAdapter(k as CollectionInputKey),
	]),
]);

export const RESOURCE_NAMES = Object.keys(ADAPTERS);

export function getAdapter(name: string): Adapter | null {
	return Object.hasOwn(ADAPTERS, name) ? ADAPTERS[name] : null;
}
