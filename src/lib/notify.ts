import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
// Use a verified-domain sender in prod (RESEND_FROM); falls back to Resend's
// shared test sender (which only delivers to the Resend account's own email).
const FROM = process.env.RESEND_FROM || "Alpha Admin <onboarding@resend.dev>";
const TO = process.env.ALERT_EMAIL || "alpharomercoma@proton.me";

function escapeHtml(s: string): string {
	return s.replace(
		/[&<>"']/g,
		(c) =>
			(
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				}) as Record<string, string>
			)[c],
	);
}

/**
 * Sends an admin security alert via Resend. Never throws (email failure must not
 * break sign-in) and no-ops with a warning when RESEND_API_KEY is absent.
 * Returns the Resend message id on success (useful for verification).
 */
export async function sendAdminAlert(
	subject: string,
	lines: string[],
): Promise<string | null> {
	if (!resend) {
		console.warn("[notify] RESEND_API_KEY not set; skipping alert:", subject);
		return null;
	}
	try {
		const text = lines.join("\n");
		const html = `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#111">${lines
			.map((l) => `<p style="margin:0 0 4px">${escapeHtml(l)}</p>`)
			.join("")}</div>`;
		const { data, error } = await resend.emails.send({
			from: FROM,
			to: TO,
			subject,
			text,
			html,
		});
		if (error) {
			console.error("[notify] resend error:", error.message);
			return null;
		}
		return data?.id ?? null;
	} catch (err) {
		console.error("[notify] send failed:", (err as Error).message);
		return null;
	}
}
