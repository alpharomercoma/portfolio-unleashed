import "server-only";

import { parse as parseYaml } from "yaml";
import { z } from "zod";

import { createLogger } from "@/lib/logger";

import resumeSeed from "../../data/resume.seed.json";

// The resume lives in its own repo as RenderCV YAML. CI there renders it and
// publishes a dated GitHub release per change; this site serves whatever the
// latest release holds, so updating the resume never needs a redeploy here.
export const RESUME_REPO_URL = "https://github.com/alpharomercoma/resume";
export const RESUME_RELEASES_URL = `${RESUME_REPO_URL}/releases`;
export const RESUME_FILENAME = "Alpha_Romer_Coma_CV";
// Tags every release fetch, so /api/revalidate/resume can expire them at once.
export const RESUME_TAG = "resume";

// Fallback refresh. Releases expire the cache immediately through
// /api/revalidate/resume; keep in sync with `revalidate` in app/resume/page.tsx
// and the resume.* routes (segment config must be a literal, so it can't import this).
const REVALIDATE_SECONDS = 3600;

const log = createLogger("resume");

const versionSchema = z.object({
	version: z.string(),
	publishedAt: z.string(),
	commit: z.string(),
});

export type ResumeVersion = z.infer<typeof versionSchema>;

/** Fetches one asset of the latest release, or null if it isn't available. */
export async function fetchResumeAsset(name: string): Promise<Response | null> {
	const url = `${RESUME_RELEASES_URL}/latest/download/${name}`;
	try {
		const res = await fetch(url, {
			next: { revalidate: REVALIDATE_SECONDS, tags: [RESUME_TAG] },
		});
		if (res.ok) return res;
		log.warn(`${name} returned ${res.status}`);
	} catch (err) {
		log.error(`failed to fetch ${name}`, err);
	}
	return null;
}

export async function getResumeVersion(): Promise<ResumeVersion | null> {
	const res = await fetchResumeAsset("version.json");
	if (!res) return null;
	const parsed = versionSchema.safeParse(await res.json().catch(() => null));
	if (!parsed.success) {
		log.warn("version.json is malformed", parsed.error.issues);
		return null;
	}
	return parsed.data;
}

/** The RenderCV Markdown export, minus its own title and contact list. */
export async function getResumeMarkdown(): Promise<string | null> {
	const res = await fetchResumeAsset(`${RESUME_FILENAME}.md`);
	if (!res) return null;
	const markdown = await res.text();
	// The page already has a heading and links; start at the first section.
	const firstSection = markdown.indexOf("\n# ");
	return firstSection >= 0 ? markdown.slice(firstSection + 1) : markdown;
}

/** Proxies a binary release asset so it is served from alpharomer.com. */
export async function serveResumeAsset(
	ext: "pdf" | "png",
	contentType: string,
): Promise<Response> {
	const name = `${RESUME_FILENAME}.${ext}`;
	const res = await fetchResumeAsset(name);
	if (!res) return Response.redirect(RESUME_RELEASES_URL, 307);
	return new Response(await res.arrayBuffer(), {
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": `inline; filename="${name}"`,
		},
	});
}

const cvSchema = z.object({
	cv: z.object({
		sections: z.record(z.string(), z.array(z.unknown())),
	}),
});

const experienceSchema = z.object({
	company: z.string(),
	position: z.string(),
	start_date: z.union([z.string(), z.number()]).optional(),
	end_date: z.union([z.string(), z.number()]).optional(),
	highlights: z.array(z.string()).default([]),
});

const communitySchema = z.object({
	name: z.string(),
	start_date: z.union([z.string(), z.number()]).optional(),
	end_date: z.union([z.string(), z.number()]).optional(),
	highlights: z.array(z.string()).default([]),
});

export type ResumeRole = {
	/** Who it was for. Plain text. */
	organization: string;
	url?: string;
	role: string;
	dates: string;
	/** May contain **bold** and [links](url). */
	highlights: string[];
};

export type ResumeProfile = { summary: string; roles: ResumeRole[] };

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

function formatMonth(value: string | number | undefined): string {
	const text = String(value ?? "");
	const m = /^(\d{4})-(\d{2})/.exec(text);
	if (m) return `${MONTHS[Number(m[2]) - 1] ?? ""} ${m[1]}`.trim();
	return text === "present" ? "now" : text;
}

function stripMarkdown(text: string): string {
	return text
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replaceAll("**", "")
		.trim();
}

/**
 * Who the owner works for and what they measured there, from the same YAML the
 * resume is rendered from, so the homepage can't drift from it. A role that doesn't
 * parse is skipped; if the release can't be read at all, the committed snapshot in
 * data/resume.seed.json stands in, so an outage never empties the section.
 */
export async function getResumeProfile(): Promise<ResumeProfile> {
	const res = await fetchResumeAsset(`${RESUME_FILENAME}.yaml`);
	if (!res) return resumeSeed;
	try {
		const { sections } = cvSchema.parse(parseYaml(await res.text())).cv;
		const summary = sections.Summary?.find(
			(s): s is string => typeof s === "string",
		);
		const roles: ResumeRole[] = (
			sections["Professional Experience"] ?? []
		).flatMap((entry) => {
			const e = experienceSchema.safeParse(entry);
			if (!e.success) {
				log.warn("skipped a resume role", e.error.issues);
				return [];
			}
			return [
				{
					organization: stripMarkdown(e.data.company),
					url: /\]\(([^)]+)\)/.exec(e.data.company)?.[1],
					role: e.data.position,
					dates: `${formatMonth(e.data.start_date)} to ${formatMonth(e.data.end_date)}`,
					highlights: e.data.highlights,
				},
			];
		});
		// Community roles sit under the speaking entries; they have a date range and
		// no one company.
		for (const entry of sections["Speaking & Community"] ?? []) {
			const c = communitySchema.safeParse(entry);
			if (c.success && /Ambassador|Campus Expert/.test(c.data.name)) {
				roles.push({
					organization: "Community",
					role: stripMarkdown(c.data.name),
					dates: `${formatMonth(c.data.start_date)} to ${formatMonth(c.data.end_date)}`,
					highlights: c.data.highlights,
				});
			}
		}
		if (roles.length === 0) return resumeSeed;
		return { summary: summary ?? resumeSeed.summary, roles };
	} catch (err) {
		log.warn("resume YAML could not be read", err);
		return resumeSeed;
	}
}
