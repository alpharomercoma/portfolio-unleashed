import { beforeEach } from "vitest";

import { resetCache } from "./stubs/next-cache";

// Integration tests run against a throwaway local Redis behind an
// Upstash-compatible REST proxy (see test/README.md). Never let a developer's
// .env.local point them at the production store: the suites FLUSHDB.
const url = process.env.TEST_UPSTASH_URL ?? "http://127.0.0.1:8079";
const host = new URL(url).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
	throw new Error(`Refusing to run tests against a non-local Redis: ${host}`);
}
for (const k of [
	"KV_REST_API_URL",
	"KV_REST_API_TOKEN",
	"KV_REST_API_READ_ONLY_TOKEN",
	"KV_URL",
	"REDIS_URL",
	"BLOB_READ_WRITE_TOKEN",
	"RESEND_API_KEY",
]) {
	delete process.env[k];
}
process.env.UPSTASH_REDIS_REST_URL = url;
process.env.UPSTASH_REDIS_REST_TOKEN =
	process.env.TEST_UPSTASH_TOKEN ?? "test_token";

// Each test starts with an empty data cache (the suites also flush Redis).
beforeEach(() => resetCache());
