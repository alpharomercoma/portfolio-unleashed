import "server-only";

import { unstable_cache } from "next/cache";
import type { ZodType } from "zod";

import {
	type Versioned,
	type WriteOp,
	type WriteOptions,
	WriteConflictError,
	applyWrites,
	readIndex,
	readVersioned,
} from "@/lib/content/revisions";
import { isChartable } from "@/lib/chart-rows";
import { createLogger } from "@/lib/logger";
import { createRedis, failReadInProduction } from "@/lib/redis";
import { type CollectionConfig, getCollection } from "./registry";

const log = createLogger("collections");
const redis = createRedis();
export const isCollectionsStoreConfigured = redis != null;

export type CollectionItem = { id: string } & Record<string, unknown>;

export const collectionTag = (key: string) => `collection:${key}`;
export const ITEM_KEY = (key: string, id: string) => `col:${key}:item:${id}`;
export const IDS_KEY = (key: string) => `col:${key}:ids`;

function parseItems(cfg: CollectionConfig, raw: unknown[]): CollectionItem[] {
	return raw
		.map((r) => cfg.schema.safeParse(r))
		.flatMap((r) => (r.success ? [r.data as CollectionItem] : []));
}

// Uncached Upstash read with a committed-seed fallback (mirrors the talks store
// so the build stays green and the public site renders with no credentials).
async function readAll(key: string): Promise<CollectionItem[]> {
	const cfg = getCollection(key);
	if (!cfg) return [];
	const seed = () => cfg.sort(cfg.seed) as CollectionItem[];
	if (!redis) return seed();
	try {
		// One atomic read of the index and its records. Once the collection
		// holds any item it is authoritative: an empty or invalid result is
		// served as is, never replaced by the committed seed (that would put
		// different content live).
		const rows = await readIndex(redis, IDS_KEY(key), ITEM_KEY(key, ""));
		if (!rows.length) return seed();
		const items = parseItems(
			cfg,
			rows.flatMap((r) => (r.value ? [r.value] : [])),
		);
		return cfg.sort(items) as CollectionItem[];
	} catch (error) {
		failReadInProduction(error);
		log.warn(`${key}: read failed; using seed`, error);
		return seed();
	}
}

/**
 * Read all items in a collection. The result is cached indefinitely and tagged
 * with `collection:<key>`; the admin write actions call `revalidateTag` on
 * change, so Upstash is hit only on a cache miss, never on every request.
 */
export function getAllItems(key: string): Promise<CollectionItem[]> {
	return unstable_cache(() => readAll(key), ["collection", key], {
		tags: [collectionTag(key)],
	})();
}

/**
 * Public typed read: validate each item against `schema` so callers receive `T[]`
 * instead of the loose `CollectionItem[]`, and drop items flagged `hidden` so they
 * never reach the live site. Keeps the schema the single source of truth from store
 * to render (no `as unknown as` casts at call sites). Admin, which must show hidden
 * items too, reads through `getAllItems` instead.
 */
export async function getTypedItems<T>(
	key: string,
	schema: ZodType<T>,
): Promise<T[]> {
	const items = await getAllItems(key);
	return items.flatMap((item) => {
		const res = schema.safeParse(item);
		if (!res.success) return [];
		// safeParse fills the `hidden` default, so legacy items missing the field
		// read as visible. Hidden items exist only in the store and admin.
		if ((res.data as { hidden?: boolean }).hidden) return [];
		return [res.data];
	});
}

export async function getItem(
	key: string,
	id: string,
): Promise<CollectionItem | null> {
	const all = await getAllItems(key);
	return all.find((i) => i.id === id) ?? null;
}

function requireStore(key: string) {
	const cfg = getCollection(key);
	if (!cfg) throw new Error(`Unknown collection: ${key}`);
	if (!redis) {
		throw new Error(
			"Collections store is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
		);
	}
	return { cfg, db: redis };
}

/**
 * Validate + persist an item through the revisioned writer. Derives an id from
 * the config when absent. `opts` states the preconditions; a failed one throws
 * WriteConflictError and writes nothing.
 */
export async function upsertItem(
	key: string,
	data: Record<string, unknown>,
	opts: WriteOptions = {},
): Promise<CollectionItem & { rev: number }> {
	const { cfg, db } = requireStore(key);
	const id = (data.id && String(data.id).trim()) || cfg.idFrom(data);
	const parsed = cfg.schema.parse({ ...data, id }) as CollectionItem;
	// Rows the page can't draw would otherwise vanish without a word.
	const { bars } = parsed as { bars?: string[] };
	if (bars && !isChartable(bars)) {
		throw new Error(
			'Chart rows must read "Label = 42 ms", with one number and the same unit on every row.',
		);
	}
	const [rev] = await applyWrites(
		db,
		[
			{
				key: ITEM_KEY(key, parsed.id),
				op: "set",
				value: parsed,
				index: { key: IDS_KEY(key), member: parsed.id },
				maxIndexSize: opts.maxIndexSize,
				exists: opts.mustExist,
				expectedRev: opts.expectedRev,
			},
		],
		{
			actor: opts.actor ?? { type: "admin" },
			haltKey: opts.haltKey,
			audit: {
				action: opts.mustExist === false ? "create" : "update",
				resource: key,
				id: parsed.id,
				...opts.audit,
			},
		},
	);
	return Object.assign(parsed, { rev });
}

export async function removeItem(
	key: string,
	id: string,
	opts: WriteOptions = {},
): Promise<number> {
	const { db } = requireStore(key);
	const [rev] = await applyWrites(
		db,
		[
			{
				key: ITEM_KEY(key, id),
				op: "del",
				index: { key: IDS_KEY(key), member: id },
				exists: opts.mustExist ?? true,
				expectedRev: opts.expectedRev,
				keepIndexNonEmpty: opts.keepIndexNonEmpty,
			},
		],
		{
			actor: opts.actor ?? { type: "admin" },
			haltKey: opts.haltKey,
			audit: { action: "delete", resource: key, id, ...opts.audit },
		},
	);
	return rev;
}

/**
 * Flip a single item's `hidden` flag, preserving every other field. Reads the
 * raw stored record and its revision (not the cache), re-validates through the
 * schema, and writes back only if nothing changed in between. No-ops if the item
 * is gone.
 */
export async function setItemHidden(
	key: string,
	id: string,
	hidden: boolean,
	opts: WriteOptions = {},
): Promise<void> {
	const { cfg, db } = requireStore(key);
	const [current] = await readVersioned(db, [ITEM_KEY(key, id)]);
	if (!current.value || typeof current.value !== "object") return;
	const parsed = cfg.schema.parse({
		...(current.value as Record<string, unknown>),
		hidden,
	}) as CollectionItem;
	await applyWrites(
		db,
		[
			{
				key: ITEM_KEY(key, id),
				op: "set",
				value: parsed,
				exists: true,
				expectedRev: opts.expectedRev ?? current.rev,
			},
		],
		{
			actor: opts.actor ?? { type: "admin" },
			audit: {
				action: hidden ? "hide" : "unhide",
				resource: key,
				id,
				...opts.audit,
			},
		},
	);
}

/**
 * Persist a new ordering for a collection. `orderedIds` is the list of item ids
 * in their new visual order; each item's `order` is rewritten to `(i+1)*10`
 * (gaps left for readability) while every other field is preserved verbatim. Ids
 * that no longer exist are skipped. The `ids` set membership is unchanged. All
 * items are written in one atomic batch against the revisions just read, so a
 * concurrent edit makes the whole reorder fail instead of being overwritten.
 */
export async function reorderItems(
	key: string,
	orderedIds: string[],
	opts: Omit<WriteOptions, "expectedRev" | "mustExist"> & {
		/** Revisions the caller based the order on; defaults to the ones read here. */
		expectedRevs?: Record<string, number>;
	} = {},
): Promise<Record<string, number>> {
	const { db } = requireStore(key);
	if (!orderedIds.length) return {};
	const revsGiven = opts.expectedRevs;
	if (revsGiven && orderedIds.some((id) => !Object.hasOwn(revsGiven, id))) {
		// A partial map would let unlisted items be checked against whatever is
		// current, i.e. not at all.
		throw new Error("reorder: expectedRevs must cover every id");
	}

	const rows = await readVersioned(
		db,
		orderedIds.map((id) => ITEM_KEY(key, id)),
	);
	const ops: WriteOp[] = [];
	orderedIds.forEach((id, index) => {
		const current = rows[index];
		if (!current.value || typeof current.value !== "object") {
			// Deleted since the caller listed it: an order built on a stale list
			// must fail, not silently drop the item. (Callers without revisions
			// keep the old skip behaviour.)
			if (revsGiven) {
				throw new WriteConflictError("missing", ITEM_KEY(key, id), current.rev);
			}
			return;
		}
		ops.push({
			key: ITEM_KEY(key, id),
			op: "set",
			value: {
				...(current.value as Record<string, unknown>),
				order: (index + 1) * 10,
			},
			exists: true,
			expectedRev: revsGiven ? revsGiven[id] : current.rev,
			// With caller revisions the order must still cover every member when
			// it commits: an item created meanwhile fails the reorder.
			...(revsGiven
				? {
						index: { key: IDS_KEY(key), member: id },
						indexSize: orderedIds.length,
					}
				: {}),
		});
	});
	const revs = await applyWrites(db, ops, {
		actor: opts.actor ?? { type: "admin" },
		haltKey: opts.haltKey,
		audit: { action: "reorder", resource: key, ids: orderedIds, ...opts.audit },
	});
	// New revision per written item, so a caller can keep reordering.
	return Object.fromEntries(
		ops.map((op, i) => [op.key.slice(ITEM_KEY(key, "").length), revs[i]]),
	);
}

/** Uncached read of one stored item with its revision (for edits). */
export async function readItemVersioned(
	key: string,
	id: string,
): Promise<Versioned> {
	const { db } = requireStore(key);
	const [v] = await readVersioned(db, [ITEM_KEY(key, id)]);
	return v;
}

/** Uncached read of every stored item (hidden included) with revisions. */
export async function listItemsVersioned(
	key: string,
): Promise<(Versioned & { id: string })[]> {
	const { db } = requireStore(key);
	return readIndex(db, IDS_KEY(key), ITEM_KEY(key, ""));
}

/**
 * An item for the admin edit form, read straight from the store (not the
 * cache) so its content and revision agree. Falls back to the cached read, with
 * no revision, when Upstash is not configured or the collection is not seeded.
 */
export async function getItemForEdit(
	key: string,
	id: string,
): Promise<{ item: CollectionItem; rev?: number } | null> {
	const cfg = getCollection(key);
	if (!cfg) return null;
	if (!redis) {
		const item = await getItem(key, id);
		return item ? { item } : null;
	}
	// The revision is returned on every path, so the save is always checked.
	const { value, rev } = await readItemVersioned(key, id);
	if (value) {
		const parsed = cfg.schema.safeParse(value);
		if (parsed.success) return { item: parsed.data as CollectionItem, rev };
		log.warn(`${key}/${id}: stored item fails validation; editing from cache`);
	} else if (await isCollectionSeeded(key)) {
		return null;
	}
	const item = await getItem(key, id);
	return item ? { item, rev } : null;
}

/**
 * Items for the admin list with their revisions, read from the store (not the
 * cache) so the drag-to-reorder list submits revisions that match what it
 * shows. Falls back to the cached read, without revisions, when the store is
 * not configured or not seeded.
 */
export async function getItemsForAdmin(
	key: string,
): Promise<(CollectionItem & { _rev?: number })[]> {
	const cfg = getCollection(key);
	if (!cfg) return [];
	if (redis && (await isCollectionSeeded(key))) {
		const rows = await listItemsVersioned(key);
		const items = rows.flatMap((r) => {
			const parsed = cfg.schema.safeParse(r.value);
			return parsed.success
				? [Object.assign(parsed.data as CollectionItem, { _rev: r.rev })]
				: [];
		});
		return cfg.sort(items) as (CollectionItem & { _rev?: number })[];
	}
	return getAllItems(key);
}

/** True once the collection holds at least one item (the seed was pushed). */
export async function isCollectionSeeded(key: string): Promise<boolean> {
	const { db } = requireStore(key);
	return (await db.scard(IDS_KEY(key))) > 0;
}
