import { timingSafeEqual } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";

import { env } from "@/env";
import { createLogger } from "@/lib/logger";
import { RESUME_TAG } from "@/lib/resume";

const log = createLogger("resume");

function authorized(header: string | null, secret: string): boolean {
	const given = Buffer.from(header?.replace(/^Bearer\s+/i, "") ?? "");
	const expected = Buffer.from(secret);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

// Called by the alpharomercoma/resume release workflow right after it publishes,
// so /resume, /resume.pdf, and /resume.png show the new version immediately
// instead of waiting out their hourly refresh.
export async function POST(request: Request) {
	const secret = env.RESUME_REVALIDATE_SECRET;
	if (!secret) {
		return Response.json({ error: "not configured" }, { status: 501 });
	}
	if (!authorized(request.headers.get("authorization"), secret)) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	revalidateTag(RESUME_TAG, { expire: 0 });
	for (const path of ["/resume", "/resume.pdf", "/resume.png"]) {
		revalidatePath(path);
	}
	log.info("revalidated after a resume release");
	return Response.json({ revalidated: true });
}
