import "server-only";

import { z } from "zod";

import { createLogger } from "@/lib/logger";

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
