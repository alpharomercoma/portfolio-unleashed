// Client-only: downscale + recompress large images before upload so they stay
// safely under Vercel's ~4.5 MB function body limit (which rejects bigger
// requests with a 413 before they ever reach the route) and are sized for web
// display. Steps the dimension down until the encoded file is under the target,
// so even highly-detailed images fit. Returns the file unchanged when it's
// already small, isn't a re-encodable raster, or can't be decoded.

const TARGET_BYTES = 3_500_000; // comfortably under the 4 MB route / 4.5 MB platform cap
const SKIP_BELOW_BYTES = 1_000_000; // already small enough; don't recompress
const DIMENSION_STEPS = [2000, 1600, 1280, 1024, 800]; // longest-edge px, largest first
const ENCODE_TYPE = "image/webp";
const ENCODE_QUALITY = 0.85;

function encode(bitmap: ImageBitmap, maxDim: number): Promise<Blob | null> {
	const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return Promise.resolve(null);
	ctx.drawImage(bitmap, 0, 0, width, height);
	return new Promise((resolve) =>
		canvas.toBlob(resolve, ENCODE_TYPE, ENCODE_QUALITY),
	);
}

export async function downscaleImage(file: File): Promise<File> {
	// Only handle raster types a canvas can re-encode; pass SVG/GIF/etc. through.
	if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return file;
	if (file.size <= SKIP_BELOW_BYTES) return file;

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
	} catch {
		return file; // can't decode here — let the server/platform limit handle it
	}

	try {
		const name = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
		let smallest: File = file;
		for (const dim of DIMENSION_STEPS) {
			const blob = await encode(bitmap, dim);
			if (!blob) continue;
			if (blob.size < smallest.size) {
				smallest = new File([blob], name, { type: ENCODE_TYPE });
			}
			// Stop as soon as we're safely under the cap (normal photos hit this
			// on the first, largest step).
			if (blob.size <= TARGET_BYTES) {
				return new File([blob], name, { type: ENCODE_TYPE });
			}
		}
		// Nothing got under the target (e.g. pathological noise): return the
		// smallest we produced; the route still surfaces a friendly 413/size error.
		return smallest;
	} finally {
		bitmap.close?.();
	}
}
