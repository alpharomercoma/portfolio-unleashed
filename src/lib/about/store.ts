import "server-only";

import { unstable_cache } from "next/cache";

import {
	type Versioned,
	type WriteOptions,
	applyWrites,
	readVersioned,
} from "@/lib/content/revisions";
import { createLogger } from "@/lib/logger";
import { createRedis, failReadInProduction } from "@/lib/redis";
import aboutSeedJson from "../../../data/about.seed.json";
import { type About, aboutSchema } from "./schema";

const log = createLogger("about");
const redis = createRedis();
export const isAboutStoreConfigured = redis != null;

export const ABOUT_TAG = "about";
export const ABOUT_KEY = "about:doc";

export function aboutSeed(): About {
	return aboutSchema.parse(aboutSeedJson);
}

// Uncached Upstash read with a committed-seed fallback so the build stays green
// and the public page renders with no credentials.
async function readAbout(): Promise<About> {
	if (!redis) return aboutSeed();
	try {
		const raw = await redis.get<unknown>(ABOUT_KEY);
		// Only a missing document means "not saved yet"; anything else must validate.
		if (raw == null) return aboutSeed();
		const parsed = aboutSchema.safeParse(raw);
		if (parsed.success) return parsed.data;
		failReadInProduction(parsed.error);
		return aboutSeed();
	} catch (error) {
		failReadInProduction(error);
		log.warn("read failed; using seed", error);
		return aboutSeed();
	}
}

/**
 * Read the About document. Cached indefinitely and tagged `about`; the admin
 * write action calls `updateTag`, so Upstash is hit only on a cache miss.
 */
export function getAbout(): Promise<About> {
	return unstable_cache(readAbout, ["about-doc"], { tags: [ABOUT_TAG] })();
}

/**
 * Validate + persist the About document through the revisioned writer. Pass
 * `expectedRev` to refuse the write if someone else saved in the meantime.
 */
export async function saveAbout(
	data: { title: string; body: string },
	opts: Omit<WriteOptions, "mustExist"> = {},
): Promise<About & { rev: number }> {
	if (!redis) {
		throw new Error(
			"About store is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
		);
	}
	const parsed = aboutSchema.parse({
		...data,
		updatedAt: new Date().toISOString(),
	});
	const [rev] = await applyWrites(
		redis,
		[
			{
				key: ABOUT_KEY,
				op: "set",
				value: parsed,
				expectedRev: opts.expectedRev,
				// Until the first save the site shows the seed; keep it revertable.
				historyFallback: aboutSeed(),
			},
		],
		{
			actor: opts.actor ?? { type: "admin" },
			haltKey: opts.haltKey,
			audit: { action: "update", resource: "about", ...opts.audit },
		},
	);
	return { ...parsed, rev };
}

/**
 * The About document for the admin form, read straight from the store so its
 * content and revision agree. Seed (no revision) when nothing is stored yet.
 */
export async function getAboutForEdit(): Promise<{
	about: About;
	rev?: number;
}> {
	if (!redis) return { about: await getAbout() };
	const { value, rev } = await readAboutVersioned();
	const parsed = aboutSchema.safeParse(value);
	// Unsaved (seed) content is revision 0, so a form opened on it still can't
	// overwrite a save made in the meantime.
	return { about: parsed.success ? parsed.data : aboutSeed(), rev };
}

/** Uncached read of the stored document with its revision (value null if unset). */
export async function readAboutVersioned(): Promise<Versioned> {
	if (!redis) throw new Error("About store is not configured.");
	const [v] = await readVersioned(redis, [ABOUT_KEY]);
	return v;
}
