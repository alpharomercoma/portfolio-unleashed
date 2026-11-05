import { beforeEach, describe, expect, it } from "vitest";

import {
	AUDIT_CAP,
	HISTORY_CAP,
	WriteConflictError,
	applyWrites,
	readAudit,
	readHistory,
	readRev,
	readVersioned,
} from "@/lib/content/revisions";

import { flush, testRedis } from "../helpers";

const redis = testRedis();
const admin = { type: "admin" } as const;
const idx = { key: "t:ids", member: "a" };

beforeEach(() => flush(redis));

describe("applyWrites", () => {
	it("creates, then updates only at the expected revision", async () => {
		expect(
			await applyWrites(
				redis,
				[{ key: "t:a", op: "set", value: { v: 1 }, exists: false, index: idx }],
				{ actor: admin },
			),
		).toEqual([1]);
		expect(await redis.smembers("t:ids")).toEqual(["a"]);

		await expect(
			applyWrites(
				redis,
				[
					{
						key: "t:a",
						op: "set",
						value: { v: 2 },
						exists: true,
						expectedRev: 0,
					},
				],
				{ actor: admin },
			),
		).rejects.toMatchObject({ reason: "conflict", currentRev: 1 });

		expect(
			await applyWrites(
				redis,
				[
					{
						key: "t:a",
						op: "set",
						value: { v: 2 },
						exists: true,
						expectedRev: 1,
					},
				],
				{ actor: admin },
			),
		).toEqual([2]);
		const [read] = await readVersioned(redis, ["t:a"]);
		expect(read).toMatchObject({
			value: { v: 2 },
			rev: 2,
			meta: { by: admin },
		});
	});

	it("refuses to create over an existing record", async () => {
		await redis.set("t:a", { legacy: true });
		await expect(
			applyWrites(
				redis,
				[{ key: "t:a", op: "set", value: { v: 1 }, exists: false }],
				{ actor: admin },
			),
		).rejects.toBeInstanceOf(WriteConflictError);
		expect(await redis.get("t:a")).toEqual({ legacy: true });
	});

	it("treats a legacy record without a rev key as revision 0", async () => {
		await redis.set("t:a", { legacy: true });
		expect(await readRev(redis, "t:a")).toBe(0);
		expect(
			await applyWrites(
				redis,
				[
					{
						key: "t:a",
						op: "set",
						value: { v: 1 },
						exists: true,
						expectedRev: 0,
					},
				],
				{ actor: admin },
			),
		).toEqual([1]);
		const [h] = await readHistory(redis, "t:a");
		expect(h).toMatchObject({
			rev: 0,
			meta: null,
			replacedBy: admin,
			value: { legacy: true },
		});
	});

	it("deletes, keeps counting revisions, and restores", async () => {
		await applyWrites(
			redis,
			[{ key: "t:a", op: "set", value: { v: 1 }, index: idx }],
			{ actor: admin },
		);
		expect(
			await applyWrites(
				redis,
				[{ key: "t:a", op: "del", exists: true, expectedRev: 1, index: idx }],
				{ actor: admin },
			),
		).toEqual([2]);
		expect(await redis.smembers("t:ids")).toEqual([]);
		expect(await readVersioned(redis, ["t:a"])).toMatchObject([
			{ value: null, rev: 2 },
		]);
		// Deleting again: the record is gone.
		await expect(
			applyWrites(redis, [{ key: "t:a", op: "del", exists: true }], {
				actor: admin,
			}),
		).rejects.toMatchObject({ reason: "missing" });
		// Recreate from history at the current revision.
		const [h] = await readHistory(redis, "t:a");
		expect(
			await applyWrites(
				redis,
				[
					{
						key: "t:a",
						op: "set",
						value: h.value,
						exists: false,
						expectedRev: 2,
						index: idx,
					},
				],
				{ actor: admin },
			),
		).toEqual([3]);
	});

	it("is all-or-nothing across a batch", async () => {
		await applyWrites(
			redis,
			[
				{ key: "t:a", op: "set", value: { v: 1 } },
				{ key: "t:b", op: "set", value: { v: 1 } },
			],
			{ actor: admin },
		);
		await expect(
			applyWrites(
				redis,
				[
					{ key: "t:a", op: "set", value: { v: 2 }, expectedRev: 1 },
					{ key: "t:b", op: "set", value: { v: 2 }, expectedRev: 0 },
				],
				{ actor: admin },
			),
		).rejects.toMatchObject({ reason: "conflict", key: "t:b" });
		const read = await readVersioned(redis, ["t:a", "t:b"]);
		expect(read.map((r) => r.value)).toEqual([{ v: 1 }, { v: 1 }]);
	});

	it("lets exactly one of many concurrent writers win a revision", async () => {
		await applyWrites(redis, [{ key: "t:a", op: "set", value: { v: 0 } }], {
			actor: admin,
		});
		const results = await Promise.allSettled(
			Array.from({ length: 20 }, (_, i) =>
				applyWrites(
					redis,
					[{ key: "t:a", op: "set", value: { v: i + 1 }, expectedRev: 1 }],
					{ actor: { type: "agent", name: `w${i}` } },
				),
			),
		);
		expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
		expect(await readRev(redis, "t:a")).toBe(2);
	});

	it("caps history and audit lists", async () => {
		for (let i = 0; i < HISTORY_CAP + 5; i++) {
			await applyWrites(redis, [{ key: "t:a", op: "set", value: { v: i } }], {
				actor: admin,
				audit: { action: "test", i },
			});
		}
		expect(await redis.llen("hist:t:a")).toBe(HISTORY_CAP);
		const audit = await readAudit(redis, 3);
		expect(audit[0]).toMatchObject({
			by: admin,
			revs: [HISTORY_CAP + 5],
			detail: { action: "test", i: HISTORY_CAP + 4 },
		});
		expect(AUDIT_CAP).toBeGreaterThan(0);
	});

	it("round-trips awkward strings through history intact", async () => {
		const nasty = {
			s: 'quote " backslash \\ newline \n tab \t unicode ✓ 😀 </script>  ',
		};
		await applyWrites(redis, [{ key: "t:a", op: "set", value: nasty }], {
			actor: { type: "agent", name: 'a"b' },
		});
		await applyWrites(redis, [{ key: "t:a", op: "set", value: { v: 2 } }], {
			actor: admin,
		});
		const [h] = await readHistory(redis, "t:a");
		expect(h.value).toEqual(nasty);
		expect(h.meta?.by).toEqual({ type: "agent", name: 'a"b' });
		expect(h.replacedBy).toEqual(admin);
	});

	it("rejects malformed batches before touching Redis", async () => {
		await expect(
			applyWrites(
				redis,
				[
					{ key: "t:a", op: "set", value: {} },
					{ key: "t:a", op: "del" },
				],
				{ actor: admin },
			),
		).rejects.toThrow(/Duplicate/);
		await expect(
			applyWrites(
				redis,
				[{ key: "t:a", op: "set", value: {}, expectedRev: -1 }],
				{
					actor: admin,
				},
			),
		).rejects.toThrow(/Invalid expected revision/);
		await expect(
			applyWrites(redis, [{ key: "t:a", op: "set" }], { actor: admin }),
		).rejects.toThrow(/Missing value/);
		expect(await redis.dbsize()).toBe(0);
	});
});
