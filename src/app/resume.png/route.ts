import { serveResumeAsset } from "@/lib/resume";

// ISR: re-fetch the latest resume release at most hourly.
export const revalidate = 3600;

export function GET() {
	return serveResumeAsset("png", "image/png");
}
