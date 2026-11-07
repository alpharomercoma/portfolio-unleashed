// Pushes data/talks.seed.json into Upstash Redis. That file is the only copy of
// the seed, so edit it there. Without UPSTASH_REDIS_REST_URL/TOKEN this is a no-op.
//
// Usage: node scripts/seed-talks.mjs   (or: pnpm seed-talks)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, "..", "data", "talks.seed.json");

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

async function main() {
	const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
	const token =
		process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
	if (!url || !token) {
		console.log(
			"[seed-talks] Upstash not configured; nothing to do. Set UPSTASH_REDIS_REST_URL/TOKEN to push to Redis.",
		);
		return;
	}
	const talks = JSON.parse(await readFile(seedPath, "utf8"));
	const { Redis } = await import("@upstash/redis");
	const redis = new Redis({ url, token });
	for (const talk of talks) {
		await seedRecord(
			redis,
			`talk:${talk.slug}`,
			"talks:slugs",
			talk.slug,
			talk,
			"seed-talks",
		);
	}
	console.log(`[seed-talks] seeded ${talks.length} talks into Upstash.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
