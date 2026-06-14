import "server-only";

import { Redis } from "@upstash/redis";
import { unstable_cache } from "next/cache";

import { type CollectionConfig, getCollection } from "./registry";

// Support both the Upstash-native and Vercel-KV-style env var names.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token =
	process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const isCollectionsStoreConfigured = Boolean(url && token);

const redis = isCollectionsStoreConfigured
	? new Redis({ url: url as string, token: token as string })
	: null;

export type CollectionItem = { id: string } & Record<string, unknown>;

export const collectionTag = (key: string) => `collection:${key}`;
const ITEM_KEY = (key: string, id: string) => `col:${key}:item:${id}`;
const IDS_KEY = (key: string) => `col:${key}:ids`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseItems(
	cfg: CollectionConfig<any>,
	raw: unknown[],
): CollectionItem[] {
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
		console.warn(`[collections:${key}] read failed; using seed.`, error);
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
