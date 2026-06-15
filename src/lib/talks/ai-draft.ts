import "server-only";

import { lookup } from "node:dns/promises";

import { createMistral } from "@ai-sdk/mistral";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import { TALK_CATEGORIES, TALK_LEVELS, TALK_TYPES } from "./schema";

// The subset of a talk's fields that can be reasonably inferred from a slide
// deck. Events, durations, URLs, and images stay manual (the deck can't tell us
// where/when it was delivered). Constrained enums keep category/type/level valid.
const draftSchema = z.object({
	title: z.string().describe("The talk's title — concise and specific."),
	tagline: z
		.string()
		.describe("A single-sentence hook, ≤ 140 characters. Empty if unclear."),
	abstract: z
		.string()
		.describe("A 2–4 sentence abstract of what the talk covers."),
	outline: z
		.array(z.string())
		.describe("4–8 outline points, each a short phrase (the deck's sections)."),
	keyTakeaways: z
		.array(z.string())
		.describe("3–5 concrete things the audience should remember."),
	tags: z
		.array(z.string())
		.describe("3–8 short topic/technology keywords (e.g. 'PyTorch', 'LLMs')."),
	category: z.enum(TALK_CATEGORIES).describe("The single best-fit category."),
	type: z.enum(TALK_TYPES).describe("The session format."),
	level: z
		.enum(TALK_LEVELS)
		.nullable()
		.describe("Audience level, or null if a podcast / not applicable."),
});

export type TalkDraft = z.infer<typeof draftSchema>;

const PROMPT = `You are cataloging one of the speaker's own talks from the attached slide deck (PDF). Write a plain, factual draft of the talk's details.

Content:
- Use only what the slides actually show. Do not invent facts, names, numbers, or claims.
- If a field cannot be determined from the deck, return an empty string or empty array for it.
- title: the talk's title.
- tagline: one short sentence, or empty if the deck does not make one clear.
- abstract: three or four sentences on what the talk covers.
- outline: the deck's main sections, each a short phrase.
- keyTakeaways: the concrete things the audience leaves knowing.
- tags: short topic or technology keywords.
- Pick the single best-fit category and session type. Set level to null for a podcast or when it does not apply.

How to write it (important):
- Write the way a working engineer plainly describes their own talk. Clear and direct, never promotional.
- Never use em dashes or en dashes. Use a period or comma, or reword the sentence.
- Do not use marketing or AI-cliche words. Avoid words like: delve, dive, unlock, leverage, harness, robust, seamless, cutting-edge, game-changer, elevate, empower, realm, landscape, tapestry, testament, journey, embark, ecosystem, "in today's world", "fast-paced", "it's worth noting", "in conclusion".
- No hype and no filler adjectives. Prefer concrete nouns and simple verbs, and keep sentences short.`;

const SLIDES_RE = /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/;
const CANVA_RE = /canva\.com\/design\//i;

const PREFLIGHT_UA =
	"Mozilla/5.0 (compatible; alpharomer-admin/1.0; +https://alpharomer.com)";

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
		let res: Response;
		try {
			res = await fetch(current, {
				redirect: "manual",
				headers: { "user-agent": PREFLIGHT_UA },
			});
		} catch {
			throw new Error("Couldn't reach the deck. Check the link and try again.");
		}

		// Follow one redirect at a time, re-validating the destination host.
		if (res.status >= 300 && res.status < 400) {
			const location = res.headers.get("location");
			try {
				await res.body?.cancel();
			} catch {
				/* body may already be closed */
			}
			if (!location) throw new Error(`Couldn't access the deck. ${shareHint}`);
			current = new URL(location, current);
			continue;
		}

		const contentType = res.headers.get("content-type") ?? "";
		try {
			await res.body?.cancel();
		} catch {
			/* body may already be closed */
		}
		if (!res.ok) throw new Error(`Couldn't access the deck. ${shareHint}`);
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

function stripCodeFence(text: string): string {
	return text
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/i, "")
		.trim();
}

/**
 * Draft a talk's inferable fields from a public Google Slides deck using Mistral's
 * document understanding. Throws a user-facing message on any failure.
 */
export async function draftFromSlides(slidesUrl: string): Promise<TalkDraft> {
	const apiKey = process.env.MISTRAL_API_KEY;
	if (!apiKey) {
		throw new Error("AI drafting isn't configured (missing MISTRAL_API_KEY).");
	}

	const pdfUrl = await resolveDeckPdfUrl(slidesUrl);

	const mistral = createMistral({ apiKey });
	const model = mistral("mistral-small-latest");
	const content = [
		{ type: "text" as const, text: PROMPT },
		{
			type: "file" as const,
			data: new URL(pdfUrl),
			mediaType: "application/pdf",
		},
	];
	const providerOptions = { mistral: { documentPageLimit: 80 } };

	try {
		const { object } = await generateObject({
			model,
			schema: draftSchema,
			messages: [{ role: "user", content }],
			providerOptions,
		});
		return object;
	} catch {
		// Some Mistral document models reject json_schema structured mode; fall back
		// to free-text JSON and validate it ourselves.
		const { text } = await generateText({
			model,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text" as const,
							text: `${PROMPT}\n\nReturn ONLY a JSON object with keys: title, tagline, abstract, outline (string[]), keyTakeaways (string[]), tags (string[]), category, type, level (string or null). No prose, no code fence.`,
						},
						content[1],
					],
				},
			],
			providerOptions,
		});
		let parsed: unknown;
		try {
			parsed = JSON.parse(stripCodeFence(text));
		} catch {
			throw new Error("The AI response couldn't be parsed. Please try again.");
		}
		return draftSchema.parse(parsed);
	}
}
