"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { ABOUT_TAG, saveAbout } from "@/lib/about/store";
import { getSession } from "@/lib/session";

export async function saveAboutAction(formData: FormData) {
	if (!(await getSession())) redirect("/admin/login");

	const title = String(formData.get("title") ?? "").trim();
	const body = String(formData.get("body") ?? "").trim();

	try {
		await saveAbout({ title: title || "About me", body });
	} catch (err) {
		redirect(
			`/admin/about?error=${encodeURIComponent((err as Error).message)}`,
		);
	}

	updateTag(ABOUT_TAG);
	revalidatePath("/about");
	revalidatePath("/");
	redirect("/admin/about?saved=1");
}
