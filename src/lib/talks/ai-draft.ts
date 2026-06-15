import "server-only";

import { lookup } from "node:dns/promises";

import { SITE_URL } from "@/lib/seo";
import { type TalkDraft } from "./draft-schema";
import { getDrafter } from "./drafters";

export type { TalkDraft } from "./draft-schema";

const SLIDES_RE = /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/;
const CANVA_RE = /canva\.com\/design\//i;

const PREFLIGHT_UA = `Mozilla/5.0 (compatible; alpharomer-admin/1.0; +${SITE_URL})`;

// True for loopback, private, link-local (incl. cloud metadata 169.254.169.254),
// CGNAT, and IPv6 equivalents. Used to keep the pre-flight fetch from being turned
// into a server-side request to internal infrastructure (SSRF).
function isPrivateAddress(ip: string): boolean {
	const v4 = ip.toLowerCase().startsWith("::ffff:")
		? ip.slice(ip.lastIndexOf(":") + 1)
		: ip;
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v4)) {
		const [a, b] = v4.split(".").map(Number);
		if ([a, b].some((n) => Number.isNaN(n) || n > 255)) return true;
		if (a === 0 || a === 10 || a === 127) return true; // unspecified, private, loopback
		if (a === 169 && b === 254) return true; // link-local + cloud metadata
		if (a === 172 && b >= 16 && b <= 31) return true; // private
		if (a === 192 && b === 168) return true; // private
		if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
		return false;
	}
	const v6 = ip.toLowerCase();
	return (
		v6 === "::1" ||
		v6 === "::" ||
		v6.startsWith("fe80") || // link-local
		v6.startsWith("fc") || // unique-local
		v6.startsWith("fd")
	);
}

// Require https and verify the host resolves only to public addresses before we
// fetch it. Errors are deliberately generic so we don't probe internal services.
async function assertPublicHost(url: URL): Promise<void> {
	if (url.protocol !== "https:") {
		throw new Error("Use an https link.");
	}
	let addresses: { address: string }[];
	try {
		addresses = await lookup(url.hostname, { all: true });
	} catch {
		throw new Error("Couldn't resolve that link's host.");
	}
	if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
		throw new Error("That link points somewhere that isn't allowed.");
	}
}

// Confirm a deck URL is a publicly reachable PDF before handing it to Mistral, so
// the admin gets a friendly error instead of a raw model failure. Redirects are
// followed manually and each hop is re-validated (a public URL can 30x to an
// internal one). We read headers only and cancel the body, never downloading the
// deck. Messages stay generic so arbitrary URLs can't be used to probe upstreams.
async function assertPublicPdf(
	initialUrl: string,
	shareHint: string,
): Promise<void> {
	let current: URL;
	try {
		current = new URL(initialUrl);
	} catch {
		throw new Error("Enter a valid https link.");
	}

	for (let hop = 0; hop < 5; hop++) {
		await assertPublicHost(current);
		// Bound each hop and tear the connection down via abort once we have the
		// headers — never read/await the body. (Awaiting body.cancel() on a large
		// response can stall under the framework's instrumented fetch.) no-store
		// keeps the framework from buffering the body to cache it.
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 12_000);
		let status: number;
		let location: string | null;
		let contentType: string;
		try {
			const res = await fetch(current, {
				redirect: "manual",
				cache: "no-store",
				signal: controller.signal,
				headers: { "user-agent": PREFLIGHT_UA },
			});
			status = res.status;
			location = res.headers.get("location");
			contentType = res.headers.get("content-type") ?? "";
		} catch {
			throw new Error("Couldn't reach the deck. Check the link and try again.");
		} finally {
			controller.abort();
			clearTimeout(timer);
		}

		// Follow one redirect at a time, re-validating the destination host.
		if (status >= 300 && status < 400) {
			if (!location) throw new Error(`Couldn't access the deck. ${shareHint}`);
			current = new URL(location, current);
			continue;
		}
		if (status < 200 || status >= 300) {
			throw new Error(`Couldn't access the deck. ${shareHint}`);
		}
		// A non-PDF response means a sign-in/HTML page was served, so it isn't public.
		if (!contentType.includes("application/pdf")) {
			throw new Error(`That link isn't a public PDF. ${shareHint}`);
		}
		return;
	}
	throw new Error("That link redirected too many times.");
}

// Resolve a user-supplied deck link to a public PDF URL that Mistral can fetch.
// Google Slides exports cleanly to PDF; a direct PDF link works too. Canva
// actively blocks automated reads (both our server and Mistral's fetcher get
// 403/blocked), so we can't read it server-side — guide the user instead.
async function resolveDeckPdfUrl(input: string): Promise<string> {
	const raw = (input || "").trim();
	if (!raw) throw new Error("Paste a Google Slides or public PDF link first.");

	if (CANVA_RE.test(raw)) {
		throw new Error(
			"Canva blocks reading its links automatically. In Canva: File → Download → PDF (or Share → More → Google Slides), then paste that PDF or Slides link here.",
		);
	}

	const slides = raw.match(SLIDES_RE);
	if (slides) {
		const pdfUrl = `https://docs.google.com/presentation/d/${slides[1]}/export/pdf`;
		await assertPublicPdf(
			pdfUrl,
			'In Google Slides: Share → "Anyone with the link" → Viewer.',
		);
		return pdfUrl;
	}

	if (/^https?:\/\/\S+/i.test(raw)) {
		await assertPublicPdf(
			raw,
			"The link must point to a publicly accessible PDF.",
		);
		return raw;
	}

	throw new Error("Enter a Google Slides link or a public PDF URL.");
}

/**
 * Draft a talk's inferable fields from a public deck. Resolves and SSRF-checks the
 * link, then delegates to the configured provider (see `getDrafter`). Throws a
 * user-facing message on any failure.
 */
export async function draftFromSlides(slidesUrl: string): Promise<TalkDraft> {
	const pdfUrl = await resolveDeckPdfUrl(slidesUrl);
	return getDrafter().draft(pdfUrl);
}
