import "server-only";

import type { Redis } from "@upstash/redis";

// Revisioned writes for every Upstash-backed content record (talks, collection
// items, the About document). Each write runs as one Lua script, so the checks
// and the write happen atomically on the server:
//
//   • rev:<key>   monotonically increasing revision. It is never deleted, so a
//                 deleted-then-recreated record keeps counting up. A record with
//                 no rev key (written before revisions existed) is revision 0.
//   • meta:<key>  who wrote the current version and when.
//   • hist:<key>  the previous versions (with their meta and who replaced
//                 them), newest first, capped at HISTORY_CAP.
//   • content:audit  who changed what and when, newest first, capped at AUDIT_CAP.
//
// Callers state their preconditions per op (must exist / must not exist /
// expected revision). If any precondition fails nothing is written, so batches
// such as a reorder are all-or-nothing.

export const AUDIT_KEY = "content:audit";
export const HISTORY_CAP = 25;
export const AUDIT_CAP = 500;
export const MAX_OPS = 500;

export const revKey = (key: string) => `rev:${key}`;
export const historyKey = (key: string) => `hist:${key}`;
export const metaKey = (key: string) => `meta:${key}`;
// Placeholder index key for records with no index set (the About singleton).
// Passed in KEYS so the script declares every key it may touch; never written.
const NO_INDEX = "content:noindex";

export type Actor =
	| { type: "admin" }
	| { type: "agent"; name: string }
	| { type: "script"; name: string };

export type WriteOp = {
	key: string;
	op: "set" | "del";
	/** JSON-serializable record; required for "set". */
	value?: unknown;
	/** Set that lists the record's id (SADD on set, SREM on delete). */
	index?: { key: string; member: string };
	/** true: must exist. false: must not exist. undefined: either. */
	exists?: boolean;
	/** Required current revision. undefined skips the check. */
	expectedRev?: number;
	/**
	 * Refuse a delete that would leave `index` empty. An empty index makes the
	 * public site fall back to the committed seed, so emptying it is a live change.
	 */
	keepIndexNonEmpty?: boolean;
	/**
	 * Recorded in history as the previous version when nothing is stored yet
	 * (the About page serves its committed seed until first saved), so the first
	 * save can be reverted too.
	 */
	historyFallback?: unknown;
	/**
	 * Refuse a set that would add a new member to an index already holding this
	 * many (checked atomically, so concurrent creates can't overshoot).
	 */
	maxIndexSize?: number;
	/**
	 * Refuse unless the index holds exactly this many members (a reorder must
	 * cover every item; a concurrent create or delete fails it).
	 */
	indexSize?: number;
};

export type ConflictReason =
	| "conflict"
	| "exists"
	| "missing"
	| "last"
	| "full"
	| "halted";

const MESSAGES: Record<ConflictReason, (key: string, rev: number) => string> = {
	conflict: (k, r) => `${k} changed since it was read (now at revision ${r})`,
	exists: (k) => `${k} already exists`,
	missing: (k) => `${k} does not exist`,
	last: (k) => `${k} is the last record of its kind and cannot be deleted`,
	full: (k) => `no room for ${k}: its section is at the record limit`,
	halted: () => "writes are halted",
};

/** A precondition failed; nothing was written. */
export class WriteConflictError extends Error {
	constructor(
		readonly reason: ConflictReason,
		readonly key: string,
		readonly currentRev: number,
	) {
		super((MESSAGES[reason] ?? MESSAGES.conflict)(key, currentRev));
		this.name = "WriteConflictError";
	}
}

// KEYS[1] = audit list, KEYS[2] = halt flag (writes refused while it exists);
// then five keys per op: record, rev, history, index, meta.
// ARGV[1..7] = op count, audit detail JSON ("" = none), history cap, audit cap,
// timestamp JSON, actor JSON, "1" to honour the halt flag; then nine args per
// op: kind, exists, expected, value, index member, "1" to keep the index
// non-empty, history fallback JSON ("" = none), max index size ("" = none),
// exact index size ("" = none).
// Every JSON fragment is produced by JSON.stringify on the client (and stored
// values were written as JSON), so concatenation below always yields valid JSON.
const APPLY_SCRIPT = `
local n = tonumber(ARGV[1])
local auditDetail = ARGV[2]
local histCap = tonumber(ARGV[3])
local auditCap = tonumber(ARGV[4])
local at = ARGV[5]
local actor = ARGV[6]
if ARGV[7] == '1' and redis.call('EXISTS', KEYS[2]) == 1 then return {'halted', 0, 0} end
local current = {}
for i = 1, n do
  local k = 2 + (i - 1) * 5
  local a = 7 + (i - 1) * 9
  local present = redis.call('EXISTS', KEYS[k + 1]) == 1
  local cur = tonumber(redis.call('GET', KEYS[k + 2]) or '0') or 0
  local mustExist = ARGV[a + 2]
  local expected = ARGV[a + 3]
  if mustExist == '1' and not present then return {'missing', i, cur} end
  if mustExist == '0' and present then return {'exists', i, cur} end
  if expected ~= '*' and tonumber(expected) ~= cur then return {'conflict', i, cur} end
  if ARGV[a + 1] == 'del' and ARGV[a + 6] == '1' and redis.call('SCARD', KEYS[k + 4]) <= 1 then
    return {'last', i, cur}
  end
  if ARGV[a + 1] == 'set' and ARGV[a + 8] ~= '' and ARGV[a + 5] ~= ''
    and redis.call('SISMEMBER', KEYS[k + 4], ARGV[a + 5]) == 0
    and redis.call('SCARD', KEYS[k + 4]) >= tonumber(ARGV[a + 8]) then
    return {'full', i, cur}
  end
  if ARGV[a + 9] ~= '' and redis.call('SCARD', KEYS[k + 4]) ~= tonumber(ARGV[a + 9]) then
    return {'conflict', i, cur}
  end
  current[i] = cur
end
local revs = {}
for i = 1, n do
  local k = 2 + (i - 1) * 5
  local a = 7 + (i - 1) * 9
  local old = redis.call('GET', KEYS[k + 1])
  if not old and ARGV[a + 7] ~= '' then old = ARGV[a + 7] end
  if old then
    local prev = 'null'
    if string.sub(old, 1, 1) == '{' then prev = old end
    local meta = redis.call('GET', KEYS[k + 5])
    if not meta or string.sub(meta, 1, 1) ~= '{' then meta = 'null' end
    redis.call('LPUSH', KEYS[k + 3], '{"rev":' .. current[i] .. ',"meta":' .. meta .. ',"replacedAt":' .. at .. ',"replacedBy":' .. actor .. ',"value":' .. prev .. '}')
    redis.call('LTRIM', KEYS[k + 3], 0, histCap - 1)
  end
  redis.call('SET', KEYS[k + 5], '{"at":' .. at .. ',"by":' .. actor .. '}')
  local member = ARGV[a + 5]
  if ARGV[a + 1] == 'set' then
    redis.call('SET', KEYS[k + 1], ARGV[a + 4])
    if member ~= '' then redis.call('SADD', KEYS[k + 4], member) end
  else
    redis.call('DEL', KEYS[k + 1])
    if member ~= '' then redis.call('SREM', KEYS[k + 4], member) end
  end
  revs[i] = redis.call('INCR', KEYS[k + 2])
end
if auditDetail ~= '' then
  redis.call('LPUSH', KEYS[1], '{"at":' .. at .. ',"by":' .. actor .. ',"revs":[' .. table.concat(revs, ',') .. '],"detail":' .. auditDetail .. '}')
  redis.call('LTRIM', KEYS[1], 0, auditCap - 1)
end
local out = {'ok'}
for i = 1, n do out[i + 1] = revs[i] end
return out
`;

const NO_HALT = "content:nohalt";

/**
 * Apply `ops` atomically. Returns each op's new revision, in order. Throws
 * WriteConflictError (and writes nothing) when any precondition fails, or when
 * `haltKey` is given and exists at write time (checked inside the same atomic
 * step, so a freeze can't be raced).
 */
export async function applyWrites(
	redis: Redis,
	ops: WriteOp[],
	ctx: {
		actor: Actor;
		audit?: Record<string, unknown>;
		at?: string;
		haltKey?: string;
	},
): Promise<number[]> {
	if (ops.length === 0) return [];
	if (ops.length > MAX_OPS) throw new Error(`Too many writes (${ops.length})`);
	const seen = new Set<string>();
	const keys: string[] = [AUDIT_KEY, ctx.haltKey ?? NO_HALT];
	const args: string[] = [
		String(ops.length),
		ctx.audit ? JSON.stringify(ctx.audit) : "",
		String(HISTORY_CAP),
		String(AUDIT_CAP),
		JSON.stringify(ctx.at ?? new Date().toISOString()),
		JSON.stringify(ctx.actor),
		ctx.haltKey ? "1" : "0",
	];
	for (const op of ops) {
		if (seen.has(op.key)) throw new Error(`Duplicate write to ${op.key}`);
		seen.add(op.key);
		if (op.op === "set" && (op.value === undefined || op.value === null)) {
			throw new Error(`Missing value for ${op.key}`);
		}
		if (
			op.expectedRev !== undefined &&
			!(Number.isSafeInteger(op.expectedRev) && op.expectedRev >= 0)
		) {
			throw new Error(`Invalid expected revision for ${op.key}`);
		}
		if (
			op.maxIndexSize !== undefined &&
			!(Number.isSafeInteger(op.maxIndexSize) && op.maxIndexSize >= 0)
		) {
			throw new Error(`Invalid maxIndexSize for ${op.key}`);
		}
		if ((op.keepIndexNonEmpty || op.indexSize !== undefined) && !op.index) {
			throw new Error(`keepIndexNonEmpty needs an index for ${op.key}`);
		}
		keys.push(
			op.key,
			revKey(op.key),
			historyKey(op.key),
			op.index?.key ?? NO_INDEX,
			metaKey(op.key),
		);
		args.push(
			op.op,
			op.exists === undefined ? "*" : op.exists ? "1" : "0",
			op.expectedRev === undefined ? "*" : String(op.expectedRev),
			op.op === "set" ? JSON.stringify(op.value) : "",
			op.index?.member ?? "",
			op.keepIndexNonEmpty ? "1" : "0",
			op.historyFallback === undefined
				? ""
				: JSON.stringify(op.historyFallback),
			op.maxIndexSize === undefined ? "" : String(op.maxIndexSize),
			op.indexSize === undefined ? "" : String(op.indexSize),
		);
	}
	const res = await redis.eval<string[], unknown[]>(APPLY_SCRIPT, keys, args);
	if (!Array.isArray(res) || res.length === 0) {
		throw new Error("Unexpected response from the write script");
	}
	if (res[0] === "ok") return res.slice(1).map(Number);
	const failed = ops[Number(res[1]) - 1];
	throw new WriteConflictError(
		res[0] as ConflictReason,
		failed?.key ?? ctx.haltKey ?? "unknown",
		Number(res[2]) || 0,
	);
}

/** Who wrote a version, and when. Absent for records predating revisions. */
export type VersionMeta = { at: string; by: Actor } | null;

export type Versioned = { value: unknown; rev: number; meta: VersionMeta };

/** Read records with their revision and meta in one atomic MGET. */
export async function readVersioned(
	redis: Redis,
	keys: string[],
): Promise<Versioned[]> {
	if (keys.length === 0) return [];
	const raw = await redis.mget<unknown[]>(
		...keys.flatMap((k) => [k, revKey(k), metaKey(k)]),
	);
	return keys.map((_, i) => ({
		value: raw?.[i * 3] ?? null,
		rev: toRev(raw?.[i * 3 + 1]),
		meta: toMeta(raw?.[i * 3 + 2]),
	}));
}

// Index members and their records, revisions and meta in one atomic step, so a
// reader never sees a member set from before a write combined with records from
// after it. Ids come back prefixed: the client parses bare strings as JSON, and
// a valid id such as "1e5" would otherwise turn into a number.
// The rev:/meta: keys are derived inside the script rather than declared in
// KEYS. That is fine with Upstash's default (global script lock) but would need
// declaring if the script ever opts into allow-key-locking or a cluster.
const READ_INDEX_SCRIPT = `
local ids = redis.call('SMEMBERS', KEYS[1])
local out = {}
for _, id in ipairs(ids) do
  local k = ARGV[1] .. id
  out[#out + 1] = 'id:' .. id
  out[#out + 1] = redis.call('GET', k) or ''
  out[#out + 1] = redis.call('GET', 'rev:' .. k) or '0'
  out[#out + 1] = redis.call('GET', 'meta:' .. k) or ''
end
return out
`;

/**
 * Every record listed in `indexKey` (records at `${prefix}${id}`), read
 * atomically with their revisions. Members whose record is missing come back
 * with value null.
 */
export async function readIndex(
	redis: Redis,
	indexKey: string,
	prefix: string,
): Promise<(Versioned & { id: string })[]> {
	const raw = await redis.eval<string[], unknown[]>(
		READ_INDEX_SCRIPT,
		[indexKey],
		[prefix],
	);
	const out: (Versioned & { id: string })[] = [];
	for (let i = 0; i + 3 < (raw?.length ?? 0); i += 4) {
		const id = String(raw[i]).slice(3);
		const value = raw[i + 1];
		out.push({
			id,
			value: value === "" || value == null ? null : value,
			rev: toRev(raw[i + 2]),
			meta: raw[i + 3] === "" ? null : toMeta(raw[i + 3]),
		});
	}
	return out;
}

/** Current revision of one record (0 when it has never been revisioned). */
export async function readRev(redis: Redis, key: string): Promise<number> {
	return toRev(await redis.get(revKey(key)));
}

function toMeta(raw: unknown): VersionMeta {
	const m = typeof raw === "string" ? safeJson(raw) : raw;
	if (!m || typeof m !== "object") return null;
	const { at, by } = m as Record<string, unknown>;
	return typeof at === "string" && by && typeof by === "object"
		? { at, by: by as Actor }
		: null;
}

function toRev(raw: unknown): number {
	const n = Number(raw ?? 0);
	return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

export type HistoryEntry = {
	/** The revision this version had while it was current. */
	rev: number;
	/** Who wrote this version (null if it predates revisions). */
	meta: VersionMeta;
	replacedAt: string;
	replacedBy: Actor;
	/** The record as it was; null if it was not a JSON object. */
	value: unknown;
};

/** Previous versions of a record, newest first. Malformed entries are skipped. */
export async function readHistory(
	redis: Redis,
	key: string,
	limit = HISTORY_CAP,
): Promise<HistoryEntry[]> {
	const raw = await redis.lrange<unknown>(historyKey(key), 0, limit - 1);
	return (raw ?? []).flatMap((e) => {
		const entry = typeof e === "string" ? safeJson(e) : e;
		if (!entry || typeof entry !== "object") return [];
		const { rev, meta, replacedAt, replacedBy, value } = entry as Record<
			string,
			unknown
		>;
		if (typeof rev !== "number" || typeof replacedAt !== "string") return [];
		return [
			{
				rev,
				meta: toMeta(meta),
				replacedAt,
				replacedBy: replacedBy as Actor,
				value,
			},
		];
	});
}

export type AuditRecord = {
	at: string;
	by: Actor;
	revs: number[];
	detail: Record<string, unknown>;
};

/** Recent writes across all content, newest first. */
export async function readAudit(
	redis: Redis,
	limit = 100,
): Promise<AuditRecord[]> {
	const raw = await redis.lrange<unknown>(AUDIT_KEY, 0, limit - 1);
	return (raw ?? []).flatMap((e) => {
		const entry = typeof e === "string" ? safeJson(e) : e;
		if (!entry || typeof entry !== "object") return [];
		const { at, by, revs, detail } = entry as Record<string, unknown>;
		if (typeof at !== "string") return [];
		return [
			{
				at,
				by: by as Actor,
				revs: Array.isArray(revs) ? revs.map(Number) : [],
				detail: (detail as Record<string, unknown>) ?? {},
			},
		];
	});
}

function safeJson(s: string): unknown {
	try {
		return JSON.parse(s);
	} catch {
		return null;
	}
}

/** Preconditions and attribution for a store-level write. */
export type WriteOptions = {
	/** Defaults to the admin (the dashboard's server actions). */
	actor?: Actor;
	/** true: update only. false: create only. undefined: either. */
	mustExist?: boolean;
	/** Reject the write unless the record is at this revision. */
	expectedRev?: number;
	/** Extra fields recorded in the audit entry. */
	audit?: Record<string, unknown>;
	/** Refuse the write if this key exists when it runs (the agent freeze). */
	haltKey?: string;
	/** Refuse a delete that would empty the index (see WriteOp). */
	keepIndexNonEmpty?: boolean;
	/** Refuse adding a new record past this many in its index (see WriteOp). */
	maxIndexSize?: number;
};
