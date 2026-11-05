import { type AgentDeps, handleAgentRequest } from "@/lib/agent/http";
import { generateToken, hashToken } from "@/lib/agent/tokens";

type TokenSpec = {
	name: string;
	scopes: string[];
	resources?: string[];
	expiresAt?: string;
};

export type Harness = {
	tokens: Record<string, string>;
	deps: AgentDeps;
	invalidated: { tags: string[]; paths: string[] }[];
	notified: { subject: string; lines: string[] }[];
	rate: { fail: Set<string> };
	call: (
		method: string,
		path: string,
		opts?: {
			as?: string | null;
			body?: unknown;
			rawBody?: BodyInit;
			ifMatch?: string | number;
			headers?: Record<string, string>;
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests poke at arbitrary JSON
	) => Promise<{ status: number; body: any; headers: Headers }>;
};

export const DEFAULT_TOKENS: TokenSpec[] = [
	{ name: "reader", scopes: ["read"] },
	{ name: "writer", scopes: ["write"] },
	{ name: "publisher", scopes: ["publish"] },
	{ name: "admin", scopes: ["publish", "delete"] },
	{ name: "deleter", scopes: ["write", "delete"] },
	{ name: "talks-only", scopes: ["publish"], resources: ["talks"] },
	{ name: "expired", scopes: ["publish"], expiresAt: "2000-01-01T00:00:00Z" },
];

/** A handler wired to fake side effects, with one token per DEFAULT_TOKENS entry. */
export function harness(
	opts: { specs?: TokenSpec[]; tokensEnv?: string; readOnly?: boolean } = {},
): Harness {
	const specs = opts.specs ?? DEFAULT_TOKENS;
	const tokens: Record<string, string> = {};
	const config = specs.map((s) => {
		const t = generateToken();
		tokens[s.name] = t;
		return { ...s, hash: hashToken(t) };
	});
	const invalidated: Harness["invalidated"] = [];
	const notified: Harness["notified"] = [];
	const rate = { fail: new Set<string>() };
	const deps: AgentDeps = {
		tokens: () =>
			opts.tokensEnv !== undefined ? opts.tokensEnv : JSON.stringify(config),
		readOnly: () => opts.readOnly ?? false,
		now: () => new Date(),
		rateLimit: async (bucket, key) => ({
			success: !rate.fail.has(`${bucket}:${key}`) && !rate.fail.has(bucket),
			reset: Date.now() + 30_000,
		}),
		invalidate: (tags, paths) => invalidated.push({ tags, paths }),
		notify: (subject, lines) => notified.push({ subject, lines }),
	};
	const call: Harness["call"] = async (method, path, o = {}) => {
		const url = new URL(`http://localhost/api/agent/v1${path}`);
		const segments = url.pathname
			.replace(/^\/api\/agent\/v1\/?/, "")
			.split("/")
			.filter(Boolean)
			.map(decodeURIComponent);
		const headers = new Headers(o.headers);
		const as = o.as === undefined ? "admin" : o.as;
		if (as) headers.set("authorization", `Bearer ${tokens[as] ?? as}`);
		if (o.ifMatch !== undefined) headers.set("if-match", String(o.ifMatch));
		let body: BodyInit | undefined = o.rawBody;
		if (o.body !== undefined) {
			body = JSON.stringify(o.body);
			if (!headers.has("content-type"))
				headers.set("content-type", "application/json");
		}
		const req = new Request(url, { method, headers, body });
		const res = await handleAgentRequest(req, segments, deps);
		const text = await res.text();
		return {
			status: res.status,
			body: text ? JSON.parse(text) : null,
			headers: res.headers,
		};
	};
	return { tokens, deps, invalidated, notified, rate, call };
}
