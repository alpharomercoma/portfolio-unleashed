import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { z } from "zod";

// Agent API credentials. Each agent gets its own random bearer token; only the
// token's SHA-256 is configured on the server (AGENT_TOKENS), so a leaked env
// dump or log does not leak a usable credential. Tokens are 256-bit random, so a
// fast hash is enough (no password-style stretching needed).
//
// AGENT_TOKENS is a JSON array, e.g.
//   [{"name":"codex","hash":"sha256:<hex>","scopes":["read","write"],
//     "resources":["talks"],"expiresAt":"2027-01-01T00:00:00Z"}]

export const AGENT_SCOPES = ["read", "write", "publish", "delete"] as const;
export type AgentScope = (typeof AGENT_SCOPES)[number];

export const TOKEN_PREFIX = "pfa_";
const TOKEN_PATTERN = /^pfa_[A-Za-z0-9_-]{43}$/;

const tokenEntry = z.strictObject({
	name: z
		.string()
		.regex(/^[a-z0-9][a-z0-9_-]{0,39}$/, "lowercase name, max 40 chars"),
	hash: z.string().regex(/^sha256:[0-9a-f]{64}$/, 'expected "sha256:<64 hex>"'),
	scopes: z.array(z.enum(AGENT_SCOPES)).min(1),
	// Resource names the token may touch; omitted or ["*"] means all of them.
	resources: z.array(z.string().min(1)).min(1).optional(),
	expiresAt: z.iso.datetime({ offset: true }).optional(),
});

export type AgentPrincipal = {
	name: string;
	scopes: ReadonlySet<AgentScope>;
	/** null = every resource. */
	resources: ReadonlySet<string> | null;
	expiresAt?: string;
};

type ConfiguredToken = AgentPrincipal & { digest: Buffer };

export type TokenConfig =
	| { state: "unconfigured" }
	| { state: "invalid"; error: string }
	| { state: "ok"; tokens: ConfiguredToken[] };

/**
 * `publish` and `write` imply the narrower scopes they build on, and every
 * scope implies `read`: an agent that may change something may also look at it.
 */
export function expandScopes(scopes: readonly AgentScope[]): Set<AgentScope> {
	const out = new Set<AgentScope>(["read", ...scopes]);
	if (out.has("publish")) out.add("write");
	return out;
}

/** Parse AGENT_TOKENS. Any problem makes the whole config invalid (fail closed). */
export function parseTokenConfig(
	raw: string | undefined,
	knownResources: readonly string[],
): TokenConfig {
	if (!raw || !raw.trim()) return { state: "unconfigured" };
	let json: unknown;
	try {
		json = JSON.parse(raw);
	} catch {
		return { state: "invalid", error: "AGENT_TOKENS is not valid JSON" };
	}
	const parsed = z.array(tokenEntry).min(1).safeParse(json);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		return {
			state: "invalid",
			error: `AGENT_TOKENS[${issue.path.join(".")}]: ${issue.message}`,
		};
	}
	const names = new Set<string>();
	const hashes = new Set<string>();
	const tokens: ConfiguredToken[] = [];
	for (const entry of parsed.data) {
		if (names.has(entry.name)) {
			return {
				state: "invalid",
				error: `duplicate token name "${entry.name}"`,
			};
		}
		if (hashes.has(entry.hash)) {
			return {
				state: "invalid",
				error: `duplicate token hash for "${entry.name}"`,
			};
		}
		names.add(entry.name);
		hashes.add(entry.hash);
		const all = !entry.resources || entry.resources.includes("*");
		if (!all) {
			const unknown = entry.resources!.find((r) => !knownResources.includes(r));
			if (unknown) {
				return {
					state: "invalid",
					error: `token "${entry.name}" names unknown resource "${unknown}"`,
				};
			}
		}
		tokens.push({
			name: entry.name,
			scopes: expandScopes(entry.scopes),
			resources: all ? null : new Set(entry.resources),
			expiresAt: entry.expiresAt,
			digest: Buffer.from(entry.hash.slice("sha256:".length), "hex"),
		});
	}
	return { state: "ok", tokens };
}

export function hashToken(token: string): string {
	return `sha256:${createHash("sha256").update(token, "utf8").digest("hex")}`;
}

/** A fresh token: "pfa_" + 32 random bytes, base64url. */
export function generateToken(): string {
	return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

export type AuthResult =
	| { ok: true; principal: AgentPrincipal }
	| { ok: false; reason: "missing" | "malformed" | "unknown" | "expired" };

/**
 * Resolve an Authorization header to a configured agent. Every configured hash
 * is compared in constant time (no early exit), so timing does not reveal how
 * close a guess was or which entry matched.
 */
export function authenticate(
	header: string | null,
	tokens: readonly ConfiguredToken[],
	now: Date,
): AuthResult {
	if (!header) return { ok: false, reason: "missing" };
	if (header.length > 200) return { ok: false, reason: "malformed" };
	const m = /^Bearer +([^\s]+)$/i.exec(header.trim());
	if (!m || !TOKEN_PATTERN.test(m[1]))
		return { ok: false, reason: "malformed" };
	const digest = createHash("sha256").update(m[1], "utf8").digest();
	let match: ConfiguredToken | null = null;
	for (const t of tokens) {
		if (timingSafeEqual(digest, t.digest) && !match) match = t;
	}
	if (!match) return { ok: false, reason: "unknown" };
	if (match.expiresAt && Date.parse(match.expiresAt) <= now.getTime()) {
		return { ok: false, reason: "expired" };
	}
	const { digest: _digest, ...principal } = match;
	void _digest;
	return { ok: true, principal };
}

export function canAccess(p: AgentPrincipal, resource: string): boolean {
	return p.resources === null || p.resources.has(resource);
}
