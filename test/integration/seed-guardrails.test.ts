import { describe, expect, it } from "vitest";

import { ADAPTERS } from "@/lib/agent/resources";
import { collectionInputs } from "@/lib/agent/schemas";
import { COLLECTION_KEYS } from "@/lib/collections/registry";

describe("committed seed vs agent guardrails", () => {
	it("defines an agent schema for every collection, matching the store fields", () => {
		expect(Object.keys(collectionInputs).sort()).toEqual(
			[...COLLECTION_KEYS].sort(),
		);
	});

	for (const [name, adapter] of Object.entries(ADAPTERS)) {
		it(`${name}: every seed record round-trips through the agent input schema`, () => {
			for (const row of adapter.seedRows()) {
				const { createdAt, updatedAt, order, ...settable } = row.record!;
				void createdAt;
				void updatedAt;
				void order;
				const res = adapter.input.safeParse(settable);
				expect(
					res.success
						? []
						: res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
					`${name}/${row.id}`,
				).toEqual([]);
			}
		});
	}
});
