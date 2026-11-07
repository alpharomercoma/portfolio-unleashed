import "server-only";

import {
	type Actor,
	WriteConflictError,
	applyWrites,
	readAudit,
	readHistory,
} from "@/lib/content/revisions";
import { createRedis } from "@/lib/redis";

import {
	type Adapter,
	BuildError,
	type Rec,
	type Row,
	getAdapter,
} from "./resources";
import { type AgentPrincipal, type AgentScope, canAccess } from "./tokens";

// The agent API's operations, independent of HTTP. Guardrails enforced here:
//
//   • scopes: `read` to look; `write` to change records that are not live
//     (draft talks, hidden items) and stay not live; `publish` whenever a change
//     touches the live site (before or after), which includes About and
//     reordering; `delete` to delete (plus `publish` if the record is live).
//   • per-token resource allowlists.
//   • optimistic concurrency: every change to an existing record must name the
//     revision it was based on (If-Match), checked atomically in Redis.
//   • a kill switch (freeze) that blocks all agent writes at once.
//   • writes are refused until the store is seeded, so a first agent write can't
//     replace the committed seed content with a single record.
//   • every write keeps the previous version (revertable) and is audited.

const redis = createRedis();
export const FREEZE_KEY = "agent:frozen";

export class AgentError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		message: string,
		readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "AgentError";
	}
}

export type Ctx = {
	principal: AgentPrincipal;
	/** Recorded as the author of writes; defaults to the agent itself. */
	actor?: Actor;
	dryRun: boolean;
	ip?: string;
	/** Writes refused regardless of the freeze flag (AGENT_API_READ_ONLY). */
	readOnly?: boolean;
};

export type WriteResult = {
	resource: string;
	id: string;
	rev: number;
	/** Previous revision (null on create). */
	fromRev: number | null;
	live: boolean;
	/** True when the change affected what the public site shows. */
	touchedLive: boolean;
	changed: string[];
	unchanged?: boolean;
	dryRun: boolean;
	deleted?: boolean;
	data: Rec | null;
};

const actorOf = (ctx: Ctx): Actor =>
	ctx.actor ?? { type: "agent", name: ctx.principal.name };

/** Agent writes re-check the freeze inside the atomic write; the owner's don't. */
const haltKeyFor = (ctx: Ctx) =>
	ctx.actor?.type === "admin" ? undefined : FREEZE_KEY;

/** Records per resource an agent may grow a section to. */
export const MAX_RECORDS = 500;

/** Agent-input problems with a full stored record (server fields excluded). */
/**
 * A full stored record run through the agent input schema (server-managed
 * fields set aside and put back). Returns the normalized record to write, so
 * what is restored is exactly what was validated.
 */
function asAgentInput(
	adapter: Adapter,
	record: Rec,
):
	| { ok: true; record: Rec }
	| { ok: false; issues: { path: string; message: string }[] } {
	const { createdAt, updatedAt, order, ...settable } = record;
	const res = adapter.input.safeParse(settable);
	if (!res.success) return { ok: false, issues: zodIssues(res.error) };
	const server = Object.fromEntries(
		Object.entries({ createdAt, updatedAt, order }).filter(
			([, v]) => v !== undefined,
		),
	);
	return { ok: true, record: { ...(res.data as Rec), ...server } };
}

function requireScope(ctx: Ctx, scope: AgentScope, why: string) {
	if (!ctx.principal.scopes.has(scope)) {
		throw new AgentError(
			403,
			"forbidden",
			`This token lacks the "${scope}" scope: ${why}.`,
			{
				required: scope,
			},
		);
	}
}

export function resolve(ctx: Ctx, name: string): Adapter {
	const adapter = getAdapter(name);
	// Unknown and not-allowed resources look the same, so a scoped token cannot
	// map out what else exists.
	if (!adapter || !canAccess(ctx.principal, name)) {
		throw new AgentError(404, "not_found", `Unknown resource "${name}".`);
	}
	return adapter;
}

function requireStore(): NonNullable<typeof redis> {
	if (!redis) {
		throw new AgentError(
			503,
			"store_unavailable",
			"The content store (Upstash Redis) is not configured on this deployment.",
		);
	}
	return redis;
}

export type FreezeState = { at: string; by: Actor; reason: string } | null;

export async function getFreeze(): Promise<FreezeState> {
	if (!redis) return null;
	const raw = await redis.get<FreezeState>(FREEZE_KEY);
	return raw && typeof raw === "object" ? raw : null;
}

/** Freeze or unfreeze all agent writes (admin only; audited). */
export async function setFreeze(
	frozen: boolean,
	actor: Actor,
	reason = "",
): Promise<void> {
	const db = requireStore();
	const ops = frozen
		? [
				{
					key: FREEZE_KEY,
					op: "set" as const,
					value: {
						at: new Date().toISOString(),
						by: actor,
						reason: reason.slice(0, 200),
					},
				},
			]
		: (await db.exists(FREEZE_KEY))
			? [{ key: FREEZE_KEY, op: "del" as const }]
			: [];
	await applyWrites(db, ops, {
		actor,
		audit: { action: frozen ? "freeze" : "unfreeze", resource: "agent-api" },
	});
}

async function assertWritable(ctx: Ctx, adapter: Adapter) {
	if (ctx.readOnly) {
		throw new AgentError(
			423,
			"read_only",
			"Agent writes are disabled on this deployment.",
		);
	}
	if (!adapter.configured) requireStore();
	// The freeze stops agents; the owner can still repair things while frozen.
	const freeze = ctx.actor?.type === "admin" ? null : await getFreeze();
	if (freeze) {
		throw new AgentError(
			423,
			"frozen",
			"Agent writes are frozen by the site owner. Try again later.",
			{ since: freeze.at, reason: freeze.reason },
		);
	}
	if (!(await adapter.seeded())) {
		throw new AgentError(
			409,
			"store_not_seeded",
			`The ${adapter.name} store has not been seeded yet; the site is serving the committed seed. Run the seed script first.`,
		);
	}
}

function requireRev(
	ifMatch: number | undefined,
	adapter: Adapter,
	id: string,
): number {
	if (ifMatch === undefined) {
		throw new AgentError(
			428,
			"precondition_required",
			`Send If-Match with the revision you read (GET ${adapter.name}${adapter.idField ? `/${id}` : ""} returns it as "rev" and in the ETag).`,
		);
	}
	return ifMatch;
}

function checkRev(row: Row, expected: number) {
	if (row.rev !== expected) {
		throw new AgentError(
			412,
			"conflict",
			`Revision mismatch: you sent ${expected}, the record is at ${row.rev}. Re-read it, reapply your change, and retry.`,
			{ currentRev: row.rev },
		);
	}
}

function validationError(
	issues: { path: string; message: string }[],
): AgentError {
	return new AgentError(
		422,
		"validation_failed",
		"The request body failed validation.",
		{
			issues,
		},
	);
}

function zodIssues(err: {
	issues: { path: PropertyKey[]; message: string }[];
}) {
	return err.issues.map((i) => ({
		path: i.path.map(String).join(".") || "(root)",
		message: i.message,
	}));
}

function asObject(body: unknown): Rec {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw new AgentError(
			400,
			"invalid_request",
			"The request body must be a JSON object.",
		);
	}
	return body as Rec;
}

const SERVER_FIELDS = new Set(["updatedAt", "createdAt"]);

function changedFields(before: Rec | null, after: Rec | null): string[] {
	const keys = new Set([
		...Object.keys(before ?? {}),
		...Object.keys(after ?? {}),
	]);
	return [...keys]
		.filter((k) => !SERVER_FIELDS.has(k))
		.filter((k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]))
		.sort();
}

export function present(adapter: Adapter, row: Row) {
	return {
		id: row.id,
		rev: row.rev,
		live: row.record ? adapter.isLive(row.record) : false,
		updatedAt: row.meta?.at ?? null,
		updatedBy: row.meta?.by ?? null,
		...(row.issues ? { invalid: true, issues: row.issues } : {}),
		data: row.record,
	};
}

// ── reads ───────────────────────────────────────────────────────────────────

export async function list(ctx: Ctx, name: string) {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "read", "reading content");
	if (!adapter.configured || !(await adapter.seeded())) {
		return {
			resource: name,
			source: "seed" as const,
			items: adapter.seedRows().map((r) => present(adapter, r)),
		};
	}
	const rows = await adapter.list();
	rows.sort((a, b) => a.id.localeCompare(b.id));
	return {
		resource: name,
		source: "store" as const,
		items: rows.map((r) => present(adapter, r)),
	};
}

export async function get(ctx: Ctx, name: string, id: string) {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "read", "reading content");
	const row = await readRow(adapter, id);
	if (!row.record && !row.issues) {
		throw new AgentError(404, "not_found", `${name}/${id} does not exist.`, {
			rev: row.rev,
		});
	}
	return { resource: name, ...present(adapter, row) };
}

async function readRow(adapter: Adapter, id: string): Promise<Row> {
	if (!adapter.configured || !(await adapter.seeded())) {
		const seed = adapter.seedRows().find((r) => r.id === id);
		return seed ?? { id, record: null, rev: 0, meta: null };
	}
	return adapter.read(id);
}

export async function history(ctx: Ctx, name: string, id: string) {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "read", "reading history");
	const db = requireStore();
	const entries = await readHistory(db, adapter.recordKey(id));
	return {
		resource: name,
		id,
		versions: entries.map((e) => ({
			rev: e.rev,
			writtenAt: e.meta?.at ?? null,
			writtenBy: e.meta?.by ?? null,
			replacedAt: e.replacedAt,
			replacedBy: e.replacedBy,
			data: e.value,
		})),
	};
}

export async function audit(ctx: Ctx, limit: number) {
	requireScope(ctx, "read", "reading the audit log");
	const db = requireStore();
	const entries = await readAudit(db, Math.min(Math.max(limit, 1), 200));
	return {
		entries: entries
			.filter((e) => {
				const r = e.detail.resource;
				return (
					typeof r === "string" && getAdapter(r) && canAccess(ctx.principal, r)
				);
			})
			.map((e) => {
				// Client IPs stay in the admin view only.
				const { ip: _ip, ...detail } = e.detail;
				void _ip;
				return { at: e.at, by: e.by, revs: e.revs, ...detail };
			}),
	};
}

// ── writes ──────────────────────────────────────────────────────────────────

async function commit(
	ctx: Ctx,
	adapter: Adapter,
	action: string,
	id: string,
	current: Row,
	next: Rec,
	opts: { mustExist?: boolean; expectedRev?: number },
): Promise<WriteResult> {
	const touchedLive =
		(current.record ? adapter.isLive(current.record) : false) ||
		adapter.isLive(next);
	if (touchedLive) {
		requireScope(
			ctx,
			"publish",
			current.record && adapter.isLive(current.record)
				? `${adapter.name}/${id} is live on the site`
				: `this change would make ${adapter.name}/${id} live (${adapter.liveRule})`,
		);
	}
	// Validate the complete record exactly as the store will.
	const parsed = adapter.parse(next);
	if (!parsed.ok) {
		throw validationError(
			parsed.issues.map((m) => ({ path: "(record)", message: m })),
		);
	}
	// Cross-field rules on the final record, whatever produced it (create, PUT,
	// merge patch with removals, or revert). The owner's dashboard is exempt. A
	// revert restores a version the store already held, so it is its own "before".
	const before = action.startsWith("revert:") ? parsed.record : current.record;
	const cross =
		ctx.actor?.type === "admin"
			? []
			: (adapter.crossIssues?.(parsed.record, before) ?? []);
	if (cross.length) throw validationError(cross);
	const changed = changedFields(current.record, parsed.record);
	const base = {
		resource: adapter.name,
		id,
		fromRev: current.record ? current.rev : null,
		live: adapter.isLive(parsed.record),
		touchedLive,
		changed,
		dryRun: ctx.dryRun,
	};
	if (current.record && changed.length === 0) {
		return {
			...base,
			rev: current.rev,
			unchanged: true,
			touchedLive: false,
			data: current.record,
		};
	}
	if (ctx.dryRun) {
		// Mirror the atomic record-cap check for records that would be new
		// (restores of deleted records), so the dry run answers like the write.
		const isNew = !current.record && !current.issues;
		if (isNew && adapter.kind !== "singleton" && ctx.actor?.type !== "admin") {
			if ((await adapter.list()).length >= MAX_RECORDS) {
				throw mapWriteError(
					new WriteConflictError("full", adapter.recordKey(id), current.rev),
					adapter,
					id,
				);
			}
		}
		return { ...base, rev: current.rev, data: parsed.record };
	}
	try {
		const saved = await adapter.write(parsed.record, {
			actor: actorOf(ctx),
			haltKey: haltKeyFor(ctx),
			// Enforced inside the atomic write for any record that would be new
			// (creates and restores), so concurrent creates can't overshoot.
			maxIndexSize: ctx.actor?.type === "admin" ? undefined : MAX_RECORDS,
			mustExist: opts.mustExist,
			expectedRev: opts.expectedRev,
			audit: {
				action,
				changed,
				via: "agent-api",
				...(ctx.ip ? { ip: ctx.ip } : {}),
			},
		});
		return { ...base, rev: saved.rev, data: saved.record };
	} catch (err) {
		throw mapWriteError(err, adapter, id);
	}
}

function mapWriteError(err: unknown, adapter: Adapter, id: string): unknown {
	if (err instanceof WriteConflictError) {
		if (err.reason === "exists") {
			return new AgentError(
				409,
				"already_exists",
				`${adapter.name}/${id} already exists. Use PUT or PATCH to change it.`,
				{
					currentRev: err.currentRev,
				},
			);
		}
		if (err.reason === "missing") {
			return new AgentError(
				404,
				"not_found",
				`${adapter.name}/${id} no longer exists.`,
				{
					currentRev: err.currentRev,
				},
			);
		}
		if (err.reason === "last") {
			return new AgentError(
				409,
				"last_record",
				`${adapter.name}/${id} is the last ${adapter.name} record. Deleting it would make the site fall back to the committed seed; hide or unpublish it instead.`,
			);
		}
		if (err.reason === "full") {
			return new AgentError(
				409,
				"too_many_records",
				`${adapter.name} is at its limit of ${MAX_RECORDS} records; delete or reuse some first.`,
			);
		}
		if (err.reason === "halted") {
			return new AgentError(
				423,
				"frozen",
				"Agent writes were frozen by the site owner while this request was in flight. Nothing was saved.",
			);
		}
		return new AgentError(
			412,
			"conflict",
			`${adapter.name}/${id} changed concurrently (now at revision ${err.currentRev}). Re-read and retry.`,
			{
				currentRev: err.currentRev,
			},
		);
	}
	return err;
}

function parseInput(adapter: Adapter, body: Rec, partial: boolean): Rec {
	const schema = partial ? adapter.input.partial() : adapter.input;
	const res = schema.safeParse(body);
	if (!res.success) throw validationError(zodIssues(res.error));
	return res.data as Rec;
}

function assertSameId(adapter: Adapter, body: Rec, id: string) {
	const field = adapter.idField;
	if (field && field in body && body[field] !== id) {
		throw new AgentError(
			400,
			"invalid_request",
			`"${field}" in the body (${JSON.stringify(body[field])}) does not match the URL (${id}). Renaming is not supported: create the new record, then delete the old one.`,
		);
	}
}

export async function create(
	ctx: Ctx,
	name: string,
	body: unknown,
): Promise<WriteResult> {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "write", "creating content");
	if (adapter.kind === "singleton") {
		throw new AgentError(
			405,
			"method_not_allowed",
			`${name} is a single document; use PUT or PATCH.`,
		);
	}
	const input = parseInput(adapter, asObject(body), false);
	await assertWritable(ctx, adapter);
	const siblings = await adapter.list();
	if (siblings.length >= MAX_RECORDS) {
		throw new AgentError(
			409,
			"too_many_records",
			`${name} already has ${siblings.length} records (limit ${MAX_RECORDS}); delete or reuse some first.`,
		);
	}
	const next = build(adapter, "create", input, { current: null, siblings });
	const id = String(next[adapter.idField!]);
	const existing = siblings.find((r) => r.id === id);
	if (existing) {
		throw new AgentError(
			409,
			"already_exists",
			`${name}/${id} already exists. Use PUT or PATCH to change it, or pass a different ${adapter.idField}.`,
			{
				currentRev: existing.rev,
			},
		);
	}
	const current = await adapter.read(id); // may hold a deleted record's revision
	return commit(ctx, adapter, "create", id, current, next, {
		mustExist: false,
		expectedRev: current.rev,
	});
}

function build(
	adapter: Adapter,
	mode: "create" | "replace" | "patch",
	input: Rec,
	c: { id?: string; current: Rec | null; siblings: Row[] },
): Rec {
	try {
		return adapter.build(mode, input, c);
	} catch (err) {
		if (err instanceof BuildError) throw validationError(err.issues);
		throw err;
	}
}

export async function replace(
	ctx: Ctx,
	name: string,
	id: string,
	body: unknown,
	ifMatch: number | undefined,
): Promise<WriteResult> {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "write", "changing content");
	const obj = asObject(body);
	assertSameId(adapter, obj, id);
	const input = parseInput(adapter, obj, false);
	const expected = requireRev(ifMatch, adapter, id);
	await assertWritable(ctx, adapter);
	const current = await adapter.read(id);
	const exists = current.record != null || current.issues != null;
	if (!exists && adapter.kind !== "singleton") {
		throw new AgentError(
			404,
			"not_found",
			`${name}/${id} does not exist. Use POST to create it.`,
			{
				currentRev: current.rev,
			},
		);
	}
	checkRev(current, expected);
	const next = build(adapter, "replace", input, {
		id,
		current: current.record,
		siblings: [],
	});
	return commit(ctx, adapter, "replace", id, current, next, {
		mustExist: adapter.kind === "singleton" ? undefined : true,
		expectedRev: expected,
	});
}

export async function patch(
	ctx: Ctx,
	name: string,
	id: string,
	body: unknown,
	ifMatch: number | undefined,
): Promise<WriteResult> {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "write", "changing content");
	const obj = asObject(body);
	assertSameId(adapter, obj, id);
	// JSON merge patch: null removes a field (it falls back to its default),
	// except fields that are required or decide whether the record is live.
	const shape = adapter.input.shape as Record<string, unknown>;
	const removals: string[] = [];
	// Null prototype: assigning an own "__proto__" key from the JSON body must
	// not change the object's prototype (zod would then read inherited fields).
	const values: Rec = Object.create(null);
	for (const [k, v] of Object.entries(obj)) {
		if (!Object.hasOwn(shape, k)) {
			throw validationError([{ path: k, message: "unknown field" }]);
		}
		if (v === null) {
			if (k === adapter.lifecycle?.field || k === adapter.idField) {
				throw validationError([
					{ path: k, message: "cannot be removed; set it explicitly" },
				]);
			}
			removals.push(k);
		} else {
			values[k] = v;
		}
	}
	if (removals.length === 0 && Object.keys(values).length === 0) {
		throw new AgentError(400, "invalid_request", "The patch is empty.");
	}
	const input = parseInput(adapter, { ...values }, true);
	const expected = requireRev(ifMatch, adapter, id);
	await assertWritable(ctx, adapter);
	const current = await adapter.read(id);
	if (!current.record) {
		if (current.issues) {
			throw new AgentError(
				409,
				"invalid_stored_record",
				`${name}/${id} is stored in a shape that fails validation; replace it with PUT.`,
				{
					issues: current.issues,
				},
			);
		}
		throw new AgentError(404, "not_found", `${name}/${id} does not exist.`, {
			currentRev: current.rev,
		});
	}
	checkRev(current, expected);
	const merged = build(adapter, "patch", input, {
		id,
		current: current.record,
		siblings: [],
	});
	for (const k of removals) delete merged[k];
	return commit(ctx, adapter, "patch", id, current, merged, {
		mustExist: adapter.kind === "singleton" ? undefined : true,
		expectedRev: expected,
	});
}

export async function remove(
	ctx: Ctx,
	name: string,
	id: string,
	ifMatch: number | undefined,
): Promise<WriteResult> {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "delete", "deleting content");
	if (!adapter.remove) {
		throw new AgentError(
			405,
			"method_not_allowed",
			`${name} cannot be deleted.`,
		);
	}
	const expected = requireRev(ifMatch, adapter, id);
	await assertWritable(ctx, adapter);
	const current = await adapter.read(id);
	if (!current.record && !current.issues) {
		throw new AgentError(404, "not_found", `${name}/${id} does not exist.`, {
			currentRev: current.rev,
		});
	}
	checkRev(current, expected);
	const wasLive = current.record ? adapter.isLive(current.record) : false;
	if (wasLive) {
		requireScope(
			ctx,
			"publish",
			`${name}/${id} is live on the site (hide or unpublish it first, or use a token with publish)`,
		);
	}
	const base: WriteResult = {
		resource: name,
		id,
		rev: current.rev,
		fromRev: current.rev,
		live: false,
		touchedLive: wasLive,
		changed: [],
		dryRun: ctx.dryRun,
		deleted: true,
		data: null,
	};
	if (ctx.dryRun) {
		// Mirror the checks the atomic write would make, so a dry run doesn't
		// approve what the real request would refuse.
		if (adapter.kind !== "singleton" && (await adapter.list()).length <= 1) {
			throw mapWriteError(
				new WriteConflictError("last", adapter.recordKey(id), current.rev),
				adapter,
				id,
			);
		}
		return base;
	}
	try {
		const rev = await adapter.remove(id, {
			actor: actorOf(ctx),
			haltKey: haltKeyFor(ctx),
			// Emptying a section makes the site fall back to the committed seed,
			// which would put different content live.
			keepIndexNonEmpty: true,
			expectedRev: expected,
			audit: { via: "agent-api", ...(ctx.ip ? { ip: ctx.ip } : {}) },
		});
		return { ...base, rev };
	} catch (err) {
		throw mapWriteError(err, adapter, id);
	}
}

export async function revert(
	ctx: Ctx,
	name: string,
	id: string,
	body: unknown,
	ifMatch: number | undefined,
): Promise<WriteResult> {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "write", "reverting content");
	const obj = asObject(body);
	const keys = Object.keys(obj);
	const target = obj.rev;
	if (
		keys.length !== 1 ||
		!Number.isSafeInteger(target) ||
		(target as number) < 0
	) {
		throw new AgentError(
			400,
			"invalid_request",
			'Send {"rev": <revision from GET …/history>}.',
		);
	}
	const expected = requireRev(ifMatch, adapter, id);
	await assertWritable(ctx, adapter);
	const db = requireStore();
	const entry = (await readHistory(db, adapter.recordKey(id))).find(
		(e) => e.rev === target,
	);
	if (!entry || entry.value == null) {
		throw new AgentError(
			404,
			"not_found",
			`No stored version ${target} of ${name}/${id} (only the last versions are kept).`,
		);
	}
	const parsed = adapter.parse(entry.value);
	if (!parsed.ok) {
		throw new AgentError(
			409,
			"invalid_stored_record",
			`Version ${target} no longer passes validation and can't be restored as-is.`,
			{
				issues: parsed.issues,
			},
		);
	}
	if (adapter.idField && parsed.record[adapter.idField] !== id) {
		throw new AgentError(
			409,
			"invalid_stored_record",
			`Version ${target} belongs to a different record.`,
		);
	}
	// Agents may only restore versions that would pass today's agent guardrails
	// (an old admin-written value might not); the owner can restore anything.
	let restored = parsed.record;
	if (ctx.actor?.type !== "admin") {
		const checked = asAgentInput(adapter, parsed.record);
		if (!checked.ok) {
			throw new AgentError(
				409,
				"guardrail_failed",
				`Version ${target} doesn't pass the agent guardrails, so only the owner can restore it (from /admin/agents).`,
				{ issues: checked.issues },
			);
		}
		restored = checked.record;
	}
	const current = await adapter.read(id);
	checkRev(current, expected);
	const exists = current.record != null || current.issues != null;
	return commit(ctx, adapter, `revert:${target}`, id, current, restored, {
		mustExist: adapter.kind === "singleton" ? undefined : exists,
		expectedRev: expected,
	});
}

export async function reorder(ctx: Ctx, name: string, body: unknown) {
	const adapter = resolve(ctx, name);
	requireScope(ctx, "publish", "reordering changes the live site");
	if (!adapter.reorder) {
		throw new AgentError(
			405,
			"method_not_allowed",
			`${name} is sorted automatically and cannot be reordered.`,
		);
	}
	const obj = asObject(body);
	const { ids, revs } = obj;
	if (
		Object.keys(obj).length !== 2 ||
		!Array.isArray(ids) ||
		ids.length > MAX_RECORDS ||
		!ids.every((i): i is string => typeof i === "string") ||
		!revs ||
		typeof revs !== "object" ||
		Array.isArray(revs)
	) {
		throw new AgentError(
			400,
			"invalid_request",
			'Send {"ids": ["first-id", …], "revs": {"first-id": <rev>, …}}: every item once, with the revision you listed it at.',
		);
	}
	const expectedRevs: Record<string, number> = Object.create(null);
	for (const id of ids) {
		const r = Object.hasOwn(revs, id) ? (revs as Rec)[id] : undefined;
		if (!Number.isSafeInteger(r) || (r as number) < 0) {
			throw validationError([
				{ path: `revs.${id}`, message: "missing or not a revision number" },
			]);
		}
		expectedRevs[id] = r as number;
	}
	if (Object.keys(revs).length !== ids.length) {
		throw validationError([
			{ path: "revs", message: "must have exactly one entry per id" },
		]);
	}
	await assertWritable(ctx, adapter);
	const current = new Set((await adapter.list()).map((r) => r.id));
	const given = new Set(ids);
	const dup =
		given.size !== ids.length
			? ids.find((id, i) => ids.indexOf(id) !== i)
			: undefined;
	const missing = [...current].filter((id) => !given.has(id));
	const unknown = ids.filter((id) => !current.has(id));
	if (dup || missing.length || unknown.length) {
		throw validationError([
			{
				path: "ids",
				message:
					[
						dup && `duplicate "${dup}"`,
						missing.length &&
							`missing ${missing.map((m) => `"${m}"`).join(", ")}`,
						unknown.length &&
							`unknown ${unknown.map((m) => `"${m}"`).join(", ")}`,
					]
						.filter(Boolean)
						.join("; ") + " (list every item exactly once)",
			},
		]);
	}
	if (ctx.dryRun) {
		const stale = (await adapter.list()).find(
			(r) => r.rev !== expectedRevs[r.id],
		);
		if (stale) {
			throw new AgentError(
				412,
				"conflict",
				`${name}/${stale.id} is at revision ${stale.rev}, not ${expectedRevs[stale.id]}. List again and retry.`,
				{ currentRev: stale.rev, id: stale.id },
			);
		}
	} else {
		try {
			await adapter.reorder(ids, {
				actor: actorOf(ctx),
				haltKey: haltKeyFor(ctx),
				expectedRevs,
			});
		} catch (err) {
			// Name the item that conflicted, not the reorder itself.
			const prefix = adapter.recordKey("");
			const itemId =
				err instanceof WriteConflictError && err.key.startsWith(prefix)
					? err.key.slice(prefix.length)
					: "order";
			throw mapWriteError(err, adapter, itemId);
		}
	}
	return { resource: name, ids, dryRun: ctx.dryRun, touchedLive: true };
}

// ── admin ───────────────────────────────────────────────────────────────────

const ADMIN_CTX: Ctx = {
	principal: {
		name: "admin",
		scopes: new Set(["read", "write", "publish", "delete"]),
		resources: null,
	},
	actor: { type: "admin" },
	dryRun: false,
};

/**
 * Restore `name/id` to version `toRev` on behalf of the signed-in admin (the
 * "Revert" button in /admin/agents). Same validation and atomic write as an
 * agent revert, against whatever revision is current. Unlike agent writes it
 * still works while agent writes are frozen.
 */
export async function adminRevert(
	name: string,
	id: string,
	toRev: number,
	/** The revision the dashboard showed; the revert fails if it has moved on. */
	expectedRev: number,
): Promise<WriteResult> {
	return revert(ADMIN_CTX, name, id, { rev: toRev }, expectedRev);
}
