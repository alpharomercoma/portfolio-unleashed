import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aboutSeed, getAbout } from "@/lib/about/store";
import { getAllItems, upsertItem } from "@/lib/collections/store";
import { getAllTalks } from "@/lib/talks/store";
import { resetCache } from "../stubs/next-cache";

const store = vi.hoisted(() => ({ aboutDoc: null as unknown }));

// A store with credentials whose every call fails, unless a test gives it a document.
vi.mock("@/lib/redis", async (original) => ({
	...(await original<typeof import("@/lib/redis")>()),
	createRedis: () =>
		new Proxy(
			{},
			{
				get: (_, method) => () =>
					method === "get" && store.aboutDoc !== null
						? Promise.resolve(store.aboutDoc)
						: Promise.reject(new Error("redis down")),
			},
		),
}));

beforeEach(() => {
	resetCache();
	store.aboutDoc = null;
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("a configured store that can't be read", () => {
	it("fails in production, so a seed is never cached as the live content", async () => {
		vi.stubEnv("NODE_ENV", "production");
		await expect(getAbout()).rejects.toThrow("redis down");
		await expect(getAllItems("projects")).rejects.toThrow("redis down");
		await expect(getAllTalks()).rejects.toThrow("redis down");
	});

	it("falls back to the seed outside production", async () => {
		expect(await getAbout()).toEqual(aboutSeed());
		expect((await getAllItems("projects")).length).toBeGreaterThan(0);
		expect((await getAllTalks()).length).toBeGreaterThan(0);
	});
});

describe("a stored About that doesn't validate", () => {
	it("fails in production, so the seed isn't cached over it", async () => {
		vi.stubEnv("NODE_ENV", "production");
		for (const doc of [{ title: 123 }, false, 0, ""]) {
			resetCache();
			store.aboutDoc = doc;
			await expect(getAbout()).rejects.toThrow();
		}
	});

	it("falls back to the seed outside production", async () => {
		store.aboutDoc = { title: 123 };
		expect(await getAbout()).toEqual(aboutSeed());
	});
});

describe("saving chart rows the page can't draw", () => {
	for (const bars of [
		["A = 900 ms", "B = 1.2 s"],
		["A = 1 ms", "B = unavailable"],
	]) {
		it(`refuses ${JSON.stringify(bars)} with a reason`, async () => {
			await expect(
				upsertItem("projects", { title: "A project", bars }),
			).rejects.toThrow(/Chart rows must read/);
		});
	}
});
