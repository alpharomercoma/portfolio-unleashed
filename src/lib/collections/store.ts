import "server-only";

import { unstable_cache } from "next/cache";
import type { ZodType } from "zod";

import { createLogger } from "@/lib/logger";
import { createRedis } from "@/lib/redis";
import { type CollectionConfig, getCollection } from "./registry";

const log = createLogger("collections");
const redis = createRedis();
export const isCollectionsStoreConfigured = redis != null;

export type CollectionItem = { id: string } & Record<string, unknown>;

export const collectionTag = (key: string) => `collection:${key}`;
const ITEM_KEY = (key: string, id: string) => `col:${key}:item:${id}`;
const IDS_KEY = (key: string) => `col:${key}:ids`;

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
		const ids = await redis.smembers(IDS_KEY(key));
		if (!ids?.length) return seed();
		const raw = await redis.mget<unknown[]>(
			...ids.map((id) => ITEM_KEY(key, id)),
		);
		const items = parseItems(cfg, (raw ?? []).filter(Boolean));
		return cfg.sort(items.length ? items : cfg.seed) as CollectionItem[];
	} catch (error) {
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
 * Typed read: validate each item against `schema` so callers receive `T[]` instead
 * of the loose `CollectionItem[]`. Keeps the schema the single source of truth from
 * store to render (no `as unknown as` casts at call sites).
 */
export async function getTypedItems<T>(
	key: string,
	schema: ZodType<T>,
): Promise<T[]> {
	const items = await getAllItems(key);
	return items.flatMap((item) => {
		const res = schema.safeParse(item);
		return res.success ? [res.data] : [];
	});
}

export async function getItem(
	key: string,
	id: string,
): Promise<CollectionItem | null> {
	const all = await getAllItems(key);
	return all.find((i) => i.id === id) ?? null;
}

/** Validate + persist an item. Derives an id from the config when absent. */
export async function upsertItem(
	key: string,
	data: Record<string, unknown>,
): Promise<CollectionItem> {
	const cfg = getCollection(key);
	if (!cfg) throw new Error(`Unknown collection: ${key}`);
	if (!redis) {
		throw new Error(
			"Collections store is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
		);
	}
	const id = (data.id && String(data.id).trim()) || cfg.idFrom(data);
	const parsed = cfg.schema.parse({ ...data, id }) as CollectionItem;
	await redis.set(ITEM_KEY(key, parsed.id), parsed);
	await redis.sadd(IDS_KEY(key), parsed.id);
	return parsed;
}

export async function removeItem(key: string, id: string): Promise<void> {
	if (!redis) throw new Error("Collections store is not configured.");
	await redis.del(ITEM_KEY(key, id));
	await redis.srem(IDS_KEY(key), id);
}

/**
 * Persist a new ordering for a collection. `orderedIds` is the full list of item
 * ids in their new visual order; each item's `order` is rewritten to `(i+1)*10`
 * (gaps left for readability) while every other field is preserved verbatim. Ids
 * that no longer exist are skipped. The `ids` set membership is unchanged.
 */
export async function reorderItems(
	key: string,
	orderedIds: string[],
): Promise<void> {
	const cfg = getCollection(key);
	if (!cfg) throw new Error(`Unknown collection: ${key}`);
	if (!redis) throw new Error("Collections store is not configured.");
	if (!orderedIds.length) return;

	// Read existing items so we only overwrite `order` and keep all other fields.
	const raw = await redis.mget<unknown[]>(
		...orderedIds.map((id) => ITEM_KEY(key, id)),
	);

	const pipeline = redis.pipeline();
	let writes = 0;
	orderedIds.forEach((id, index) => {
		const current = raw?.[index];
		if (!current || typeof current !== "object") return; // id gone; skip
		pipeline.set(ITEM_KEY(key, id), {
			...(current as Record<string, unknown>),
			order: (index + 1) * 10,
		});
		writes++;
	});
	if (writes) await pipeline.exec();
}
