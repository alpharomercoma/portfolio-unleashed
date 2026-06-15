"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { type TalkDraft, draftFromSlides } from "@/lib/talks/ai-draft";

/**
 * Admin-only: draft a talk's inferable fields from a Google Slides link via
 * Mistral. Returns the draft for the client to populate the form with (nothing
 * is persisted — the owner reviews and saves).
 */
export async function draftTalkFromSlides(
	slidesUrl: string,
): Promise<{ ok: true; draft: TalkDraft } | { ok: false; error: string }> {
	if (!(await getSession())) redirect("/admin/login");
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
