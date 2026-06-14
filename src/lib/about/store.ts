import "server-only";

import { Redis } from "@upstash/redis";
import { unstable_cache } from "next/cache";

import aboutSeed from "../../../data/about.seed.json";
import { type About, aboutSchema } from "./schema";

// Support both the Upstash-native and Vercel-KV-style env var names.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token =
	process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const isAboutStoreConfigured = Boolean(url && token);

const redis = isAboutStoreConfigured
	? new Redis({ url: url as string, token: token as string })
	: null;

export const ABOUT_TAG = "about";
const ABOUT_KEY = "about:doc";

function seed(): About {
	return aboutSchema.parse(aboutSeed);
}

// Uncached Upstash read with a committed-seed fallback so the build stays green
// and the public page renders with no credentials.
async function readAbout(): Promise<About> {
	if (!redis) return seed();
	try {
		const raw = await redis.get<unknown>(ABOUT_KEY);
		if (!raw) return seed();
		const parsed = aboutSchema.safeParse(raw);
		return parsed.success ? parsed.data : seed();
	} catch (error) {
		console.warn("[about] read failed; using seed.", error);
		return seed();
	}
}

/**
 * Read the About document. Cached indefinitely and tagged `about`; the admin
 * write action calls `updateTag`, so Upstash is hit only on a cache miss.
 */
export function getAbout(): Promise<About> {
	return unstable_cache(readAbout, ["about-doc"], { tags: [ABOUT_TAG] })();
}

/** Validate + persist the About document. */
export async function saveAbout(data: {
	title: string;
	body: string;
}): Promise<About> {
	if (!redis) {
		throw new Error(
			"About store is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
		);
	}
	const parsed = aboutSchema.parse({
		...data,
		updatedAt: new Date().toISOString(),
	});
	await redis.set(ABOUT_KEY, parsed);
	return parsed;
}
