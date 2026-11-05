import { describe, expect, it, vi } from "vitest";

// The Upstash limiter reports success with reason "timeout" when Redis is slow
// (it fails open). Agent traffic must treat that as "not allowed".
vi.mock("@upstash/ratelimit", () => {
	class Ratelimit {
		static slidingWindow() {
			return {};
		}
		async limit() {
			return { success: true, reset: 0, remaining: 0, reason: "timeout" };
		}
	}
	return { Ratelimit };
});

describe("agentRateLimit", () => {
	it("denies when the limiter timed out", async () => {
		const { agentRateLimit } = await import("@/lib/ratelimit");
		for (const bucket of ["read", "write", "authfail"] as const) {
			const r = await agentRateLimit(bucket, "k");
			expect(r.success).toBe(false);
			expect(r.reset).toBeGreaterThan(Date.now());
		}
	});
});
