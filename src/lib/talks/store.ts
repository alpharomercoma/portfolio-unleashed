import "server-only";

import { Redis } from "@upstash/redis";
import { z } from "zod";

import seedData from "../../../data/talks.seed.json";
import { type Talk, sortTalksByRecency, talkSchema } from "./schema";

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

export async function getAllTalks(): Promise<Talk[]> {
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

export async function getTalk(slug: string): Promise<Talk | null> {
	const fromSeed = () => seedTalks().find((t) => t.slug === slug) ?? null;
	if (!redis) return fromSeed();
	try {
		const raw = await redis.get<unknown>(TALK_KEY(slug));
		if (!raw) return fromSeed();
		const res = talkSchema.safeParse(raw);
		return res.success ? res.data : fromSeed();
	} catch (error) {
		console.warn("[talks] read failed; using seed fallback.", error);
		return fromSeed();
	}
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
