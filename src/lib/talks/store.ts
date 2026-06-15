import "server-only";

import { unstable_cache } from "next/cache";

import { createRedis } from "@/lib/redis";
import seedData from "../../../data/talks.seed.json";
import { type Talk, sortTalksByRecency, talkSchema } from "./schema";

// Revalidated by the admin write actions; until then reads serve from cache.
export const TALKS_TAG = "talks";

const redis = createRedis();
export const isStoreConfigured = redis != null;

const TALK_KEY = (slug: string) => `talk:${slug}`;
const SLUGS_KEY = "talks:slugs";

// The committed seed doubles as the static fallback when Upstash isn't configured
// (local dev / a build with no credentials) and the canonical data the seed script
// pushes into Upstash. Keeps /speaking populated and the build green without creds.
function seedTalks(): Talk[] {
	return parseTalks(seedData as unknown[]);
}

// Records written before the Draft/Published change carry a `needsReview` boolean
// instead of `status`. Map those forward so review-flagged talks become drafts
// (not silently published) without needing a data migration.
function normalizeLegacy(raw: unknown): unknown {
	if (!raw || typeof raw !== "object") return raw;
	const rec = raw as Record<string, unknown>;
	if (rec.status == null && "needsReview" in rec) {
		return { ...rec, status: rec.needsReview === true ? "draft" : "published" };
	}
	return raw;
}

function parseTalks(raw: unknown[]): Talk[] {
	const out: Talk[] = [];
	for (const item of raw) {
		const res = talkSchema.safeParse(normalizeLegacy(item));
		if (res.success) {
			out.push(res.data);
		} else {
			// Surface corruption/seed drift instead of silently dropping data.
			console.warn(
				"[talks] dropped an item that failed validation:",
				res.error.issues
					.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
					.join("; "),
			);
		}
	}
	return out;
}

async function readAllTalks(): Promise<Talk[]> {
	if (!redis) return sortTalksByRecency(seedTalks());
	try {
		const slugs = await redis.smembers(SLUGS_KEY);
		if (!slugs?.length) return sortTalksByRecency(seedTalks());
		const raw = await redis.mget<unknown[]>(...slugs.map(TALK_KEY));
		const talks = parseTalks((raw ?? []).filter(Boolean));
		return sortTalksByRecency(talks.length ? talks : seedTalks());
	} catch (error) {
		console.warn("[talks] read failed; using seed fallback.", error);
		return sortTalksByRecency(seedTalks());
	}
}

/**
 * All talks, cached and tagged `talks`. The admin write actions revalidate the
 * tag, so Upstash is queried only on a cache miss rather than every request.
 */
export function getAllTalks(): Promise<Talk[]> {
	return unstable_cache(readAllTalks, ["talks-all"], { tags: [TALKS_TAG] })();
}

export async function getTalk(slug: string): Promise<Talk | null> {
	// Derive from the cached list so a detail page doesn't add its own query.
	const all = await getAllTalks();
	return all.find((t) => t.slug === slug) ?? null;
}

/** Public-facing talks only — drafts are hidden from the live site. */
export async function getPublishedTalks(): Promise<Talk[]> {
	const all = await getAllTalks();
	return all.filter((t) => t.status === "published");
}

export async function getFeaturedTalks(limit = 3): Promise<Talk[]> {
	const published = await getPublishedTalks();
	const featured = published.filter((t) => t.featured);
	return (featured.length ? featured : published).slice(0, limit);
}

export async function upsertTalk(talk: Talk): Promise<void> {
	if (!redis) {
		throw new Error(
			"Talks store is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
		);
	}
	const now = new Date().toISOString();
	// Validate at the write boundary (mirrors collections' upsertItem) so only
	// schema-valid, size-bounded talks ever reach Redis. Throws ZodError on bad input.
	const toSave = talkSchema.parse({
		...talk,
		createdAt: talk.createdAt || now,
		updatedAt: now,
	});
	await redis.set(TALK_KEY(toSave.slug), toSave);
	await redis.sadd(SLUGS_KEY, toSave.slug);
}

export async function deleteTalk(slug: string): Promise<void> {
	if (!redis) {
		throw new Error("Talks store is not configured.");
	}
	await redis.del(TALK_KEY(slug));
	await redis.srem(SLUGS_KEY, slug);
}
