import { execFile } from "node:child_process";
import { type Server, createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { promisify } from "node:util";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { handleAgentRequest } from "@/lib/agent/http";

import { harness } from "../agent-harness";
import { flush, seedAll, testRedis } from "../helpers";

// Runs the real CLI (scripts/agent.mjs) against the real handler over HTTP.
const run = promisify(execFile);
const redis = testRedis();
const h = harness();
let server: Server;
let base = "";

beforeAll(async () => {
	server = createServer(async (req, res) => {
		const chunks: Buffer[] = [];
		for await (const c of req) chunks.push(c as Buffer);
		const url = new URL(req.url ?? "/", base);
		const request = new Request(url, {
			method: req.method,
			headers: req.headers as Record<string, string>,
			body: chunks.length ? Buffer.concat(chunks) : undefined,
		});
		const segments = url.pathname
			.replace(/^\/api\/agent\/v1\/?/, "")
			.split("/")
			.filter(Boolean)
			.map(decodeURIComponent);
		const response = await handleAgentRequest(request, segments, h.deps);
		res.writeHead(response.status, Object.fromEntries(response.headers));
		res.end(await response.text());
	});
	await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
	base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

beforeEach(async () => {
	await flush(redis);
	await seedAll(redis);
});

async function cli(as: string, ...args: string[]) {
	try {
		const { stdout } = await run(
			process.execPath,
			["scripts/agent.mjs", ...args],
			{
				env: {
					NODE_ENV: "test",
					PATH: process.env.PATH,
					PORTFOLIO_AGENT_URL: base,
					PORTFOLIO_AGENT_TOKEN: h.tokens[as],
				},
			},
		);
		return { code: 0, out: stdout };
	} catch (err) {
		const e = err as { code: number; stdout: string; stderr: string };
		return { code: e.code, out: e.stdout + e.stderr };
	}
}

describe("pnpm agent (CLI)", () => {
	it("creates a draft, refuses to publish without the scope, and publishes with it", async () => {
		const created = await cli(
			"writer",
			"create",
			"talks",
			"--data",
			JSON.stringify({ title: "CLI Talk" }),
		);
		expect(created.code).toBe(0);
		expect(created.out).toContain("Saved talks/cli-talk");
		const denied = await cli("writer", "publish", "talks", "cli-talk");
		expect(denied.code).toBe(1);
		expect(denied.out).toContain("needs scope: publish");
		expect(
			(await cli("publisher", "publish", "talks", "cli-talk")).out,
		).toContain("live: yes");
	});

	it("patches with --set, deletes, and restores a deleted record without --rev", async () => {
		await cli(
			"writer",
			"create",
			"talks",
			"--data",
			JSON.stringify({ title: "CLI Talk" }),
		);
		const patched = await cli(
			"writer",
			"patch",
			"talks",
			"cli-talk",
			"--set",
			"tagline=Hi",
			"--set",
			'tags:=["a","b"]',
		);
		expect(patched.out).toContain("changed: tagline, tags");
		expect((await cli("admin", "delete", "talks", "cli-talk")).code).toBe(2); // needs --yes
		expect(
			(await cli("admin", "delete", "talks", "cli-talk", "--yes")).out,
		).toContain("Deleted");
		const restored = await cli(
			"admin",
			"revert",
			"talks",
			"cli-talk",
			"--to",
			"2",
		);
		expect(restored.code).toBe(0);
		expect(restored.out).toContain("Saved talks/cli-talk");
	});

	it("reorders with the revisions it listed", async () => {
		const list = JSON.parse(
			(await cli("reader", "list", "gallery", "--json")).out,
		).items as {
			id: string;
		}[];
		const ids = list.map((i) => i.id).reverse();
		const r = await cli("publisher", "reorder", "gallery", ...ids, "--json");
		expect(r.code).toBe(0);
		expect(JSON.parse(r.out).ids).toEqual(ids);
	});

	it("refuses bad usage and unsafe URLs before sending anything", async () => {
		expect(
			(await cli("admin", "update", "talks", "x", "--data", "{}")).code,
		).toBe(2); // no --rev
		expect((await cli("admin", "get", "talks", "../x")).code).toBe(2);
		const insecure = await run(
			process.execPath,
			["scripts/agent.mjs", "whoami"],
			{
				env: {
					NODE_ENV: "test",
					PATH: process.env.PATH,
					PORTFOLIO_AGENT_URL: "http://example.com",
					PORTFOLIO_AGENT_TOKEN: h.tokens.admin,
				},
			},
		).catch((e) => e);
		expect(insecure.code).toBe(2);
	});
});
