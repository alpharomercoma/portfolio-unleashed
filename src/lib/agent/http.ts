import "server-only";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { createLogger } from "@/lib/logger";

import { isValidId } from "./guards";
import { RESOURCE_NAMES, getAdapter } from "./resources";
import * as svc from "./service";
import { AgentError, type Ctx, type WriteResult } from "./service";
import {
	type AgentPrincipal,
	AGENT_SCOPES,
	authenticate,
	canAccess,
	parseTokenConfig,
} from "./tokens";

// HTTP front for the agent API (mounted at /api/agent/v1/[[...path]]). Kept
// free of Next request APIs so tests can drive it with plain Request objects.
//
//   GET    /                              what this token can do + JSON Schemas
//   GET    /_audit?limit=50               recent writes
//   GET    /{resource}                    list (drafts/hidden included)
//   POST   /{resource}                    create
//   GET    /{resource}/{id}               read one (ETag = revision)
//   PUT    /{resource}/{id}               replace          (If-Match required)
//   PATCH  /{resource}/{id}               JSON merge patch (If-Match required)
//   DELETE /{resource}/{id}               delete           (If-Match required)
//   GET    /{resource}/{id}/history       previous versions
//   POST   /{resource}/{id}/revert        {"rev": n}       (If-Match required)
//   POST   /{resource}/_order             {"ids": [...]}   reorderable sections
//   GET|PUT|PATCH /about, GET /about/history, POST /about/revert
//
// Every write accepts ?dryRun=1: full validation and permission checks, no write.

const log = createLogger("agent-api");

export const MAX_BODY_BYTES = 256 * 1024;

export type RateBucket = "read" | "write" | "authfail";

export type AgentDeps = {
	tokens: () => string | undefined;
	readOnly: () => boolean;
	now: () => Date;
	rateLimit: (
		bucket: RateBucket,
		key: string,
	) => Promise<{ success: boolean; reset?: number }>;
	invalidate: (tags: string[], paths: string[]) => void;
	notify: (subject: string, lines: string[]) => void;
};

const BASE_HEADERS = {
	"Cache-Control": "no-store",
	"X-Content-Type-Options": "nosniff",
	"X-Robots-Tag": "noindex",
};

function json(
	status: number,
	body: unknown,
	headers: Record<string, string> = {},
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			...BASE_HEADERS,
			"Content-Type": "application/json; charset=utf-8",
			...headers,
		},
	});
}

function errorResponse(err: AgentError, requestId: string, headers = {}) {
	return json(
		err.status,
		{
			error: { code: err.code, message: err.message, ...err.details },
			requestId,
		},
		{ "X-Request-Id": requestId, ...headers },
	);
}

const IF_MATCH = /^(?:W\/)?(?:"(\d{1,15})"|(\d{1,15}))$/;

/** The revision in an If-Match header; undefined when absent. */
export function parseIfMatch(header: string | null): number | undefined {
	if (header == null) return undefined;
	const m = IF_MATCH.exec(header.trim());
	if (!m) {
		throw new AgentError(
			400,
			"invalid_if_match",
			'If-Match must be one revision number, e.g. If-Match: "3" (wildcards are not accepted).',
		);
	}
	return Number(m[1] ?? m[2]);
}

/** A boolean query flag: absent/0/false → false; present/""/1/true → true. */
function parseFlag(value: string | null, name: string): boolean {
	if (value == null || value === "0" || value === "false") return false;
	if (value === "" || value === "1" || value === "true") return true;
	throw new AgentError(
		400,
		"invalid_request",
		`?${name} must be 1/true or 0/false.`,
	);
}

const decoder = new TextDecoder("utf-8", { fatal: true });

/** Read a JSON body with a hard size cap (enforced while streaming). */
export async function readJsonBody(req: Request): Promise<unknown> {
	const type = req.headers.get("content-type") ?? "";
	if (!/^application\/json\s*(;|$)/i.test(type)) {
		throw new AgentError(
			415,
			"unsupported_media_type",
			"Send the body as Content-Type: application/json.",
		);
	}
	const declared = Number(req.headers.get("content-length"));
	if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
		throw new AgentError(
			413,
			"payload_too_large",
			`Bodies are limited to ${MAX_BODY_BYTES} bytes.`,
		);
	}
	if (!req.body)
		throw new AgentError(400, "invalid_request", "Missing request body.");
	const reader = req.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > MAX_BODY_BYTES) {
			await reader.cancel().catch(() => {});
			throw new AgentError(
				413,
				"payload_too_large",
				`Bodies are limited to ${MAX_BODY_BYTES} bytes.`,
			);
		}
		chunks.push(value);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const c of chunks) {
		bytes.set(c, offset);
		offset += c.byteLength;
	}
	let text: string;
	try {
		text = decoder.decode(bytes);
	} catch {
		throw new AgentError(
			400,
			"invalid_request",
			"The body is not valid UTF-8.",
		);
	}
	try {
		return JSON.parse(text);
	} catch {
		throw new AgentError(400, "invalid_json", "The body is not valid JSON.");
	}
}

function clientIp(req: Request): string {
	return (
		(req.headers.get("x-real-ip") ??
			(req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim()) ||
		"unknown"
	);
}

function methodNotAllowed(allow: string[]): AgentError {
	return new AgentError(
		405,
		"method_not_allowed",
		`Allowed: ${allow.join(", ")}.`,
		{
			allow,
		},
	);
}

let schemaCache: Record<string, unknown> | null = null;

function describeResources() {
	schemaCache ??= Object.fromEntries(
		RESOURCE_NAMES.map((name) => {
			const a = getAdapter(name)!;
			return [
				name,
				{
					kind: a.kind,
					description: a.description,
					idField: a.idField,
					live: a.liveRule,
					draftByDefault: a.lifecycle
						? { [a.lifecycle.field]: a.lifecycle.draftValue }
						: null,
					reorderable: a.reorderable,
					deletable: Boolean(a.remove),
					schema: z.toJSONSchema(a.input, {
						io: "input",
						unrepresentable: "any",
					}),
				},
			];
		}),
	);
	return schemaCache;
}

function describe(principal: AgentPrincipal, frozen: svc.FreezeState) {
	const all = describeResources();
	return {
		api: "portfolio-agent-api/v1",
		docs: "https://github.com/alpharomercoma/portfolio-unleashed/blob/master/docs/agent-api.md",
		agent: {
			name: principal.name,
			scopes: AGENT_SCOPES.filter((s) => principal.scopes.has(s)),
			resources: principal.resources ? [...principal.resources] : "*",
			expiresAt: principal.expiresAt ?? null,
		},
		writes: frozen
			? { allowed: false, reason: "frozen", since: frozen.at }
			: { allowed: true },
		rules: [
			"write: create and edit records that are not live (draft talks, hidden items).",
			"publish: required for any change that touches the live site, including About and reordering.",
			"delete: required to delete; deleting a live record also needs publish.",
			'Changes to existing records need If-Match: "<rev>" from the last read.',
			"Every write accepts ?dryRun=1 to validate without saving.",
			"Previous versions are kept: GET …/history, POST …/revert.",
		],
		limits: { maxBodyBytes: MAX_BODY_BYTES },
		resources: Object.fromEntries(
			Object.entries(all).filter(([name]) => canAccess(principal, name)),
		),
	};
}

type Outcome = {
	res: Response;
	/** Set for successful writes: what changed, for cache invalidation/alerts. */
	write?: {
		id?: string;
		unchanged?: boolean;
		touchedLive: boolean;
		deleted?: boolean;
		rev?: number;
		changed: string[];
	};
};

type Route = (ctx: Ctx, req: Request) => Promise<Outcome>;

const ok = (res: Response): Outcome => ({ res });

function route(method: string, segments: string[]): Route {
	const [resource, second, third] = segments;
	if (segments.length === 0) {
		if (method !== "GET") throw methodNotAllowed(["GET"]);
		return async (ctx) =>
			ok(json(200, describe(ctx.principal, await svc.getFreeze())));
	}
	if (segments.length > 3 || segments.some((s) => s.length > 100)) {
		throw new AgentError(404, "not_found", "No such endpoint.");
	}
	if (resource === "_audit" && segments.length === 1) {
		if (method !== "GET") throw methodNotAllowed(["GET"]);
		return async (ctx, req) => {
			const raw = new URL(req.url).searchParams.get("limit");
			const limit = raw == null ? 50 : Number(raw);
			if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
				throw new AgentError(400, "invalid_request", "?limit must be 1–200.");
			}
			return ok(json(200, await svc.audit(ctx, limit)));
		};
	}
	const adapter = getAdapter(resource);
	const singleton = adapter?.kind === "singleton";
	const ifMatch = (req: Request) => parseIfMatch(req.headers.get("if-match"));

	// Record-level routes: /{res}/{id} for collections, /about for the singleton.
	const recordRoute = (id: string): Route => {
		switch (method) {
			case "GET":
				return async (ctx) => {
					const r = await svc.get(ctx, resource, id);
					return ok(json(200, r, { ETag: `"${r.rev}"` }));
				};
			case "PUT":
				return async (ctx, req) =>
					written(
						await svc.replace(
							ctx,
							resource,
							id,
							await readJsonBody(req),
							ifMatch(req),
						),
					);
			case "PATCH":
				return async (ctx, req) =>
					written(
						await svc.patch(
							ctx,
							resource,
							id,
							await readJsonBody(req),
							ifMatch(req),
						),
					);
			case "DELETE":
				if (singleton) throw methodNotAllowed(["GET", "PUT", "PATCH"]);
				return async (ctx, req) =>
					written(await svc.remove(ctx, resource, id, ifMatch(req)));
			default:
				throw methodNotAllowed(
					singleton
						? ["GET", "PUT", "PATCH"]
						: ["GET", "PUT", "PATCH", "DELETE"],
				);
		}
	};
	const historyRoute = (id: string): Route => {
		if (method !== "GET") throw methodNotAllowed(["GET"]);
		return async (ctx) => ok(json(200, await svc.history(ctx, resource, id)));
	};
	const revertRoute = (id: string): Route => {
		if (method !== "POST") throw methodNotAllowed(["POST"]);
		return async (ctx, req) =>
			written(
				await svc.revert(
					ctx,
					resource,
					id,
					await readJsonBody(req),
					ifMatch(req),
				),
			);
	};

	if (singleton) {
		if (segments.length === 1) return recordRoute(resource);
		if (segments.length === 2 && second === "history")
			return historyRoute(resource);
		if (segments.length === 2 && second === "revert")
			return revertRoute(resource);
		throw new AgentError(404, "not_found", "No such endpoint.");
	}
	if (segments.length === 1) {
		if (method === "GET")
			return async (ctx) => ok(json(200, await svc.list(ctx, resource)));
		if (method === "POST") {
			return async (ctx, req) =>
				written(await svc.create(ctx, resource, await readJsonBody(req)), 201);
		}
		throw methodNotAllowed(["GET", "POST"]);
	}
	if (second === "_order" && segments.length === 2) {
		if (method !== "POST") throw methodNotAllowed(["POST"]);
		return async (ctx, req) => {
			const res = await svc.reorder(ctx, resource, await readJsonBody(req));
			return {
				res: json(200, res),
				write: res.dryRun
					? undefined
					: { touchedLive: true, changed: ["order"] },
			};
		};
	}
	if (!isValidId(second)) {
		throw new AgentError(
			400,
			"invalid_id",
			"Ids are lowercase letters, numbers, and inner dashes (max 80).",
		);
	}
	if (segments.length === 2) return recordRoute(second);
	if (third === "history") return historyRoute(second);
	if (third === "revert") return revertRoute(second);
	throw new AgentError(404, "not_found", "No such endpoint.");
}

function written(result: WriteResult, createdStatus = 200): Outcome {
	const status = result.dryRun || result.unchanged ? 200 : createdStatus;
	return {
		res: json(status, result, { ETag: `"${result.rev}"` }),
		write: result.dryRun
			? undefined
			: {
					id: result.id,
					unchanged: result.unchanged,
					touchedLive: result.touchedLive,
					deleted: result.deleted,
					rev: result.rev,
					changed: result.changed,
				},
	};
}

/** Handle one agent API request. `segments` is the path below /api/agent/v1. */
export async function handleAgentRequest(
	req: Request,
	segments: string[],
	deps: AgentDeps,
): Promise<Response> {
	const requestId = randomUUID();
	const method = req.method.toUpperCase();
	const ip = clientIp(req);
	try {
		const config = parseTokenConfig(deps.tokens(), RESOURCE_NAMES);
		if (config.state === "unconfigured") {
			throw new AgentError(
				501,
				"not_configured",
				"The agent API is not enabled on this deployment.",
			);
		}
		if (config.state === "invalid") {
			log.error(`token config rejected: ${config.error}`);
			throw new AgentError(
				503,
				"misconfigured",
				"The agent API is misconfigured; ask the site owner to check AGENT_TOKENS.",
			);
		}
		const auth = authenticate(
			req.headers.get("authorization"),
			config.tokens,
			deps.now(),
		);
		if (!auth.ok) {
			const limited = await deps.rateLimit("authfail", ip);
			if (!limited.success) {
				throw new AgentError(
					429,
					"rate_limited",
					"Too many failed attempts. Slow down.",
					{
						retryAfterSeconds: retryAfter(limited.reset, deps.now()),
					},
				);
			}
			throw new AgentError(
				401,
				"unauthorized",
				auth.reason === "expired"
					? "This token has expired."
					: "Send Authorization: Bearer <agent token>.",
			);
		}
		const principal = auth.principal;
		const handler = route(method, segments);
		const bucket: RateBucket = method === "GET" ? "read" : "write";
		const limited = await deps.rateLimit(bucket, principal.name);
		if (!limited.success) {
			const after = retryAfter(limited.reset, deps.now());
			throw new AgentError(
				429,
				"rate_limited",
				`Rate limit exceeded; retry in ${after}s.`,
				{
					retryAfterSeconds: after,
				},
			);
		}
		const url = new URL(req.url);
		const dryRun = parseFlag(url.searchParams.get("dryRun"), "dryRun");
		const ctx: Ctx = { principal, dryRun, ip, readOnly: deps.readOnly() };
		const { res, write } = await handler(ctx, req);
		if (write && !write.unchanged)
			afterWrite(segments[0], write, principal, deps);
		res.headers.set("X-Request-Id", requestId);
		return res;
	} catch (err) {
		if (err instanceof AgentError) {
			const headers: Record<string, string> = {};
			if (
				err.status === 429 &&
				typeof err.details?.retryAfterSeconds === "number"
			) {
				headers["Retry-After"] = String(err.details.retryAfterSeconds);
			}
			if (err.status === 405 && Array.isArray(err.details?.allow)) {
				headers.Allow = (err.details.allow as string[]).join(", ");
			}
			if (err.status === 401)
				headers["WWW-Authenticate"] = 'Bearer realm="agent-api"';
			return errorResponse(err, requestId, headers);
		}
		log.error(`${requestId} ${method} /${segments.join("/")} failed`, err);
		return errorResponse(
			new AgentError(500, "internal", "Something went wrong on the server."),
			requestId,
		);
	}
}

function retryAfter(reset: number | undefined, now: Date): number {
	if (!reset) return 60;
	return Math.max(1, Math.ceil((reset - now.getTime()) / 1000));
}

/** Expire the caches a successful write affects and alert on live changes. */
function afterWrite(
	resource: string,
	write: NonNullable<Outcome["write"]>,
	principal: AgentPrincipal,
	deps: AgentDeps,
) {
	const adapter = getAdapter(resource);
	if (!adapter) return;
	const id = adapter.kind === "singleton" ? undefined : write.id;
	const { tags, paths } = adapter.invalidations(id);
	deps.invalidate(tags, paths);
	const target = `${resource}${id ? `/${id}` : ""}`;
	log.info(
		`${principal.name} ${write.deleted ? "deleted" : "wrote"} ${target}${write.rev != null ? ` @${write.rev}` : ""}`,
	);
	if (write.touchedLive) {
		deps.notify(`Agent "${principal.name}" changed live content`, [
			`Resource: ${target}`,
			write.deleted ? "Action: delete" : `Changed: ${write.changed.join(", ")}`,
			`Revision: ${write.rev ?? "n/a"}`,
			"Review or revert it from /admin/agents.",
		]);
	}
}
