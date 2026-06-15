import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { createRedis } from "@/lib/redis";

// Reuse the same Upstash client/creds as the content stores.
const redis = createRedis();

// Sliding window: at most 5 sign-in attempts per IP per 10 minutes.
const loginLimiter = redis
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(5, "10 m"),
			prefix: "ratelimit:login",
			analytics: false,
		})
	: null;

// The AI draft action fetches a PDF and calls Mistral, so it is expensive even
// behind admin auth. Cap it to curb runaway cost / accidental loops.
const aiDraftLimiter = redis
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(15, "1 h"),
			prefix: "ratelimit:aidraft",
			analytics: false,
		})
	: null;

/**
 * Returns `{ success: false }` when the IP has exceeded the sign-in limit.
 * No-ops to success when Upstash is not configured (e.g. local dev).
 */
export async function loginRateLimit(
	ip: string,
): Promise<{ success: boolean; remaining: number }> {
	if (!loginLimiter)
		return { success: true, remaining: Number.POSITIVE_INFINITY };
	const { success, remaining } = await loginLimiter.limit(ip);
	return { success, remaining };
}

/**
 * Returns `{ success: false }` when the AI draft limit is exceeded for `key`
 * (an admin IP). No-ops to success when Upstash is not configured.
 */
export async function aiDraftRateLimit(
	key: string,
): Promise<{ success: boolean; remaining: number }> {
	if (!aiDraftLimiter)
		return { success: true, remaining: Number.POSITIVE_INFINITY };
	const { success, remaining } = await aiDraftLimiter.limit(key);
	return { success, remaining };
}
