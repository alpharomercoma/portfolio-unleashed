import { NextResponse } from "next/server";

import {
	MAX_IMAGE_BYTES,
	isSupportedImage,
	uploadImageToBlob,
} from "@/lib/blob";
import { createLogger } from "@/lib/logger";
import { getSession } from "@/lib/session";

const log = createLogger("upload");

// Session-gated image upload used by the markdown editor and the image picker.
// Stores the file in Vercel Blob (under the given folder, default "media") and
// returns its public URL.
export async function POST(req: Request) {
	if (!(await getSession())) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	if (!process.env.BLOB_READ_WRITE_TOKEN) {
		return NextResponse.json(
			{
				error:
					"Image uploads are not configured (missing BLOB_READ_WRITE_TOKEN).",
			},
			{ status: 500 },
		);
	}

	const form = await req.formData();
	const file = form.get("file");
	if (!(file instanceof File) || file.size === 0) {
		return NextResponse.json({ error: "No file provided." }, { status: 400 });
	}
	if (file.size > MAX_IMAGE_BYTES) {
		return NextResponse.json(
			{ error: "Image is too large (max 8 MB)." },
			{ status: 400 },
		);
	}
	// Don't trust the client Content-Type; verify real image bytes.
	const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
	if (!isSupportedImage(head)) {
		return NextResponse.json(
			{ error: "Unsupported file. Use a PNG, JPEG, GIF, WebP, or AVIF image." },
			{ status: 400 },
		);
	}

	const folder =
		String(form.get("folder") ?? "media").replace(/[^a-z0-9-]/gi, "") ||
		"media";

	try {
		const url = await uploadImageToBlob(folder, file);
		return NextResponse.json({ url });
	} catch (error) {
		log.error("upload failed", error);
		return NextResponse.json(
			{ error: "Upload failed. Please try again." },
			{ status: 500 },
		);
	}
}
