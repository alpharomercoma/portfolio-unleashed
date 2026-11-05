import { Redis } from "@upstash/redis";

import awards from "../data/awards.seed.json";
import certifications from "../data/certifications.seed.json";
import gallery from "../data/gallery.seed.json";
import projects from "../data/projects.seed.json";
import recommendations from "../data/recommendations.seed.json";
import research from "../data/research.seed.json";
import selectedWork from "../data/selected-work.seed.json";
import talks from "../data/talks.seed.json";

/** Client for the local test Redis (configured in test/setup.ts). */
export function testRedis(): Redis {
	return new Redis({
		url: process.env.UPSTASH_REDIS_REST_URL!,
		token: process.env.UPSTASH_REDIS_REST_TOKEN!,
	});
}

export async function flush(redis: Redis): Promise<void> {
	await redis.flushdb();
}

const COLLECTION_SEEDS: Record<string, { id: string }[]> = {
	research,
	"selected-work": selectedWork,
	projects,
	awards,
	certifications,
	recommendations,
	gallery,
};

/** Push the committed seeds into the test Redis, as the seed scripts do. */
export async function seedAll(redis: Redis): Promise<void> {
	const p = redis.pipeline();
	for (const t of talks as { slug: string }[]) {
		p.set(`talk:${t.slug}`, t);
		p.sadd("talks:slugs", t.slug);
	}
	for (const [key, items] of Object.entries(COLLECTION_SEEDS)) {
		for (const item of items) {
			p.set(`col:${key}:item:${item.id}`, item);
			p.sadd(`col:${key}:ids`, item.id);
		}
	}
	await p.exec();
}

export const SEED_COUNTS: Record<string, number> = {
	talks: (talks as unknown[]).length,
	...Object.fromEntries(
		Object.entries(COLLECTION_SEEDS).map(([k, v]) => [k, v.length]),
	),
};
