// Seeds the flat "collection" content types (certifications, awards,
// recommendations) into Upstash Redis from their committed seed JSON, using the
// same key scheme as src/lib/collections/store.ts:
//   col:<key>:item:<id>  +  col:<key>:ids (set)
//
// The JSON files are the source of truth + the no-credentials fallback; this
// just pushes them to Redis when UPSTASH_REDIS_REST_URL/TOKEN are set.
//
// Usage: node scripts/seed-collections.mjs   (or: pnpm seed-collections)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const COLLECTIONS = [
	"research",
	"selected-work",
	"projects",
	"awards",
	"certifications",
	"recommendations",
	"gallery",
];

// Optional CLI filter: `node scripts/seed-collections.mjs recommendations awards`
// seeds only those keys. With no args, all collections are seeded. Useful to
// push one collection without overwriting others' admin edits (e.g. reordering).
const requested = process.argv.slice(2);
const unknown = requested.filter((k) => !COLLECTIONS.includes(k));
if (unknown.length) {
	console.error(
		`[seed-collections] unknown collection(s): ${unknown.join(", ")}`,
	);
	process.exit(1);
}
const SELECTED = requested.length ? requested : COLLECTIONS;

// One atomic step per record, mirroring src/lib/content/revisions.ts: keep the
// previous version in history, write the record, index it, bump its revision
// and stamp who wrote it. Separate commands would let an agent write that read
// the old revision land in between and overwrite the reseeded record.
const SEED_SCRIPT = `
local old = redis.call('GET', KEYS[1])
local cur = tonumber(redis.call('GET', KEYS[3]) or '0') or 0
if old and string.sub(old, 1, 1) == '{' then
  local meta = redis.call('GET', KEYS[4])
  if not meta or string.sub(meta, 1, 1) ~= '{' then meta = 'null' end
  redis.call('LPUSH', KEYS[5], '{"rev":' .. cur .. ',"meta":' .. meta .. ',"replacedAt":' .. ARGV[3] .. ',"replacedBy":' .. ARGV[4] .. ',"value":' .. old .. '}')
  redis.call('LTRIM', KEYS[5], 0, 24)
end
redis.call('SET', KEYS[1], ARGV[1])
redis.call('SADD', KEYS[2], ARGV[2])
redis.call('SET', KEYS[4], '{"at":' .. ARGV[3] .. ',"by":' .. ARGV[4] .. '}')
return redis.call('INCR', KEYS[3])
`;

async function seedRecord(redis, key, indexKey, id, value, scriptName) {
	await redis.eval(
		SEED_SCRIPT,
		[key, indexKey, `rev:${key}`, `meta:${key}`, `hist:${key}`],
		[
			JSON.stringify(value),
			id,
			JSON.stringify(new Date().toISOString()),
			JSON.stringify({ type: "script", name: scriptName }),
		],
	);
}

async function readSeed(key) {
	const file = path.join(root, "data", `${key}.seed.json`);
	return JSON.parse(await readFile(file, "utf8"));
}

async function main() {
	const data = Object.fromEntries(
		await Promise.all(SELECTED.map(async (k) => [k, await readSeed(k)])),
	);
	for (const key of SELECTED) {
		console.log(`[seed-collections] ${key}: ${data[key].length} items`);
	}

	const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
	const token =
		process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
	if (!url || !token) {
		console.log(
			"[seed-collections] Upstash not configured; nothing pushed. Set UPSTASH_REDIS_REST_URL/TOKEN.",
		);
		return;
	}

	const { Redis } = await import("@upstash/redis");
	const redis = new Redis({ url, token });
	for (const key of SELECTED) {
		const items = data[key];
		for (const item of items) {
			await seedRecord(
				redis,
				`col:${key}:item:${item.id}`,
				`col:${key}:ids`,
				item.id,
				item,
				"seed-collections",
			);
		}
		console.log(
			`[seed-collections] seeded ${items.length} ${key} into Upstash.`,
		);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
