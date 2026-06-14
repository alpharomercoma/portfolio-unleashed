import "server-only";

import { put } from "@vercel/blob";

// Uploads an image to the public Blob store and returns its public CDN URL for
// embedding (in markdown, or as a talk cover). addRandomSuffix keeps every
// pathname unique so the URL is effectively immutable.
export async function uploadImageToBlob(
	prefix: string,
	file: File,
): Promise<string> {
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
	const blob = await put(`${prefix}/${Date.now()}-${safeName}`, file, {
		access: "public",
		addRandomSuffix: true,
	});
	return blob.url;
}
