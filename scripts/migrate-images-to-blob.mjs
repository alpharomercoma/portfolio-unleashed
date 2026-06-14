// One-time migration: upload the committed /public images referenced by the
// admin-managed collections to the public Vercel Blob store (under "media/"),
// rewrite the seed JSON to point at the Blob URLs, and report which local files
// became redundant. Idempotent: values that are already http(s) URLs are skipped.
//
// Usage: set BLOB_READ_WRITE_TOKEN, then `node scripts/migrate-images-to-blob.mjs`
// Afterwards run `pnpm seed-collections` to push the Blob URLs into Upstash.
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// collection seed -> which field holds the image, and the /public subdir used
// for bare file names.
const TARGETS = [
	{ key: "projects", field: "image", dir: "projects" },
	{ key: "selected-work", field: "image", dir: "featured" },
	{ key: "awards", field: "image", dir: "awards" },
	{ key: "certifications", field: "logo", dir: "certification/logo" },
];

const MIME = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".gif": "image/gif",
	".avif": "image/avif",
};

function localPathFor(value, dir) {
	if (/^https?:/i.test(value)) return null; // already remote
	const rel = value.startsWith("/")
		? value.replace(/^\//, "")
		: path.join(dir, value);
	return path.join(root, "public", rel);
}

const cache = new Map(); // localPath -> blobUrl (dedupe repeated files like FCC.png)
const migrated = new Set();

async function migrateValue(value, dir) {
	if (!value || /^https?:/i.test(value)) return value;
	const lp = localPathFor(value, dir);
	if (!lp || !existsSync(lp)) {
		console.warn("  MISSING (left as-is):", value);
		return value;
	}
	if (cache.has(lp)) return cache.get(lp);
	const buf = await readFile(lp);
	const ext = path.extname(lp).toLowerCase();
	const blob = await put(`media/${path.basename(lp)}`, buf, {
		access: "public",
		addRandomSuffix: true,
		contentType: MIME[ext] || "application/octet-stream",
	});
	cache.set(lp, blob.url);
	migrated.add(lp);
	console.log("  ", value, "->", new URL(blob.url).pathname);
	return blob.url;
}

async function main() {
	if (!process.env.BLOB_READ_WRITE_TOKEN) {
		console.error("BLOB_READ_WRITE_TOKEN is required.");
		process.exit(1);
	}
	for (const t of TARGETS) {
		const file = path.join(root, "data", `${t.key}.seed.json`);
		const items = JSON.parse(await readFile(file, "utf8"));
		console.log(`[migrate] ${t.key}: ${items.length} items`);
		for (const item of items) {
			item[t.field] = await migrateValue(item[t.field], t.dir);
		}
		await writeFile(file, `${JSON.stringify(items, null, "\t")}\n`);
		console.log(`[migrate] wrote data/${t.key}.seed.json`);
	}
	console.log("\nRedundant local files (safe to delete):");
	for (const f of [...migrated].sort()) console.log("  ", path.relative(root, f));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
