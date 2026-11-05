"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getCollection } from "@/lib/collections/registry";
import { WriteConflictError } from "@/lib/content/revisions";
import {
	collectionTag,
	getItemForEdit,
	listItemsVersioned,
	removeItem,
	reorderItems,
	setItemHidden,
	upsertItem,
} from "@/lib/collections/store";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/session";
import { editPreconditions, parseLines, parseRev } from "@/lib/utils";

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
	// Read them from the store itself, not the cache: a cached copy can predate
	// another writer's change (e.g. an agent hiding the item), and the revision
	// check below would then let the stale value win.
	if (existingId) {
		const needsOrder = cfg.reorderable && data.order == null;
		const needsHidden = data.hidden == null;
		if (needsOrder || needsHidden) {
			const existing = (await getItemForEdit(key, existingId))?.item;
			if (needsOrder && existing?.order != null) data.order = existing.order;
			if (needsHidden && existing?.hidden != null)
				data.hidden = existing.hidden;
		}
	}

	try {
		// New items go last, as they do for agents; 0 would put them ahead of everything.
		if (!existingId && cfg.reorderable && data.order == null) {
			const rows = await listItemsVersioned(key);
			data.order =
				rows.reduce(
					(max, r) =>
						Math.max(max, Number((r.value as { order?: unknown })?.order) || 0),
					0,
				) + 10;
		}
		await upsertItem(
			key,
			data,
			existingId ? editPreconditions(formData) : { mustExist: false },
		);
	} catch (err) {
		const where = existingId ? `${existingId}` : "new";
		const message =
			err instanceof WriteConflictError
				? err.reason === "exists"
					? `An item with this id already exists. Edit that one, or change the ${cfg.fields[0]?.label.toLowerCase() ?? "title"}.`
					: "This item changed since you opened it (another tab, or an agent). Reload to see the latest version, then reapply your edits."
				: (err as Error).message;
		redirect(`/admin/${key}/${where}?error=${encodeURIComponent(message)}`);
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
		try {
			// The row carries the revision it was listed at: never delete a newer
			// version than the one the owner looked at.
			await removeItem(key, id, {
				keepIndexNonEmpty: true,
				expectedRev: parseRev(formData.get("rev")),
			});
		} catch (err) {
			if (!(err instanceof WriteConflictError)) throw err;
			if (err.reason === "conflict") {
				redirect(
					`/admin/${key}?error=${encodeURIComponent("That item changed since this list loaded (another tab, or an agent). Review it, then try again.")}`,
				);
			}
			if (err.reason === "last") {
				redirect(
					`/admin/${key}?error=${encodeURIComponent("Can't delete the last one: an empty section makes the site fall back to the original seed content. Hide it instead.")}`,
				);
			}
			// Otherwise it's already gone (a double submit, or deleted elsewhere).
		}
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
		try {
			await setItemHidden(key, id, String(formData.get("hidden")) === "true", {
				expectedRev: parseRev(formData.get("rev")),
			});
		} catch (err) {
			if (!(err instanceof WriteConflictError)) throw err;
			redirect(
				`/admin/${key}?error=${encodeURIComponent("That item changed since this list loaded (another tab, or an agent). Review it, then try again.")}`,
			);
		}
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
	// Revisions the list was rendered with; a concurrent change fails the drag.
	expectedRevs?: Record<string, number>,
): Promise<
	{ ok: true; revs: Record<string, number> } | { ok: false; error: string }
> {
	await requireAdmin();
	const cfg = getCollection(key);
	if (!cfg) return { ok: false, error: "Unknown collection" };
	if (!cfg.reorderable)
		return { ok: false, error: "This collection cannot be reordered" };
	// The list must say which revision of every item it showed; otherwise the
	// drag could reorder content that changed since the page was rendered.
	if (
		!expectedRevs ||
		orderedIds.some((id) => !Object.hasOwn(expectedRevs, id))
	) {
		return {
			ok: false,
			error:
				"This list can't be reordered until its content is saved to the store. Reload the page and try again.",
		};
	}

	let revs: Record<string, number>;
	try {
		revs = await reorderItems(key, orderedIds, { expectedRevs });
	} catch (err) {
		if (err instanceof WriteConflictError) {
			return {
				ok: false,
				error:
					"The list changed while you were reordering. Reload and try again.",
			};
		}
		log.error(`${key}: reorder failed`, err);
		return {
			ok: false,
			error: "Couldn't save the new order. Please try again.",
		};
	}

	updateTag(collectionTag(key));
	revalidatePath("/");
	revalidatePath(`/admin/${key}`);
	return { ok: true, revs };
}
