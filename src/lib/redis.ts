import "server-only";

import { Redis } from "@upstash/redis";

// Single source of truth for the Upstash connection. Both the Upstash-native and
// the Vercel-KV-style env var names are accepted, so the content stores and the
// rate limiter don't each re-implement the fallback.
export function getRedisCreds(): { url: string; token: string } | null {
	const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
	const token =
		process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
	return url && token ? { url, token } : null;
}

/** A configured Redis client, or null when credentials are absent (local dev). */
export function createRedis(): Redis | null {
	const creds = getRedisCreds();
	return creds ? new Redis(creds) : null;
}

/**
 * A configured store that can't be read. In production this rethrows instead of
 * letting the caller fall back to its seed: that result would be cached until the
 * next write, and the seed isn't what's live. A failed revalidation keeps the last
 * good page up and retries. The exception is right after a save, which expires the
 * cache at once: that page shows the error page until the store is back, which beats
 * wrong content that stays. Elsewhere the seed keeps local work going.
 */
export function failReadInProduction(error: unknown): void {
	if (process.env.NODE_ENV === "production") throw error;
}
