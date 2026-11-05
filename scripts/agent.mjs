#!/usr/bin/env node
// Command-line client for the agent API (/api/agent/v1). It only speaks HTTP,
// so the same guardrails apply as for any other agent: scoped tokens, drafts by
// default, If-Match revisions, dry runs, history, and revert. It never touches
// Redis directly and never needs store credentials.
//
//   PORTFOLIO_AGENT_TOKEN=pfa_… pnpm agent whoami
//   pnpm agent help
//
// The token is read from PORTFOLIO_AGENT_TOKEN (falling back to that key in
// .env.local) or --token-file, never from a command-line argument (arguments
// are visible to other processes).
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { parseArgs, parseEnv } from "node:util";

const HELP = `Usage: pnpm agent <command> [args] [options]

Reading
  whoami                         Who this token is, its scopes, and the rules
  schema <resource>              JSON Schema of what a resource accepts
  list <resource>                Every record (drafts and hidden included)
  get <resource> [id]            One record with its revision (about: no id)
  history <resource> [id]        Previous versions, newest first
  audit [--limit N]              Recent writes

Writing (all accept --dry-run)
  create <resource> --data JSON | --file PATH | --file -
  update <resource> [id] --rev N --data/--file   Replace the whole record
  patch  <resource> [id] --set k=v [--set k:=json] … | --data/--file
                                 Merge patch; null removes a field
  publish <talks|collection> <id>    status=published / hidden=false
  unpublish <talks|collection> <id>  status=draft / hidden=true
  delete <resource> <id> --yes
  revert <resource> [id] --to N  Restore a version from history
  reorder <collection> <id> <id> …   New order (every item, once)

Offline
  token mint --name NAME --scopes read,write[,publish,delete]
             [--resources talks,about,…] [--expires 2027-01-01T00:00:00Z]

Options
  --url URL          API origin (env PORTFOLIO_AGENT_URL, default https://alpharomer.com)
                     PORTFOLIO_AGENT_TOKEN/_URL are also read from .env.local
  --token-file PATH  Read the token from a file instead of PORTFOLIO_AGENT_TOKEN
  --rev N            Revision you based the change on (sent as If-Match). patch,
                     publish, delete, and revert fetch the current one if omitted;
                     update requires it.
  --dry-run          Validate and check permissions without saving
  --json             Print raw JSON responses

Resources: talks, about, research, selected-work, projects, recommendations,
gallery, awards, certifications. Exit codes: 0 ok, 1 API/network error, 2 usage error.`;

class UsageError extends Error {}

function fail(message) {
	throw new UsageError(message);
}

const { values: opts, positionals } = (() => {
	try {
		return parseArgs({
			allowPositionals: true,
			options: {
				url: { type: "string" },
				"token-file": { type: "string" },
				rev: { type: "string" },
				data: { type: "string" },
				file: { type: "string" },
				set: { type: "string", multiple: true },
				to: { type: "string" },
				limit: { type: "string" },
				"dry-run": { type: "boolean" },
				json: { type: "boolean" },
				yes: { type: "boolean" },
				help: { type: "boolean", short: "h" },
				// token mint
				name: { type: "string" },
				scopes: { type: "string" },
				resources: { type: "string" },
				expires: { type: "string" },
			},
		});
	} catch (err) {
		console.error(`${err.message}\n\nRun "pnpm agent help" for usage.`);
		process.exit(2);
	}
})();

// Only the CLI's own keys are taken from .env.local; the rest of that file
// (store credentials) is never loaded.
const localEnv = (() => {
	try {
		const all = parseEnv(readFileSync(".env.local", "utf8"));
		return {
			PORTFOLIO_AGENT_TOKEN: all.PORTFOLIO_AGENT_TOKEN,
			PORTFOLIO_AGENT_URL: all.PORTFOLIO_AGENT_URL,
		};
	} catch {
		return {};
	}
})();

function setting(key) {
	return process.env[key] || localEnv[key];
}

const SINGLETONS = new Set(["about"]);
const ID = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

function baseUrl() {
	const raw =
		opts.url || setting("PORTFOLIO_AGENT_URL") || "https://alpharomer.com";
	let u;
	try {
		u = new URL(raw);
	} catch {
		fail(`Invalid --url: ${raw}`);
	}
	const local = ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
	// Never send the bearer token over plain HTTP to anything but this machine.
	if (u.protocol !== "https:" && !(local && u.protocol === "http:")) {
		fail(
			"Refusing to send the token over a non-https URL (localhost excepted).",
		);
	}
	return `${u.origin}/api/agent/v1`;
}

async function token() {
	let t;
	if (opts["token-file"]) {
		t = (await readFile(opts["token-file"], "utf8")).trim();
	} else {
		t = setting("PORTFOLIO_AGENT_TOKEN")?.trim();
	}
	if (!t) fail("Set PORTFOLIO_AGENT_TOKEN (or pass --token-file).");
	if (!/^pfa_[A-Za-z0-9_-]{43}$/.test(t))
		fail("That does not look like an agent token (pfa_…).");
	return t;
}

/** `/resource` or `/resource/id`; validates names so paths can't be smuggled. */
function recordPath(resource, id) {
	if (!resource) fail("Missing <resource>.");
	if (!/^[a-z][a-z-]{0,40}$/.test(resource))
		fail(`Invalid resource "${resource}".`);
	if (SINGLETONS.has(resource)) {
		if (id) fail(`"${resource}" is a single document; drop the id.`);
		return `/${resource}`;
	}
	if (id === undefined) fail(`Missing <id> for ${resource}.`);
	if (!ID.test(id)) fail(`Invalid id "${id}".`);
	return `/${resource}/${id}`;
}

async function api(method, path, { body, rev, query } = {}) {
	// "/" is the API root; Next redirects a trailing slash, so drop it.
	const url = new URL(baseUrl() + (path === "/" ? "" : path));
	if (opts["dry-run"] && method !== "GET") url.searchParams.set("dryRun", "1");
	for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
	const headers = {
		authorization: `Bearer ${await token()}`,
		accept: "application/json",
		"user-agent": "portfolio-agent-cli/1",
	};
	if (body !== undefined) headers["content-type"] = "application/json";
	if (rev !== undefined) headers["if-match"] = `"${rev}"`;
	let res;
	try {
		res = await fetch(url, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
			redirect: "error", // never replay the Authorization header elsewhere
			signal: AbortSignal.timeout(30_000),
		});
	} catch (err) {
		throw new Error(`Request failed: ${err.cause?.message ?? err.message}`);
	}
	const text = await res.text();
	let data;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		throw new Error(`HTTP ${res.status}: non-JSON response`);
	}
	if (!res.ok) {
		const e = data?.error ?? {};
		const lines = [`HTTP ${res.status} ${e.code ?? ""}: ${e.message ?? text}`];
		for (const i of e.issues ?? []) {
			lines.push(
				typeof i === "string" ? `  - ${i}` : `  - ${i.path}: ${i.message}`,
			);
		}
		if (e.currentRev !== undefined)
			lines.push(`  current revision: ${e.currentRev}`);
		if (e.required) lines.push(`  needs scope: ${e.required}`);
		const err = new Error(lines.join("\n"));
		err.data = data;
		throw err;
	}
	return data;
}

function parseRev(raw) {
	if (raw === undefined) return undefined;
	if (!/^\d{1,15}$/.test(raw))
		fail(`--rev must be a revision number, got "${raw}".`);
	return Number(raw);
}

async function currentRev(path) {
	const explicit = parseRev(opts.rev);
	if (explicit !== undefined) return explicit;
	try {
		return (await api("GET", path)).rev;
	} catch (err) {
		// A deleted record still has a revision (restoring it with revert
		// needs it); the 404 reports it.
		const rev = err.data?.error?.rev;
		if (Number.isSafeInteger(rev)) return rev;
		throw err;
	}
}

async function readBody() {
	if (opts.data && opts.file) fail("Use --data or --file, not both.");
	let text;
	if (opts.data !== undefined) text = opts.data;
	else if (opts.file === "-") {
		const chunks = [];
		for await (const c of process.stdin) chunks.push(c);
		text = Buffer.concat(chunks).toString("utf8");
	} else if (opts.file) text = await readFile(opts.file, "utf8");
	else return undefined;
	try {
		return JSON.parse(text);
	} catch {
		fail("The body is not valid JSON.");
	}
}

/** --set k=v (string) and --set k:=<json> (any JSON value, e.g. null, [..]). */
function parseSets(sets = []) {
	const out = {};
	for (const s of sets) {
		const json = /^([A-Za-z][A-Za-z0-9]*):=(.*)$/s.exec(s);
		const str = /^([A-Za-z][A-Za-z0-9]*)=(.*)$/s.exec(s);
		if (json) {
			try {
				out[json[1]] = JSON.parse(json[2]);
			} catch {
				fail(`--set ${json[1]}:= needs a JSON value.`);
			}
		} else if (str) out[str[1]] = str[2];
		else fail(`--set expects key=value or key:=json, got "${s}".`);
	}
	return out;
}

function print(data) {
	if (opts.json) {
		console.log(JSON.stringify(data, null, 2));
		return;
	}
	if (data && typeof data === "object" && "dryRun" in data && "rev" in data) {
		const verb = data.unchanged
			? "No change to"
			: data.dryRun
				? data.deleted
					? "Would delete"
					: "Would save"
				: data.deleted
					? "Deleted"
					: "Saved";
		const target =
			data.resource === data.id ? data.id : `${data.resource}/${data.id}`;
		console.log(
			`${verb} ${target} (rev ${data.fromRev ?? "new"} → ${data.rev})` +
				(data.changed?.length
					? `\n  changed: ${data.changed.join(", ")}`
					: "") +
				`\n  live: ${data.live ? "yes" : "no"}`,
		);
		return;
	}
	console.log(JSON.stringify(data, null, 2));
}

function mintToken() {
	const name = opts.name;
	if (!name || !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(name)) {
		fail("--name is required: lowercase letters, digits, _ or -, max 40.");
	}
	const scopes = (opts.scopes ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const valid = ["read", "write", "publish", "delete"];
	if (!scopes.length || scopes.some((s) => !valid.includes(s))) {
		fail(`--scopes must be a comma list of ${valid.join(", ")}.`);
	}
	const entry = { name, hash: "", scopes };
	if (opts.resources) {
		entry.resources = opts.resources
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}
	if (opts.expires) {
		if (Number.isNaN(Date.parse(opts.expires)))
			fail("--expires must be an ISO date-time.");
		entry.expiresAt = new Date(opts.expires).toISOString();
	}
	const t = `pfa_${randomBytes(32).toString("base64url")}`;
	entry.hash = `sha256:${createHash("sha256").update(t).digest("hex")}`;
	console.log(
		[
			"Token (give this to the agent; it is shown once and never stored):",
			`  ${t}`,
			"",
			"Add this entry to the AGENT_TOKENS JSON array (Vercel env), then redeploy:",
			`  ${JSON.stringify(entry)}`,
		].join("\n"),
	);
}

async function main() {
	const [cmd, ...args] = positionals;
	if (!cmd || cmd === "help" || opts.help) {
		console.log(HELP);
		return;
	}
	const [resource, maybeId, ...rest] = args;
	const singleton = SINGLETONS.has(resource);
	const id = singleton ? undefined : maybeId;
	switch (cmd) {
		case "whoami":
			return print(await api("GET", "/"));
		case "schema": {
			const index = await api("GET", "/");
			if (!resource) return print(Object.keys(index.resources));
			const r = index.resources[resource];
			if (!r)
				fail(`Unknown resource "${resource}" (or not allowed for this token).`);
			return print(r);
		}
		case "list":
			recordPath(resource, singleton ? undefined : "x");
			return print(await api("GET", `/${resource}`));
		case "get":
			return print(await api("GET", recordPath(resource, id)));
		case "history":
			return print(await api("GET", `${recordPath(resource, id)}/history`));
		case "audit":
			return print(
				await api("GET", "/_audit", {
					query: opts.limit ? { limit: opts.limit } : {},
				}),
			);
		case "create": {
			recordPath(resource, singleton ? undefined : "x");
			if (singleton) fail(`"${resource}" already exists; use update or patch.`);
			const body = await readBody();
			if (body === undefined) fail("create needs --data or --file.");
			return print(await api("POST", `/${resource}`, { body }));
		}
		case "update": {
			const path = recordPath(resource, id);
			const rev = parseRev(opts.rev);
			if (rev === undefined) {
				fail(
					`update replaces the whole record, so it needs --rev (from "pnpm agent get ${resource}${id ? ` ${id}` : ""}").`,
				);
			}
			const body = await readBody();
			if (body === undefined) fail("update needs --data or --file.");
			return print(await api("PUT", path, { body, rev }));
		}
		case "patch": {
			const path = recordPath(resource, id);
			const fromFile = await readBody();
			const sets = parseSets(opts.set);
			const body = { ...(fromFile ?? {}), ...sets };
			if (!Object.keys(body).length)
				fail("patch needs --set, --data, or --file.");
			return print(
				await api("PATCH", path, { body, rev: await currentRev(path) }),
			);
		}
		case "publish":
		case "unpublish": {
			const path = recordPath(resource, id);
			if (singleton) fail(`"${resource}" is always live.`);
			const on = cmd === "publish";
			const body =
				resource === "talks"
					? { status: on ? "published" : "draft" }
					: { hidden: !on };
			return print(
				await api("PATCH", path, { body, rev: await currentRev(path) }),
			);
		}
		case "delete": {
			const path = recordPath(resource, id);
			if (!opts.yes && !opts["dry-run"])
				fail(
					"delete needs --yes (or --dry-run). It can be undone with revert.",
				);
			return print(await api("DELETE", path, { rev: await currentRev(path) }));
		}
		case "revert": {
			const path = recordPath(resource, id);
			const to = parseRev(opts.to);
			if (to === undefined) fail("revert needs --to <rev> (see history).");
			return print(
				await api("POST", `${path}/revert`, {
					body: { rev: to },
					rev: await currentRev(path),
				}),
			);
		}
		case "reorder": {
			recordPath(resource, "x");
			const ids = [maybeId, ...rest].filter(Boolean);
			if (!ids.length) fail("reorder needs the item ids in their new order.");
			for (const i of ids) if (!ID.test(i)) fail(`Invalid id "${i}".`);
			// Send the revision each item was listed at, so a concurrent edit or
			// reorder makes this one fail instead of being silently overwritten.
			const listed = await api("GET", `/${resource}`);
			const revs = Object.fromEntries(listed.items.map((i) => [i.id, i.rev]));
			const unknown = ids.filter((i) => !(i in revs));
			if (unknown.length)
				fail(`Unknown ${resource} id(s): ${unknown.join(", ")}.`);
			const body = {
				ids,
				revs: Object.fromEntries(ids.map((i) => [i, revs[i]])),
			};
			return print(await api("POST", `/${resource}/_order`, { body }));
		}
		case "token":
			if (resource !== "mint") fail('Did you mean "token mint"?');
			return mintToken();
		default:
			fail(`Unknown command "${cmd}".`);
	}
}

main().catch((err) => {
	if (err instanceof UsageError) {
		console.error(`${err.message}\n\nRun "pnpm agent help" for usage.`);
		process.exit(2);
	}
	console.error(err.message);
	if (opts.json && err.data) console.error(JSON.stringify(err.data, null, 2));
	process.exit(1);
});
