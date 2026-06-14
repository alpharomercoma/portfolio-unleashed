import "server-only";

import { Redis } from "@upstash/redis";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import seedData from "../../../data/talks.seed.json";
import { type Talk, sortTalksByRecency, talkSchema } from "./schema";

// Revalidated by the admin write actions; until then reads serve from cache.
export const TALKS_TAG = "talks";

// Support both the Upstash-native and Vercel-KV-style env var names.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token =
	process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const isStoreConfigured = Boolean(url && token);

const redis = isStoreConfigured
	? new Redis({ url: url as string, token: token as string })
	: null;

const TALK_KEY = (slug: string) => `talk:${slug}`;
const SLUGS_KEY = "talks:slugs";

// The committed seed doubles as the static fallback when Upstash isn't configured
// (local dev / a build with no credentials) and the canonical data the seed script
// pushes into Upstash. Keeps /speaking populated and the build green without creds.
function seedTalks(): Talk[] {
	const res = z.array(talkSchema).safeParse(seedData);
	return res.success ? res.data : [];
}

function parseTalks(raw: unknown[]): Talk[] {
	return raw
		.map((t) => talkSchema.safeParse(t))
		.flatMap((r) => (r.success ? [r.data] : []));
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

export async function getFeaturedTalks(limit = 3): Promise<Talk[]> {
	const all = await getAllTalks();
	const featured = all.filter((t) => t.featured);
	return (featured.length ? featured : all).slice(0, limit);
}

export async function upsertTalk(talk: Talk): Promise<void> {
	if (!redis) {
		throw new Error(
			"Talks store is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
		);
	}
	const now = new Date().toISOString();
	const toSave: Talk = {
		...talk,
		createdAt: talk.createdAt || now,
		updatedAt: now,
	};
	await redis.set(TALK_KEY(talk.slug), toSave);
	await redis.sadd(SLUGS_KEY, talk.slug);
}

export async function deleteTalk(slug: string): Promise<void> {
	if (!redis) {
		throw new Error("Talks store is not configured.");
	}
	await redis.del(TALK_KEY(slug));
	await redis.srem(SLUGS_KEY, slug);
}
