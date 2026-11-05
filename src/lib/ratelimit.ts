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

// Agent API: per-token budgets for reads and writes, and a per-IP cap on failed
// authentications. Tokens are 256-bit random, so the auth cap is about noise
// and cost, not guessability.
const agentLimiters = redis
	? {
			read: new Ratelimit({
				redis,
				limiter: Ratelimit.slidingWindow(300, "1 m"),
				prefix: "ratelimit:agent:read",
				analytics: false,
			}),
			write: new Ratelimit({
				redis,
				limiter: Ratelimit.slidingWindow(60, "1 m"),
				prefix: "ratelimit:agent:write",
				analytics: false,
			}),
			authfail: new Ratelimit({
				redis,
				limiter: Ratelimit.slidingWindow(30, "10 m"),
				prefix: "ratelimit:agent:authfail",
				analytics: false,
			}),
		}
	: null;

/**
 * Agent API rate limit for `key` (a token name, or an IP for failed auth).
 * No-ops to success when Upstash is not configured.
 */
export async function agentRateLimit(
	bucket: "read" | "write" | "authfail",
	key: string,
): Promise<{ success: boolean; reset: number }> {
	if (!agentLimiters) return { success: true, reset: 0 };
	const { success, reset, reason } = await agentLimiters[bucket].limit(key);
	// The limiter "fails open" (success: true) when Redis doesn't answer in time.
	// For agents, an unverifiable budget means no: they retry after Retry-After.
	if (reason === "timeout")
		return { success: false, reset: Date.now() + 5_000 };
	return { success, reset };
}
