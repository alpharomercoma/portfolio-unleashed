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
	"selected-work",
	"projects",
	"awards",
	"certifications",
	"recommendations",
];

async function readSeed(key) {
	const file = path.join(root, "data", `${key}.seed.json`);
	return JSON.parse(await readFile(file, "utf8"));
}

async function main() {
	const data = Object.fromEntries(
		await Promise.all(COLLECTIONS.map(async (k) => [k, await readSeed(k)])),
	);
	for (const key of COLLECTIONS) {
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
	for (const key of COLLECTIONS) {
		const items = data[key];
		for (const item of items) {
			await redis.set(`col:${key}:item:${item.id}`, item);
			await redis.sadd(`col:${key}:ids`, item.id);
		}
		console.log(`[seed-collections] seeded ${items.length} ${key} into Upstash.`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
