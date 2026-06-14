import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";

// Media library backing the admin image picker. Lists and deletes images stored
// in the public Blob store under the "media/" prefix. Session-gated.
const PREFIX = "media/";

export async function GET() {
	if (!(await getSession())) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	if (!process.env.BLOB_READ_WRITE_TOKEN) {
		return NextResponse.json({ images: [] });
	}
	try {
		const { blobs } = await list({ prefix: PREFIX });
		const images = blobs
			.map((b) => ({
				url: b.url,
				pathname: b.pathname,
				size: b.size,
				uploadedAt: b.uploadedAt,
			}))
			.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
		return NextResponse.json({ images });
	} catch (error) {
		console.error("[media] list failed", error);
		return NextResponse.json({ images: [], error: (error as Error).message });
	}
}

export async function DELETE(req: Request) {
	if (!(await getSession())) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const { url } = (await req.json().catch(() => ({}))) as { url?: string };
	if (!url) {
		return NextResponse.json({ error: "No url provided." }, { status: 400 });
	}
	try {
		await del(url);
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 },
		);
	}
}
