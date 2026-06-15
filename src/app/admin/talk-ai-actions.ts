"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { aiDraftRateLimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";
import { type TalkDraft, draftFromSlides } from "@/lib/talks/ai-draft";

/**
 * Admin-only: draft a talk's inferable fields from a Google Slides link via
 * Mistral. Returns the draft for the client to populate the form with (nothing
 * is persisted — the owner reviews and saves). Rate-limited because each call
 * fetches a PDF and invokes the model.
 */
export async function draftTalkFromSlides(
	slidesUrl: string,
): Promise<{ ok: true; draft: TalkDraft } | { ok: false; error: string }> {
	if (!(await getSession())) redirect("/admin/login");

	const h = await headers();
	const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "admin";
	const { success } = await aiDraftRateLimit(ip);
	if (!success) {
		return {
			ok: false,
			error: "Too many draft requests. Please try again in a little while.",
		};
	}

	try {
		const draft = await draftFromSlides(slidesUrl);
		return { ok: true, draft };
	} catch (err) {
		return {
			ok: false,
			error: (err as Error).message || "Couldn't draft from these slides.",
		};
	}
}
