import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { z } from "zod";

import { isAllowedImageHost } from "@/lib/image-hosts";

// Field-level guardrails for content written by agents. The store schemas stay
// as they are (they also have to accept legacy records); these stricter rules
// apply only to values an agent sends.

// C0/C1 control characters other than tab and newline.
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/;
// Bidirectional overrides/isolates and marks: they can make text render in a
// different order than it is stored ("Trojan Source" style spoofing).
const BIDI_CHARS = /[؜‎‏‪-‮⁦-⁩]/;
// Byte-order mark / zero-width no-break space: invisible, never intended.
const BOM = /﻿/;

function textIssue(s: string, multiline: boolean): string | null {
	if (!s.isWellFormed()) return "contains an unpaired surrogate";
	if (CONTROL_CHARS.test(s)) return "contains control characters";
	if (BIDI_CHARS.test(s)) return "contains bidirectional control characters";
	if (BOM.test(s)) return "contains a byte-order mark";
	if (!multiline && /[\n\t]/.test(s)) return "must be a single line";
	return null;
}

type TextOpts = { min?: number };

/** One line of plain text: trimmed, NFC-normalized, no control characters. */
export function line(max: number, { min = 0 }: TextOpts = {}) {
	return z
		.string()
		.trim()
		.normalize("NFC")
		.min(min)
		.max(max)
		.superRefine((s, ctx) => {
			const issue = textIssue(s, false);
			if (issue) ctx.addIssue({ code: "custom", message: issue });
		});
}

/** Multi-line plain text. CRLF/CR line endings are normalized to LF. */
export function multiline(max: number, { min = 0 }: TextOpts = {}) {
	return z
		.string()
		.overwrite((s) => s.replace(/\r\n?/g, "\n"))
		.trim()
		.normalize("NFC")
		.min(min)
		.max(max)
		.superRefine((s, ctx) => {
			const issue = textIssue(s, true);
			if (issue) ctx.addIssue({ code: "custom", message: issue });
		});
}

/** A list of distinct single-line strings. */
export function lineList(maxItems: number, maxLen: number) {
	return z
		.array(line(maxLen, { min: 1 }))
		.max(maxItems)
		.superRefine((items, ctx) => {
			const seen = new Set<string>();
			for (const item of items) {
				const k = item.toLowerCase();
				if (seen.has(k)) {
					ctx.addIssue({
						code: "custom",
						message: `duplicate entry "${item}"`,
					});
					return;
				}
				seen.add(k);
			}
		});
}

/** Record ids and slugs: lowercase letters, digits, inner dashes; ≤ 80 chars. */
export const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
export const agentId = z
	.string()
	.regex(
		ID_PATTERN,
		"lowercase letters, numbers, and inner dashes only (max 80)",
	);

export function isValidId(id: string): boolean {
	return ID_PATTERN.test(id);
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar date "YYYY-MM-DD" between 1900 and 2100. */
export function isIsoDate(s: string): boolean {
	const m = ISO_DATE.exec(s);
	if (!m) return false;
	const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
	if (y < 1900 || y > 2100) return false;
	const dt = new Date(Date.UTC(y, mo - 1, d));
	return dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export const isoDate = z
	.string()
	.refine(isIsoDate, "must be a real date formatted YYYY-MM-DD");
export const optionalIsoDate = z
	.string()
	.refine((s) => s === "" || isIsoDate(s), 'must be "" or a date YYYY-MM-DD');
export const optionalYear = z
	.string()
	.refine(
		(s) => s === "" || (/^\d{4}$/.test(s) && +s >= 1900 && +s <= 2100),
		'must be "" or a four-digit year',
	);

const MAX_URL = 2000;

/** Absolute http(s) URL with a dotted host and no embedded credentials. */
/**
 * Shared syntax gate for anything used as a URL. Unpaired surrogates and broken
 * %-escapes make encodeURI/decodeURI throw (next/image's loader calls them at
 * render time, so one bad value would crash the page). Backslashes are
 * rejected because parsers disagree on them: WHATWG URL reads a backslash as
 * "/" in http(s) URLs, while markdown renders it as %5C, so the URL that was
 * validated would not be the one that ships.
 */
function urlSyntaxOk(s: string): boolean {
	if (s.length > MAX_URL || !s.isWellFormed()) return false;
	if (/[\s\\]/.test(s) || CONTROL_CHARS.test(s)) return false;
	try {
		decodeURI(s);
		return true;
	} catch {
		return false;
	}
}

export function parseWebUrl(s: string): URL | null {
	if (!urlSyntaxOk(s)) return null;
	let u: URL;
	try {
		u = new URL(s);
	} catch {
		return null;
	}
	if (u.protocol !== "http:" && u.protocol !== "https:") return null;
	if (u.username || u.password) return null;
	if (!u.hostname.includes(".") || u.hostname.endsWith(".")) return null;
	return u;
}

// A path on this site: one leading slash (not "//" or "/\", which browsers treat
// as a protocol-relative URL to another host) and no whitespace or backslashes.
const SITE_PATH = /^\/(?![/\\])[^\s\\]*$/;

/** Site-relative path ("/speaking") or absolute http(s) URL. */
export function isSafeLink(s: string): boolean {
	if (!urlSyntaxOk(s)) return false;
	return SITE_PATH.test(s) || parseWebUrl(s) !== null;
}

export const webUrlOrEmpty = z
	.string()
	.trim()
	.refine(
		(s) => s === "" || parseWebUrl(s) !== null,
		'must be "" or an absolute http(s) URL without credentials',
	);

export const linkOrEmpty = z
	.string()
	.trim()
	.refine(
		(s) => s === "" || isSafeLink(s),
		'must be "", a site path like "/speaking", or an absolute http(s) URL',
	);

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
const LOCAL_IMAGE = /^\/(?![/\\])[A-Za-z0-9._~/-]+$/;
const BARE_IMAGE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/;

/**
 * Image reference. Accepts an https URL on an allowed image host, or a path to
 * an image under /public. With `bare`, also a file name resolved by the section
 * against its own asset folder (e.g. "aws.png" → /certification/logo/aws.png).
 */
export function isSafeImage(s: string, { bare = false } = {}): boolean {
	if (!urlSyntaxOk(s)) return false;
	if (s.startsWith("/")) {
		return (
			LOCAL_IMAGE.test(s) &&
			IMAGE_EXT.test(s) &&
			!s.split("/").some((seg) => seg === "." || seg === "..") &&
			!s.includes("//")
		);
	}
	if (bare && BARE_IMAGE.test(s) && IMAGE_EXT.test(s) && !s.includes("..")) {
		return true;
	}
	const u = parseWebUrl(s);
	return (
		u !== null && u.protocol === "https:" && isAllowedImageHost(u.hostname)
	);
}

export function imageOrEmpty({ bare = false, remoteOnly = false } = {}) {
	return z
		.string()
		.trim()
		.refine(
			(s) =>
				s === "" ||
				(remoteOnly
					? /^https:/i.test(s) && isSafeImage(s)
					: isSafeImage(s, { bare })),
			remoteOnly
				? 'must be "" or an https URL on an allowed image host'
				: bare
					? 'must be "", an image file name, a /public image path, or an https URL on an allowed image host'
					: 'must be "", a /public image path, or an https URL on an allowed image host',
		);
}

type MdNode = {
	type: string;
	url?: string;
	children?: MdNode[];
	position?: { start: { line: number } };
};

// Nesting limits checked before parsing: deeply nested blockquotes/lists make
// the markdown parser (and react-markdown on the public page) recurse until the
// stack overflows, and take seconds getting there.
const MAX_CONTAINERS_PER_LINE = 8;
// Width of the whole container prefix (markers plus the whitespace between and
// after them, tabs as 4): list nesting is made of indentation, which can sit
// after a ">" as well as at the start of the line.
const MAX_PREFIX_WIDTH = 40;
const CONTAINER_PREFIX =
	/^(?:[ \t]*(?:>|(?:[-*+]|\d{1,9}[.)])(?=[ \t]|$)))*[ \t]*/;
// A blockquote marker needs no space after it (">>>x" is three levels); a list
// marker does ("-x" is text).
const LEADING_CONTAINERS = /^(?:[ \t]*(?:>|(?:[-*+]|\d{1,9}[.)])(?=[ \t]|$)))+/;

// Delimiter-heavy input is the other slow path (bracket and emphasis matching
// is superlinear in the parser). Real pages use a few dozen of each.
const MAX_BRACKETS = 600;
const MAX_EMPHASIS_MARKS = 1500;

function count(s: string, re: RegExp): number {
	return s.match(re)?.length ?? 0;
}

export function costIssue(md: string): string | null {
	if (count(md, /\[/g) > MAX_BRACKETS) {
		return `too many "[" characters (max ${MAX_BRACKETS})`;
	}
	if (count(md, /[*_~]/g) > MAX_EMPHASIS_MARKS) {
		return `too many emphasis characters (* _ ~; max ${MAX_EMPHASIS_MARKS})`;
	}
	return null;
}

export function nestingIssue(md: string): string | null {
	const lines = md.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const prefix = CONTAINER_PREFIX.exec(line)![0];
		const width = prefix.replace(/\t/g, "    ").length;
		const lead = LEADING_CONTAINERS.exec(line)?.[0] ?? "";
		const containers = (lead.match(/>|[-*+]|\d{1,9}[.)]/g) ?? []).length;
		if (width > MAX_PREFIX_WIDTH || containers > MAX_CONTAINERS_PER_LINE) {
			return `quotes/lists are nested too deeply (line ${i + 1}; max ${MAX_CONTAINERS_PER_LINE} levels)`;
		}
	}
	return null;
}

/** Problems with agent-written markdown, or [] when it is safe to publish. */
export function markdownIssues(md: string): string[] {
	const precheck = costIssue(md) ?? nestingIssue(md);
	if (precheck) return [precheck];
	const issues: string[] = [];
	let tree: MdNode;
	try {
		tree = remark().use(remarkGfm).parse(md) as MdNode;
	} catch {
		// Never let a parser failure surface as a 500; treat it as unsafe input.
		return ["could not be parsed as markdown (too complex)"];
	}
	const where = (n: MdNode) =>
		n.position ? ` (line ${n.position.start.line})` : "";
	const check = (node: MdNode) => {
		if (node.type === "html") {
			issues.push(`raw HTML is not allowed${where(node)}`);
		} else if (node.type === "image" || node.type === "imageReference") {
			// Image references resolve through a definition, checked below as a link;
			// require direct images so every image URL is checked as an image.
			if (node.type === "imageReference" || !isSafeImage(node.url ?? "")) {
				issues.push(
					`images must use a /public path or an https URL on an allowed image host${where(node)}`,
				);
			}
		} else if (node.type === "link" || node.type === "definition") {
			const url = node.url ?? "";
			const ok =
				isSafeLink(url) ||
				/^#[\w-]*$/.test(url) ||
				/^mailto:[^\s@/]+@[^\s@/]+\.[^\s@/]+$/i.test(url);
			if (!ok) issues.push(`unsafe link "${url.slice(0, 80)}"${where(node)}`);
		}
	};
	// Iterative walk: no recursion depth to exhaust.
	const stack: MdNode[] = [tree];
	while (stack.length && issues.length < 20) {
		const node = stack.pop()!;
		check(node);
		if (node.children) stack.push(...[...node.children].reverse());
	}
	return issues;
}

export function markdown(max: number, opts: TextOpts = {}) {
	return multiline(max, opts).superRefine((s, ctx) => {
		// zod keeps running refinements after .max() fails; never parse an
		// oversized document (parse cost grows with size and nesting).
		if (s.length > max) return;
		for (const message of markdownIssues(s)) {
			ctx.addIssue({ code: "custom", message });
		}
	});
}
