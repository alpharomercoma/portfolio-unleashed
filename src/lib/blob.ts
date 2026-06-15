import "server-only";

import { put } from "@vercel/blob";

// Server-side upload guard. Kept just under Vercel's ~4.5 MB function body limit
// (which rejects bigger requests with a 413 before they reach the route) so a
// borderline file gets a clean JSON error here instead. Clients also downscale
// large images before upload (see src/lib/downscale-image.ts).
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

const startsWith = (b: Uint8Array, sig: number[], offset = 0) =>
	sig.every((v, i) => b[offset + i] === v);

// Verify the bytes are actually an image we accept. The client-supplied
// Content-Type is spoofable, so we check magic bytes (file signatures).
export function isSupportedImage(bytes: Uint8Array): boolean {
	if (bytes.length < 12) return false;
	return (
		startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
		startsWith(bytes, [0xff, 0xd8, 0xff]) || // JPEG
		startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) || // GIF87a/GIF89a
		(startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
			startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) || // "WEBP"
		startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4) // HEIF/AVIF "ftyp" box
	);
}

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
