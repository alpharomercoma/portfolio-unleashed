"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { WriteConflictError } from "@/lib/content/revisions";
import { requireAdmin } from "@/lib/session";
import { editPreconditions, parseLines, parseRev } from "@/lib/utils";
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

const CONFLICT_MESSAGE =
	"This talk changed since you opened it (another tab, or an agent). Reload to see the latest version, then reapply your edits.";

export async function saveTalk(formData: FormData) {
	await requireAdmin();

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
		await upsertTalk(
			talk,
			submittedSlug ? editPreconditions(formData) : { mustExist: false },
		);
	} catch (err) {
		if (err instanceof WriteConflictError) {
			const message =
				err.reason === "exists"
					? `A talk with the slug "${slug}" already exists. Edit that one, or change the title.`
					: CONFLICT_MESSAGE;
			redirect(
				`/admin/talks/${submittedSlug || "new"}?error=${encodeURIComponent(message)}`,
			);
		}
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
	await requireAdmin();
	const slug = String(formData.get("slug") ?? "").trim();
	if (slug) {
		try {
			// The row carries the revision it was listed at: never delete a newer
			// version than the one the owner looked at.
			await storeDelete(slug, {
				keepIndexNonEmpty: true,
				expectedRev: parseRev(formData.get("rev")),
			});
		} catch (err) {
			if (!(err instanceof WriteConflictError)) throw err;
			if (err.reason === "conflict") {
				redirect(
					`/admin/talks?error=${encodeURIComponent("That talk changed since this list loaded (another tab, or an agent). Review it, then try again.")}`,
				);
			}
			if (err.reason === "last") {
				redirect(
					`/admin/talks?error=${encodeURIComponent("Can't delete the last one: an empty section makes the site fall back to the original seed content. Set it to draft instead.")}`,
				);
			}
			// Otherwise it's already gone (a double submit, or deleted elsewhere).
		}
		updateTag(TALKS_TAG);
		revalidatePath("/speaking");
		revalidatePath("/admin");
		revalidatePath("/admin/talks");
		revalidatePath("/");
	}
	redirect("/admin/talks");
}
