import "server-only";

import { unstable_cache } from "next/cache";

import {
	type Versioned,
	type WriteOptions,
	applyWrites,
	readIndex,
	readVersioned,
} from "@/lib/content/revisions";
import { createLogger } from "@/lib/logger";
import { createRedis, failReadInProduction } from "@/lib/redis";
import seedData from "../../../data/talks.seed.json";
import { type Talk, sortTalksByRecency, talkSchema } from "./schema";

// Revalidated by the admin write actions; until then reads serve from cache.
export const TALKS_TAG = "talks";

const log = createLogger("talks");
const redis = createRedis();
export const isStoreConfigured = redis != null;

export const TALK_KEY = (slug: string) => `talk:${slug}`;
export const SLUGS_KEY = "talks:slugs";

// The committed seed doubles as the static fallback when Upstash isn't configured
// (local dev / a build with no credentials) and the canonical data the seed script
// pushes into Upstash. Keeps /speaking populated and the build green without creds.
function seedTalks(): Talk[] {
	return parseTalks(seedData as unknown[]);
}

// Records written before the Draft/Published change carry a `needsReview` boolean
// instead of `status`. Map those forward so review-flagged talks become drafts
// (not silently published) without needing a data migration.
function normalizeLegacy(raw: unknown): unknown {
	if (!raw || typeof raw !== "object") return raw;
	const rec = raw as Record<string, unknown>;
	if (rec.status == null && "needsReview" in rec) {
		return { ...rec, status: rec.needsReview === true ? "draft" : "published" };
	}
	return raw;
}

export function parseTalk(raw: unknown) {
	return talkSchema.safeParse(normalizeLegacy(raw));
}

function parseTalks(raw: unknown[]): Talk[] {
	const out: Talk[] = [];
	for (const item of raw) {
		const res = parseTalk(item);
		if (res.success) {
			out.push(res.data);
		} else {
			// Surface corruption/seed drift instead of silently dropping data.
			log.warn(
				"dropped an item that failed validation",
				res.error.issues
					.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
					.join("; "),
			);
		}
	}
	return out;
}

async function readAllTalks(): Promise<Talk[]> {
	if (!redis) return sortTalksByRecency(seedTalks());
	try {
		// One atomic read of the index and its records. Once the store holds
		// any talk it is authoritative: an empty or invalid result is served as
		// is, never replaced by the committed seed (that would put different
		// content live).
		const rows = await readIndex(redis, SLUGS_KEY, TALK_KEY(""));
		if (!rows.length) return sortTalksByRecency(seedTalks());
		return sortTalksByRecency(
			parseTalks(rows.flatMap((r) => (r.value ? [r.value] : []))),
		);
	} catch (error) {
		failReadInProduction(error);
		log.warn("read failed; using seed fallback", error);
		return sortTalksByRecency(seedTalks());
	}
}

/**
 * All talks, cached and tagged `talks`. The admin write actions revalidate the
 * tag, so Upstash is queried only on a cache miss rather than every request.
 */
export function getAllTalks(): Promise<Talk[]> {
	return unstable_cache(readAllTalks, ["talks-all"], { tags: [TALKS_TAG] })();
}

export async function getTalk(slug: string): Promise<Talk | null> {
	// Derive from the cached list so a detail page doesn't add its own query.
	const all = await getAllTalks();
	return all.find((t) => t.slug === slug) ?? null;
}

/** Public-facing talks only — drafts are hidden from the live site. */
export async function getPublishedTalks(): Promise<Talk[]> {
	const all = await getAllTalks();
	return all.filter((t) => t.status === "published");
}

export async function getFeaturedTalks(limit = 3): Promise<Talk[]> {
	const published = await getPublishedTalks();
	const featured = published.filter((t) => t.featured);
	return (featured.length ? featured : published).slice(0, limit);
}

function requireRedis() {
	if (!redis) {
		throw new Error(
			"Talks store is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
		);
	}
	return redis;
}

/**
 * Validate + persist a talk through the revisioned writer. `opts` states the
 * preconditions (create-only, update-only, expected revision); a failed one
 * throws WriteConflictError and writes nothing. Returns the saved talk and its
 * new revision.
 */
export async function upsertTalk(
	talk: Talk,
	opts: WriteOptions = {},
): Promise<{ talk: Talk; rev: number }> {
	const db = requireRedis();
	const now = new Date().toISOString();
	// Validate at the write boundary (mirrors collections' upsertItem) so only
	// schema-valid, size-bounded talks ever reach Redis. Throws ZodError on bad input.
	const toSave = talkSchema.parse({
		...talk,
		createdAt: talk.createdAt || now,
		updatedAt: now,
	});
	const [rev] = await applyWrites(
		db,
		[
			{
				key: TALK_KEY(toSave.slug),
				op: "set",
				value: toSave,
				index: { key: SLUGS_KEY, member: toSave.slug },
				maxIndexSize: opts.maxIndexSize,
				exists: opts.mustExist,
				expectedRev: opts.expectedRev,
			},
		],
		{
			actor: opts.actor ?? { type: "admin" },
			haltKey: opts.haltKey,
			audit: {
				action: opts.mustExist === false ? "create" : "update",
				resource: "talks",
				id: toSave.slug,
				...opts.audit,
			},
		},
	);
	return { talk: toSave, rev };
}

export async function deleteTalk(
	slug: string,
	opts: WriteOptions = {},
): Promise<number> {
	const db = requireRedis();
	const [rev] = await applyWrites(
		db,
		[
			{
				key: TALK_KEY(slug),
				op: "del",
				index: { key: SLUGS_KEY, member: slug },
				exists: opts.mustExist ?? true,
				expectedRev: opts.expectedRev,
				keepIndexNonEmpty: opts.keepIndexNonEmpty,
			},
		],
		{
			actor: opts.actor ?? { type: "admin" },
			haltKey: opts.haltKey,
			audit: { action: "delete", resource: "talks", id: slug, ...opts.audit },
		},
	);
	return rev;
}

/** Uncached read of one stored talk with its revision (for edits). */
export async function readTalkVersioned(slug: string): Promise<Versioned> {
	const [v] = await readVersioned(requireRedis(), [TALK_KEY(slug)]);
	return v;
}

/** Uncached read of every stored talk (drafts included) with revisions. */
export async function listTalksVersioned(): Promise<
	(Versioned & { slug: string })[]
> {
	const rows = await readIndex(requireRedis(), SLUGS_KEY, TALK_KEY(""));
	return rows.map((r) => ({ ...r, slug: r.id }));
}

/**
 * A talk for the admin edit form, read straight from the store (not the cache)
 * so its content and revision agree. Falls back to the cached read, with no
 * revision, when Upstash is not configured or not seeded yet.
 */
export async function getTalkForEdit(
	slug: string,
): Promise<{ talk: Talk; rev?: number } | null> {
	if (!redis) {
		const talk = await getTalk(slug);
		return talk ? { talk } : null;
	}
	// The revision is returned on every path, so the save is always checked.
	const { value, rev } = await readTalkVersioned(slug);
	if (value) {
		const parsed = parseTalk(value);
		if (parsed.success) return { talk: parsed.data, rev };
		log.warn(`${slug}: stored talk fails validation; editing from cache`);
	} else if (await isTalksStoreSeeded()) {
		return null;
	}
	const talk = await getTalk(slug);
	return talk ? { talk, rev } : null;
}

/**
 * Talks for the admin list with their revisions, read from the store (not the
 * cache) so row actions act on the version shown. Falls back to the cached
 * read, without revisions, when the store is not configured or not seeded.
 */
export async function getTalksForAdmin(): Promise<
	(Talk & { _rev?: number })[]
> {
	if (redis && (await isTalksStoreSeeded())) {
		const rows = await listTalksVersioned();
		return sortTalksByRecency(
			rows.flatMap((r) => {
				const parsed = parseTalk(r.value);
				return parsed.success
					? [Object.assign(parsed.data, { _rev: r.rev })]
					: [];
			}),
		);
	}
	return getAllTalks();
}

/** True once the store holds at least one talk (i.e. the seed was pushed). */
export async function isTalksStoreSeeded(): Promise<boolean> {
	return (await requireRedis().scard(SLUGS_KEY)) > 0;
}
