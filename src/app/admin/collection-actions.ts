"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getCollection } from "@/lib/collections/registry";
import { collectionTag, removeItem, upsertItem } from "@/lib/collections/store";
import { getSession } from "@/lib/session";

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
		data[field.name] = String(formData.get(field.name) ?? "").trim();
	}
	const existingId = String(formData.get("id") ?? "").trim();
	if (existingId) data.id = existingId;

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
