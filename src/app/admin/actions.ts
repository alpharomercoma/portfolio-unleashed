"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import {
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	checkPassword,
	signSession,
} from "@/lib/auth";
import { sendAdminAlert } from "@/lib/notify";
import { loginRateLimit } from "@/lib/ratelimit";
import { SITE_DOMAIN } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { parseLines } from "@/lib/utils";
import {
	type Talk,
	TYPES_WITHOUT_LEVEL,
	slugify,
	talkEventSchema,
} from "@/lib/talks/schema";
import {
	TALKS_TAG,
	deleteTalk as storeDelete,
	getTalk,
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
		await sendAdminAlert(`Blocked sign-in attempts on ${SITE_DOMAIN}`, [
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

	await sendAdminAlert(`Admin sign-in to ${SITE_DOMAIN}`, [
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

export async function saveTalk(formData: FormData) {
	if (!(await getSession())) redirect("/admin/login");

	const title = String(formData.get("title") ?? "").trim();
	// An existing talk submits its slug (hidden field); a new one derives it.
	const submittedSlug = String(formData.get("slug") ?? "").trim();
	const slug = submittedSlug || slugify(title);

	// Creating a new talk must not silently overwrite an existing one.
	if (!submittedSlug && (await getTalk(slug))) {
		redirect(
			`/admin/talks/new?error=${encodeURIComponent(
				`A talk with the slug "${slug}" already exists. Edit that one, or change the title.`,
			)}`,
		);
	}

	// Showcase image URL comes from the Blob-backed image picker (or is blank).
	const showcaseImage = String(formData.get("showcaseImage") ?? "").trim();

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
		tags: parseLines(formData.get("tags")),
		abstract: String(formData.get("abstract") ?? "").trim(),
		outline: parseLines(formData.get("outline")),
		keyTakeaways: parseLines(formData.get("keyTakeaways")),
		featured: formData.get("featured") === "on",
		status: formData.get("status") === "draft" ? "draft" : "published",
		showcaseImage,
		primarySlideUrl: String(formData.get("primarySlideUrl") ?? "").trim(),
		videoUrl: String(formData.get("videoUrl") ?? "").trim(),
		events,
		createdAt: String(formData.get("createdAt") ?? "").trim(),
		updatedAt: "",
	};

	try {
		await upsertTalk(talk);
	} catch (err) {
		// Schema validation (size caps, enums, slug format) rejected the input.
		// Surface a friendly message; never leak the raw issue list.
		if (err instanceof ZodError) {
			redirect(
				`/admin/talks/${slug || "new"}?error=${encodeURIComponent(
					"Some fields are invalid or too long. Please review and try again.",
				)}`,
			);
		}
		throw err;
	}
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
