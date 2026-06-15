import "server-only";

import { unstable_cache } from "next/cache";

import { createRedis } from "@/lib/redis";
import aboutSeed from "../../../data/about.seed.json";
import { type About, aboutSchema } from "./schema";

const redis = createRedis();
export const isAboutStoreConfigured = redis != null;

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
