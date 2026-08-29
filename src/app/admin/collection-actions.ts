"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getCollection } from "@/lib/collections/registry";
import {
	collectionTag,
	getItem,
	removeItem,
	reorderItems,
	setItemHidden,
	upsertItem,
} from "@/lib/collections/store";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/session";
import { parseLines } from "@/lib/utils";

const log = createLogger("collections");

// The collection key travels in a hidden `collection` form field rather than a
// bound argument, so these are imported directly by the client form (mirroring
// the talks form) and used as `action={saveCollectionItem}`.
export async function saveCollectionItem(formData: FormData) {
	await requireAdmin();
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

	// A couple of fields are managed outside the item form, so they're never in
	// `formData` and must be carried over from the stored record on edit — otherwise
	// the schema defaults would silently reset them:
	//   • `order`  — reorderable collections drop the manual input (rewritten on drag);
	//                without this the missing value coerces to 0 and yanks the item up.
	//   • `hidden` — toggled by its own action; without this every save would unhide.
	if (existingId) {
		const needsOrder = cfg.reorderable && data.order == null;
		const needsHidden = data.hidden == null;
		if (needsOrder || needsHidden) {
			const existing = await getItem(key, existingId);
			if (needsOrder && existing?.order != null) data.order = existing.order;
			if (needsHidden && existing?.hidden != null)
				data.hidden = existing.hidden;
		}
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
	await requireAdmin();
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

// Hide or unhide a single item. `hidden` carries the target state ("true"/"false")
// so the button is a plain form submit with no client JS. Hidden items disappear
// from the public site but stay in admin, so this is a soft alternative to delete.
export async function toggleCollectionItemVisibility(formData: FormData) {
	await requireAdmin();
	const key = String(formData.get("collection") ?? "").trim();
	if (!getCollection(key)) redirect("/admin");
	const id = String(formData.get("id") ?? "").trim();
	if (id) {
		await setItemHidden(key, id, String(formData.get("hidden")) === "true");
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
	await requireAdmin();
	const cfg = getCollection(key);
	if (!cfg) return { ok: false, error: "Unknown collection" };
	if (!cfg.reorderable)
		return { ok: false, error: "This collection cannot be reordered" };

	try {
		await reorderItems(key, orderedIds);
	} catch (err) {
		log.error(`${key}: reorder failed`, err);
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
