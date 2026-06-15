"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getCollection } from "@/lib/collections/registry";
import {
	collectionTag,
	getItem,
	removeItem,
	reorderItems,
	upsertItem,
} from "@/lib/collections/store";
import { getSession } from "@/lib/session";
import { parseLines } from "@/lib/utils";

// The collection key travels in a hidden `collection` form field rather than a
// bound argument, so these are imported directly by the client form (mirroring
// the talks form) and used as `action={saveCollectionItem}`.
export async function saveCollectionItem(formData: FormData) {
	if (!(await getSession())) redirect("/admin/login");
	const key = String(formData.get("collection") ?? "").trim();
	const cfg = getCollection(key);
	if (!cfg) redirect("/admin");

	const data: Record<string, unknown> = {};
	for (const field of cfg.fields) {
		const raw = String(formData.get(field.name) ?? "");
		// `list` fields are newline-separated textareas that become string arrays.
		data[field.name] = field.kind === "list" ? parseLines(raw) : raw.trim();
	}
	const existingId = String(formData.get("id") ?? "").trim();
	if (existingId) data.id = existingId;

	// Reorderable collections drop the manual `order` input from the form, so it
	// isn't in `data`. Without this, the zod `orderField` coerces the missing value
	// to 0 and the edit would yank the item to the top. Preserve the stored order.
	if (existingId && cfg.reorderable && data.order == null) {
		const existing = await getItem(key, existingId);
		if (existing?.order != null) data.order = existing.order;
	}

	try {
		await upsertItem(key, data);
	} catch (err) {
		const where = existingId ? `${existingId}` : "new";
		redirect(
			`/admin/${key}/${where}?error=${encodeURIComponent(
				(err as Error).message,
			)}`,
		);
	}

	updateTag(collectionTag(key));
	revalidatePath("/");
	revalidatePath(`/admin/${key}`);
	redirect(`/admin/${key}`);
}

export async function removeCollectionItem(formData: FormData) {
	if (!(await getSession())) redirect("/admin/login");
	const key = String(formData.get("collection") ?? "").trim();
	if (!getCollection(key)) redirect("/admin");
	const id = String(formData.get("id") ?? "").trim();
	if (id) {
		await removeItem(key, id);
		updateTag(collectionTag(key));
		revalidatePath("/");
		revalidatePath(`/admin/${key}`);
	}
	redirect(`/admin/${key}`);
}

// Typed action (not a FormData action): invoked from the SortableList client
// island after a drag. Persists the new order and revalidates; returns a result
// so the client can keep its optimistic state and show a subtle save indicator.
export async function reorderCollectionItems(
	key: string,
	orderedIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
	if (!(await getSession())) redirect("/admin/login");
	const cfg = getCollection(key);
	if (!cfg) return { ok: false, error: "Unknown collection" };
	if (!cfg.reorderable)
		return { ok: false, error: "This collection cannot be reordered" };

	try {
		await reorderItems(key, orderedIds);
	} catch (err) {
		console.error(`[collections:${key}] reorder failed`, err);
		return {
			ok: false,
			error: "Couldn't save the new order. Please try again.",
		};
	}

	updateTag(collectionTag(key));
	revalidatePath("/");
	revalidatePath(`/admin/${key}`);
	return { ok: true };
}
