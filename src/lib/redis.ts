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
