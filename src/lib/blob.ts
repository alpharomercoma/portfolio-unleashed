import "server-only";

import { put } from "@vercel/blob";

// Server-side upload guard. Vercel Functions cap bodies near 4.5 MB anyway, but
// we enforce an explicit limit so the rule is clear and centralized.
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

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
