import { beforeEach, describe, expect, it } from "vitest";

import { agentRateLimit } from "@/lib/ratelimit";

import { flush, testRedis } from "../helpers";

const redis = testRedis();
beforeEach(() => flush(redis));

describe("agentRateLimit (real Upstash limiter)", () => {
	it("allows 60 writes a minute per agent, then refuses", async () => {
		for (let i = 0; i < 60; i++) {
			expect((await agentRateLimit("write", "agent-a")).success).toBe(true);
		}
		const over = await agentRateLimit("write", "agent-a");
		expect(over.success).toBe(false);
		expect(over.reset).toBeGreaterThan(Date.now());
		// Budgets are per agent and per bucket.
		expect((await agentRateLimit("write", "agent-b")).success).toBe(true);
		expect((await agentRateLimit("read", "agent-a")).success).toBe(true);
	});
});
