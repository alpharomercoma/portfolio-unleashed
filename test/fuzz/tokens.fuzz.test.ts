import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { parseIfMatch } from "@/lib/agent/http";
import { AgentError } from "@/lib/agent/service";
import {
	authenticate,
	generateToken,
	hashToken,
	parseTokenConfig,
} from "@/lib/agent/tokens";

const RESOURCES = ["talks", "about", "projects"];

function config(entries: unknown[]) {
	const c = parseTokenConfig(JSON.stringify(entries), RESOURCES);
	if (c.state !== "ok")
		throw new Error(`bad test config: ${JSON.stringify(c)}`);
	return c.tokens;
}

describe("token config and authentication (fuzz)", () => {
	it("never throws on arbitrary AGENT_TOKENS, and anything accepted is well-formed", () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.string(),
					fc.json(),
					fc
						.array(
							fc.record(
								{
									name: fc.oneof(
										fc.string(),
										fc.constantFrom("ok", "Bad", "a".repeat(41)),
									),
									hash: fc.oneof(fc.string(), fc.constant(hashToken("x"))),
									scopes: fc.array(
										fc.oneof(
											fc.string(),
											fc.constantFrom("read", "write", "root"),
										),
									),
									resources: fc.array(fc.constantFrom("*", "talks", "secrets")),
									expiresAt: fc.oneof(
										fc.string(),
										fc
											.date({ noInvalidDate: true })
											.map((d) => d.toISOString()),
									),
								},
								{ requiredKeys: [] },
							),
						)
						.map((a) => JSON.stringify(a)),
				),
				(raw) => {
					const c = parseTokenConfig(raw, RESOURCES);
					if (c.state !== "ok") return;
					for (const t of c.tokens) {
						expect(t.name).toMatch(/^[a-z0-9][a-z0-9_-]{0,39}$/);
						expect(t.digest).toHaveLength(32);
						expect(t.scopes.has("read")).toBe(true);
					}
				},
			),
			{ numRuns: 3000 },
		);
	});

	it("authenticates exactly the configured token, and nothing else", () => {
		const good = generateToken();
		const tokens = config([
			{ name: "a", hash: hashToken(good), scopes: ["read"] },
		]);
		const now = new Date();
		expect(authenticate(`Bearer ${good}`, tokens, now).ok).toBe(true);
		expect(authenticate(`bearer   ${good}  `, tokens, now).ok).toBe(true);
		fc.assert(
			fc.property(
				fc.oneof(
					fc.string(),
					fc.string().map((s) => `Bearer ${s}`),
					fc.constant(null),
					// One character off the real token.
					fc
						.tuple(
							fc.nat({ max: good.length - 1 }),
							fc.constantFrom(..."ABCabc0123-_"),
						)
						.map(
							([i, ch]) =>
								`Bearer ${good.slice(0, i)}${ch}${good.slice(i + 1)}`,
						)
						.filter((h) => h !== `Bearer ${good}`),
					fc.constantFrom(
						`Bearer ${good} ${good}`,
						`Basic ${good}`,
						`Bearer${good}`,
						`Bearer ${good}\u0000`,
						`Bearer ${good.toUpperCase()}`,
						`Bearer ${hashToken(good)}`,
						`Bearer ${good}`.repeat(10),
					),
				),
				(header) => {
					expect(authenticate(header, tokens, now).ok).toBe(false);
				},
			),
			{ numRuns: 3000 },
		);
	});

	it("honours expiry at the boundary", () => {
		const t = generateToken();
		const tokens = config([
			{
				name: "a",
				hash: hashToken(t),
				scopes: ["read"],
				expiresAt: "2030-01-01T00:00:00Z",
			},
		]);
		expect(
			authenticate(`Bearer ${t}`, tokens, new Date("2029-12-31T23:59:59.999Z"))
				.ok,
		).toBe(true);
		expect(
			authenticate(`Bearer ${t}`, tokens, new Date("2030-01-01T00:00:00Z")),
		).toEqual({
			ok: false,
			reason: "expired",
		});
	});

	it("expands scopes: publish implies write, everything implies read", () => {
		const t = config([
			{ name: "p", hash: hashToken("p"), scopes: ["publish"] },
			{ name: "d", hash: hashToken("d"), scopes: ["delete"] },
		]);
		expect([...t[0].scopes].sort()).toEqual(["publish", "read", "write"]);
		expect([...t[1].scopes].sort()).toEqual(["delete", "read"]);
	});
});

describe("If-Match parsing (fuzz)", () => {
	it("returns a safe integer or throws an AgentError, never anything else", () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.string(),
					fc.nat().map(String),
					fc.nat().map((n) => `"${n}"`),
				),
				(h) => {
					try {
						const rev = parseIfMatch(h);
						expect(Number.isSafeInteger(rev)).toBe(true);
						expect(rev).toBeGreaterThanOrEqual(0);
					} catch (err) {
						expect(err).toBeInstanceOf(AgentError);
					}
				},
			),
			{ numRuns: 3000 },
		);
		expect(parseIfMatch(null)).toBeUndefined();
		expect(parseIfMatch('W/"12"')).toBe(12);
		expect(() => parseIfMatch("*")).toThrow(AgentError);
	});
});
