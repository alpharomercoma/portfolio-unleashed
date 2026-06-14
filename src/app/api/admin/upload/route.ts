import { NextResponse } from "next/server";

import { uploadImageToBlob } from "@/lib/blob";
import { getSession } from "@/lib/session";

// Session-gated image upload for the admin markdown editor. Stores the file in
// Vercel Blob and returns its public URL for embedding as `![alt](url)`.
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

	try {
		const url = await uploadImageToBlob("about", file);
		return NextResponse.json({ url });
	} catch (error) {
		console.error("[upload] failed", error);
		return NextResponse.json(
			{ error: `Upload failed: ${(error as Error).message}` },
			{ status: 500 },
		);
	}
}
