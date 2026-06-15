"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { ABOUT_TAG, saveAbout } from "@/lib/about/store";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/session";

const log = createLogger("about");

export async function saveAboutAction(formData: FormData) {
	await requireAdmin();

	const title = String(formData.get("title") ?? "").trim();
	const body = String(formData.get("body") ?? "").trim();

	try {
		await saveAbout({ title: title || "About me", body });
	} catch (err) {
		log.error("save failed", err);
		redirect(
			`/admin/about?error=${encodeURIComponent(
				"Couldn't save. Please try again.",
			)}`,
		);
	}

	updateTag(ABOUT_TAG);
	revalidatePath("/about");
	revalidatePath("/");
	redirect("/admin/about?saved=1");
}
