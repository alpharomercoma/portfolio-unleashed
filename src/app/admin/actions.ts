"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	checkPassword,
	signSession,
} from "@/lib/auth";
import { getSession } from "@/lib/session";
import { type Talk, slugify, talkEventSchema } from "@/lib/talks/schema";
import { deleteTalk as storeDelete, upsertTalk } from "@/lib/talks/store";

export async function login(formData: FormData) {
	const password = String(formData.get("password") ?? "");
	const next = String(formData.get("next") ?? "/admin");
	const safeNext = next.startsWith("/admin") ? next : "/admin";

	if (!checkPassword(password)) {
		redirect(`/admin/login?error=1&next=${encodeURIComponent(safeNext)}`);
	}
	const token = await signSession();
	(await cookies()).set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_MAX_AGE,
	});
	redirect(safeNext);
}

export async function logout() {
	(await cookies()).delete(SESSION_COOKIE);
	redirect("/admin/login");
}

function lines(value: FormDataEntryValue | null): string[] {
	return String(value ?? "")
		.split("\n")
		.map((s) => s.trim())
		.filter(Boolean);
}

export async function saveTalk(formData: FormData) {
	if (!(await getSession())) redirect("/admin/login");

	const title = String(formData.get("title") ?? "").trim();
	const slug = String(formData.get("slug") ?? "").trim() || slugify(title);

	// Optional image upload to Vercel Blob.
	let showcaseImage = String(formData.get("showcaseImage") ?? "").trim();
	const file = formData.get("showcaseFile");
	if (
		file instanceof File &&
		file.size > 0 &&
		process.env.BLOB_READ_WRITE_TOKEN
	) {
		const blob = await put(`talks/${slug}-${file.name}`, file, {
			access: "public",
			addRandomSuffix: true,
		});
		showcaseImage = blob.url;
	}

	// Events come through as a JSON array textarea.
	let events: Talk["events"] = [];
	try {
		const parsed = JSON.parse(String(formData.get("events") ?? "[]"));
		const arr = Array.isArray(parsed) ? parsed : [];
		events = arr.map((e, i) => {
			const res = talkEventSchema.safeParse({
				id: e.id || `${slug}-${i + 1}`,
				...e,
			});
			if (!res.success) throw new Error(`event ${i + 1} invalid`);
			return res.data;
		});
	} catch (err) {
		redirect(
			`/admin/talks/${slug || "new"}?error=${encodeURIComponent(
				"Events JSON is invalid: " + (err as Error).message,
			)}`,
		);
	}

	const talk: Talk = {
		slug,
		title,
		tagline: String(formData.get("tagline") ?? "").trim(),
		type: (String(formData.get("type")) as Talk["type"]) || "Talk",
		category: String(formData.get("category") ?? "Community").trim(),
		level: (String(formData.get("level")) as Talk["level"]) || "Foundational",
		durationMinutes: Number(formData.get("durationMinutes") ?? 60) || 60,
		language: String(formData.get("language") ?? "English").trim() || "English",
		tags: lines(formData.get("tags")),
		abstract: String(formData.get("abstract") ?? "").trim(),
		outline: lines(formData.get("outline")),
		keyTakeaways: lines(formData.get("keyTakeaways")),
		featured: formData.get("featured") === "on",
		needsReview: formData.get("needsReview") === "on",
		showcaseImage,
		primarySlideUrl: String(formData.get("primarySlideUrl") ?? "").trim(),
		videoUrl: String(formData.get("videoUrl") ?? "").trim(),
		events,
		createdAt: String(formData.get("createdAt") ?? "").trim(),
		updatedAt: "",
	};

	await upsertTalk(talk);
	revalidatePath("/speaking");
	revalidatePath(`/speaking/${slug}`);
	revalidatePath("/admin");
	revalidatePath("/");
	redirect("/admin");
}

export async function removeTalk(formData: FormData) {
	if (!(await getSession())) redirect("/admin/login");
	const slug = String(formData.get("slug") ?? "").trim();
	if (slug) {
		await storeDelete(slug);
		revalidatePath("/speaking");
		revalidatePath("/admin");
		revalidatePath("/");
	}
	redirect("/admin");
}
