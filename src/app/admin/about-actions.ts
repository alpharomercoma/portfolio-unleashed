"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { ABOUT_TAG, saveAbout } from "@/lib/about/store";
import { costIssue, nestingIssue } from "@/lib/agent/guards";
import { WriteConflictError } from "@/lib/content/revisions";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/session";
import { parseRev } from "@/lib/utils";

const log = createLogger("about");

export async function saveAboutAction(formData: FormData) {
	await requireAdmin();

	const title = String(formData.get("title") ?? "").trim();
	const body = String(formData.get("body") ?? "").trim();

	// Deeply nested quotes/lists overflow the markdown renderer and would take
	// the public /about page down, so refuse them here too.
	const tooComplex = costIssue(body) ?? nestingIssue(body);
	if (tooComplex) {
		redirect(
			`/admin/about?error=${encodeURIComponent(`Not saved: ${tooComplex}.`)}`,
		);
	}

	try {
		await saveAbout(
			{ title: title || "About me", body },
			{ expectedRev: parseRev(formData.get("rev")) },
		);
	} catch (err) {
		const message =
			err instanceof WriteConflictError
				? "The About page changed since you opened it (another tab, or an agent). Reload to see the latest version, then reapply your edits."
				: "Couldn't save. Please try again.";
		if (!(err instanceof WriteConflictError)) log.error("save failed", err);
		redirect(`/admin/about?error=${encodeURIComponent(message)}`);
	}

	updateTag(ABOUT_TAG);
	revalidatePath("/about");
	revalidatePath("/");
	redirect("/admin/about?saved=1");
}
