import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

import type { FieldConfig } from "./registry";

const IMAGE_RE = /\.(png|jpe?g|webp|svg|avif|gif)$/i;

/**
 * For each `image` field, list the files already in its /public subdirectory so
 * the admin form can offer them as suggestions (the Blob store is private, so
 * we pick existing assets rather than upload).
 */
export async function buildImageOptions(
	fields: FieldConfig[],
): Promise<Record<string, string[]>> {
	const out: Record<string, string[]> = {};
	for (const field of fields) {
		if (field.kind !== "image" || !field.imageDir) continue;
		try {
			const dir = path.join(process.cwd(), "public", field.imageDir);
			const files = (await readdir(dir))
				.filter((name) => IMAGE_RE.test(name))
				.sort();
			out[field.name] = files;
		} catch {
			out[field.name] = [];
		}
	}
	return out;
}
