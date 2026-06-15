import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { createLogger } from "@/lib/logger";
import { getSession } from "@/lib/session";

// Media library backing the admin image picker. Lists and deletes images stored
// in the public Blob store under the "media/" prefix. Session-gated.
const PREFIX = "media/";
const log = createLogger("media");

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
		log.error("list failed", error);
		return NextResponse.json({
			images: [],
			error: "Couldn't load the library.",
		});
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
	// Confine deletion to our media library: a public Blob URL under "media/".
	// Without this, a client could pass any URL and delete arbitrary blobs.
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return NextResponse.json({ error: "Invalid url." }, { status: 400 });
	}
	if (
		!parsed.hostname.endsWith(".public.blob.vercel-storage.com") ||
		!parsed.pathname.startsWith(`/${PREFIX}`)
	) {
		return NextResponse.json(
			{ error: "Refusing to delete: not a media library image." },
			{ status: 400 },
		);
	}
	try {
		await del(url);
		return NextResponse.json({ ok: true });
	} catch (error) {
		log.error("delete failed", error);
		return NextResponse.json(
			{ error: "Couldn't delete the image. Please try again." },
			{ status: 500 },
		);
	}
}
