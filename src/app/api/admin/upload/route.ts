import { NextResponse } from "next/server";

import { uploadImageToBlob } from "@/lib/blob";
import { getSession } from "@/lib/session";

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
	if (!file.type.startsWith("image/")) {
		return NextResponse.json(
			{ error: "Only image files are allowed." },
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
		console.error("[upload] failed", error);
		return NextResponse.json(
			{ error: `Upload failed: ${(error as Error).message}` },
			{ status: 500 },
		);
	}
}
