// One-off: strip the "This is placeholder text…" blockquote that shipped in the
// About document. The seed is already fixed; this repairs the live Upstash copy
// (key `about:doc`) if it still carries the line, and leaves everything else in
// the document untouched. Safe to re-run; no-ops when there is nothing to fix.
//
// Usage: node --env-file=.env.local scripts/fix-about-placeholder.mjs
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token =
	process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
	console.log("[fix-about] Upstash not configured; nothing to do.");
	process.exit(0);
}

const { Redis } = await import("@upstash/redis");
const redis = new Redis({ url, token });
const KEY = "about:doc";
const doc = await redis.get(KEY);
if (!doc || typeof doc.body !== "string") {
	console.log("[fix-about] no About document in Redis; the seed is served.");
	process.exit(0);
}

const PLACEHOLDER = /\n*>\s*This is placeholder text\.[^\n]*\n?/g;
if (!PLACEHOLDER.test(doc.body)) {
	console.log("[fix-about] live document is already clean.");
	process.exit(0);
}

const body = doc.body.replace(PLACEHOLDER, "").trimEnd();
await redis.set(KEY, { ...doc, body, updatedAt: new Date().toISOString() });
console.log("[fix-about] removed the placeholder paragraph from the live About.");
