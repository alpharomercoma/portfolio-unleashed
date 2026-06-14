import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Reuse the same Upstash credentials as the content stores.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token =
	process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

// Sliding window: at most 5 sign-in attempts per IP per 10 minutes.
const ratelimit =
	url && token
		? new Ratelimit({
				redis: new Redis({ url, token }),
				limiter: Ratelimit.slidingWindow(5, "10 m"),
				prefix: "ratelimit:login",
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
	if (!ratelimit) return { success: true, remaining: Number.POSITIVE_INFINITY };
	const { success, remaining } = await ratelimit.limit(ip);
	return { success, remaining };
}
