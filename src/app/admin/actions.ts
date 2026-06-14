"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	checkPassword,
	signSession,
} from "@/lib/auth";
import { uploadImageToBlob } from "@/lib/blob";
import { sendAdminAlert } from "@/lib/notify";
import { loginRateLimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";
import {
	type Talk,
	TYPES_WITHOUT_LEVEL,
	slugify,
	talkEventSchema,
} from "@/lib/talks/schema";
import {
	TALKS_TAG,
	deleteTalk as storeDelete,
	upsertTalk,
} from "@/lib/talks/store";

export async function login(formData: FormData) {
	const password = String(formData.get("password") ?? "");
	const next = String(formData.get("next") ?? "/admin");
	const safeNext = next.startsWith("/admin") ? next : "/admin";

	const h = await headers();
	const ip =
		(h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anonymous";
	const ua = h.get("user-agent") ?? "unknown";

	// Brute-force protection: block the IP after too many attempts.
	const { success } = await loginRateLimit(ip);
	if (!success) {
		await sendAdminAlert("Blocked sign-in attempts on alpharomer.com", [
			"Admin sign-in attempts were rate-limited (possible brute force).",
			`IP: ${ip}`,
			`User-Agent: ${ua}`,
			`Time: ${new Date().toISOString()}`,
		]);
		redirect(`/admin/login?error=rate&next=${encodeURIComponent(safeNext)}`);
	}

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

	await sendAdminAlert("Admin sign-in to alpharomer.com", [
		"A successful admin sign-in just occurred.",
		`IP: ${ip}`,
		`User-Agent: ${ua}`,
		`Time: ${new Date().toISOString()}`,
	]);

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
		showcaseImage = await uploadImageToBlob("talks", file);
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

	const type = (String(formData.get("type")) as Talk["type"]) || "Talk";
	const levelRaw = String(formData.get("level") ?? "").trim();
	// Podcasts (and any TYPES_WITHOUT_LEVEL) carry no level.
	const level =
		TYPES_WITHOUT_LEVEL.includes(type) || !levelRaw
			? undefined
			: (levelRaw as NonNullable<Talk["level"]>);

	const talk: Talk = {
		slug,
		title,
		tagline: String(formData.get("tagline") ?? "").trim(),
		type,
		category: String(formData.get("category") ?? "Community").trim(),
		level,
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
	updateTag(TALKS_TAG);
	revalidatePath("/speaking");
	revalidatePath(`/speaking/${slug}`);
	revalidatePath("/admin");
	revalidatePath("/");
	redirect("/admin/talks");
}

export async function removeTalk(formData: FormData) {
	if (!(await getSession())) redirect("/admin/login");
	const slug = String(formData.get("slug") ?? "").trim();
	if (slug) {
		await storeDelete(slug);
		updateTag(TALKS_TAG);
		revalidatePath("/speaking");
		revalidatePath("/admin");
		revalidatePath("/admin/talks");
		revalidatePath("/");
	}
	redirect("/admin/talks");
}
