import fc from "fast-check";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Markdown } from "@/components/markdown";
import {
	isSafeImage,
	isSafeLink,
	line,
	markdown,
	markdownIssues,
	multiline,
	parseWebUrl,
} from "@/lib/agent/guards";
import { isAllowedImageHost } from "@/lib/image-hosts";
import { toEmbedUrl } from "@/lib/talks/embed";

const ORIGIN = "https://alpharomer.com";
const RUNS = { numRuns: 2000 };

// Pieces that tend to break URL handling, mixed with arbitrary unicode.
const urlish = fc.oneof(
	fc.string({ unit: "grapheme", maxLength: 60 }),
	fc
		.tuple(
			fc.constantFrom(
				"",
				"/",
				"//",
				"/\\",
				"\\\\",
				"http://",
				"https://",
				"HTTPS://",
				"javascript:",
				"JaVaScRiPt:",
				"java\tscript:",
				" javascript:",
				"\u0000javascript:",
				"data:",
				"vbscript:",
				"file:",
				"mailto:",
				"%2f%2f",
				"/%2e%2e/",
				"/./",
			),
			fc.constantFrom(
				"",
				"evil.example",
				"user:pw@evil.example",
				"abc.public.blob.vercel-storage.com",
				"a.b.public.blob.vercel-storage.com",
				"cdn.sanity.io",
				"cdn.sanity.io.evil.example",
				"localhost",
				"[::1]",
				"127.0.0.1",
			),
			fc.constantFrom(
				"",
				"/",
				"/a.png",
				"/../x.png",
				"/%2e%2e/x.png",
				"?q=1",
				"#h",
			),
			fc.string({ maxLength: 10 }),
		)
		.map((parts) => parts.join("")),
);

describe("link and image guards (fuzz)", () => {
	it("accepted links resolve to this site or to http(s)", () => {
		fc.assert(
			fc.property(urlish, (s) => {
				if (!isSafeLink(s)) return;
				const resolved = new URL(s, ORIGIN);
				expect(["http:", "https:"]).toContain(resolved.protocol);
				expect(resolved.username + resolved.password).toBe("");
				if (s.startsWith("/")) expect(resolved.origin).toBe(ORIGIN);
				expect(s).not.toMatch(/\s/);
			}),
			RUNS,
		);
	});

	it("accepted images are /public files on this site or https on an allowed host", () => {
		fc.assert(
			fc.property(urlish, fc.boolean(), (s, bare) => {
				if (!isSafeImage(s, { bare })) return;
				const resolved = new URL(s, `${ORIGIN}/awards/`);
				if (/^https?:/i.test(s)) {
					expect(resolved.protocol).toBe("https:");
					expect(isAllowedImageHost(resolved.hostname)).toBe(true);
				} else {
					expect(resolved.origin).toBe(ORIGIN);
					// No normalization tricks: what is stored is what is fetched.
					if (s.startsWith("/")) expect(resolved.pathname).toBe(s);
					expect(resolved.pathname).not.toMatch(/\/\.\.?(\/|$)/);
				}
			}),
			RUNS,
		);
	});

	it("parseWebUrl never returns non-http(s) or credentialed URLs", () => {
		fc.assert(
			fc.property(urlish, (s) => {
				const u = parseWebUrl(s);
				if (!u) return;
				expect(["http:", "https:"]).toContain(u.protocol);
				expect(u.username + u.password).toBe("");
			}),
			RUNS,
		);
	});

	it("the slide embed only ever targets Google Slides or Canva over https", () => {
		fc.assert(
			fc.property(urlish, (s) => {
				const embed = toEmbedUrl(s);
				if (!embed) return;
				const u = new URL(embed);
				expect(u.protocol).toBe("https:");
				expect(["docs.google.com", "www.canva.com", "canva.com"]).toContain(
					u.hostname,
				);
			}),
			RUNS,
		);
		expect(toEmbedUrl("https://evil.example/?canva.com/design/x")).toBeNull();
		expect(
			toEmbedUrl("https://evil.example/docs.google.com/presentation/x"),
		).toBeNull();
		expect(
			toEmbedUrl("https://docs.google.com/presentation/d/abc/edit#slide=id.p"),
		).toBe("https://docs.google.com/presentation/d/abc/embed");
		expect(toEmbedUrl("https://www.canva.com/design/D/x/view")).toBe(
			"https://www.canva.com/design/D/x/view?embed",
		);
	});
});

const BAD_TEXT = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F؜‎‏‪-‮⁦-⁩﻿]/;

describe("text guards (fuzz)", () => {
	const anyText = fc.oneof(
		fc.string({ unit: "binary", maxLength: 80 }),
		fc.string({ unit: "grapheme", maxLength: 80 }),
		fc.string({
			unit: fc.constantFrom(
				"a",
				" ",
				"\n",
				"\r",
				"\t",
				"‮",
				"\u0000",
				"\ud800",
				"é",
				"é",
			),
			maxLength: 30,
		}),
	);

	it("single-line text is clean, trimmed, well-formed, and bounded", () => {
		const schema = line(40);
		fc.assert(
			fc.property(anyText, (s) => {
				const r = schema.safeParse(s);
				if (!r.success) return;
				expect(r.data).not.toMatch(BAD_TEXT);
				expect(r.data).not.toMatch(/[\n\r\t]/);
				expect(r.data).toBe(r.data.trim());
				expect(r.data.isWellFormed()).toBe(true);
				expect(r.data.length).toBeLessThanOrEqual(40);
				expect(r.data).toBe(r.data.normalize("NFC"));
			}),
			RUNS,
		);
	});

	it("multi-line text keeps only LF line breaks", () => {
		const schema = multiline(60);
		fc.assert(
			fc.property(anyText, (s) => {
				const r = schema.safeParse(s);
				if (!r.success) return;
				expect(r.data).not.toMatch(BAD_TEXT);
				expect(r.data).not.toContain("\r");
			}),
			RUNS,
		);
	});
});

// Markdown assembled from hostile fragments.
const mdFragment = fc.oneof(
	fc.string({ maxLength: 20 }),
	urlish.map((u) => `[t](${u})`),
	urlish.map((u) => `![a](${u})`),
	urlish.map((u) => `<${u}>`),
	urlish.map((u) => `[r]: ${u}\n\n[x][r]`),
	urlish.map((u) => `[x][r]\n\n[r]: ${u}`),
	fc.constantFrom(
		"<script>alert(1)</script>",
		"<img src=x onerror=alert(1)>",
		"<a href='javascript:alert(1)'>x</a>",
		"<!-- c -->",
		"```\n<script>\n```",
		"`<b>`",
		"www.example.com",
		"a@b.co",
		"[x](<javascript:alert(1)>)",
		"[x](java&#115;cript:alert(1))",
		"[x](java%73cript:alert(1))",
		"![x](https://abc.public.blob.vercel-storage.com/a.png)",
		"\n\n",
		"> quote",
		"| a | b |\n|---|---|\n| <i> | x |",
	),
);

/** Real elements in the rendered HTML (escaped text can't false-positive). */
function inspect(html: string) {
	const doc = new JSDOM(`<body>${html}</body>`).window.document;
	const all = [...doc.body.querySelectorAll("*")];
	return {
		tags: all.map((el) => el.tagName.toLowerCase()),
		handlers: all.flatMap((el) =>
			[...el.attributes].filter((a) => /^on/i.test(a.name)).map((a) => a.name),
		),
		hrefs: all.flatMap((el) =>
			el.hasAttribute("href") ? [el.getAttribute("href")!] : [],
		),
		srcs: all.flatMap((el) =>
			el.hasAttribute("src") ? [el.getAttribute("src")!] : [],
		),
	};
}

describe("markdown guard (fuzz)", () => {
	it("never throws, and whatever it accepts renders without unsafe URLs or HTML", () => {
		let checkedHrefs = 0;
		let checkedSrcs = 0;
		let rejected = 0;
		fc.assert(
			fc.property(fc.array(mdFragment, { maxLength: 6 }), (parts) => {
				const md = parts.join(" ");
				const issues = markdownIssues(md);
				if (issues.length) {
					rejected++;
					return;
				}
				const html = renderToStaticMarkup(createElement(Markdown, null, md));
				const dom = inspect(html);
				for (const tag of [
					"script",
					"iframe",
					"object",
					"embed",
					"style",
					"svg",
					"form",
				]) {
					expect(dom.tags).not.toContain(tag);
				}
				expect(dom.handlers).toEqual([]);
				for (const href of dom.hrefs) {
					const ok =
						href.startsWith("#") || /^mailto:/i.test(href) || isSafeLink(href);
					expect(ok, href).toBe(true);
					checkedHrefs++;
				}
				for (const src of dom.srcs) {
					expect(isSafeImage(src), src).toBe(true);
					checkedSrcs++;
				}
			}),
			{ numRuns: 4000 },
		);
		// The oracle must actually have seen both outcomes.
		expect(checkedHrefs).toBeGreaterThan(100);
		expect(checkedSrcs).toBeGreaterThan(5);
		expect(rejected).toBeGreaterThan(100);
	});

	it("handles worst-case 20k documents without overflowing or stalling", () => {
		const cases: Record<string, string> = {
			quotes: "> ".repeat(9999) + "x",
			lists: "- ".repeat(9999) + "x",
			numbered: "1. ".repeat(6666),
			indent: Array.from(
				{ length: 300 },
				(_, i) => " ".repeat(i * 2) + "- x",
			).join("\n"),
			maxNesting: Array.from({ length: 1000 }, () => "> > > > > > > > x").join(
				"\n",
			),
			brackets: "[".repeat(10000) + "]".repeat(9999),
			links: "[a](b) ".repeat(2800),
			emph: "*a_".repeat(6600),
			backticks: "`".repeat(19999),
			refs: Array.from({ length: 1500 }, (_, i) => `[r${i}]: /x`).join("\n"),
			table: "|a".repeat(5000) + "|\n" + "|-".repeat(5000) + "|",
			autolinks: "www.a.co ".repeat(2200),
			html: "<a ".repeat(6000),
			tightQuotes: ">".repeat(19999) + "x",
			tightQuotesAtLimit: ">".repeat(8) + "x",
			mixedTight: ">-".repeat(5000),
			quoteListAlternating: "> 1. ".repeat(4000),
			emphasisNest: "*".repeat(700) + "x" + "*".repeat(700),
			underscoreNest: "_".repeat(700) + "x" + "_".repeat(700),
			strikeNest: "~~".repeat(350) + "x" + "~~".repeat(350),
			lazyQuotes: Array.from({ length: 2000 }, () => "> > > > > > > >").join(
				"\n",
			),
		};
		const start = performance.now();
		for (const [name, doc] of Object.entries(cases)) {
			const t = performance.now();
			const md = doc.slice(0, 20_000);
			let issues: string[] = [];
			expect(() => (issues = markdownIssues(md)), name).not.toThrow();
			expect(performance.now() - t, name).toBeLessThan(3000);
			// Whatever passes must also render on the public page.
			if (issues.length === 0) {
				expect(
					() => renderToStaticMarkup(createElement(Markdown, null, md)),
					`${name} renders`,
				).not.toThrow();
			}
		}
		expect(markdownIssues("> ".repeat(9999) + "x")[0]).toMatch(
			/nested too deeply/,
		);
		expect(performance.now() - start).toBeLessThan(8000);
	});

	it("does not parse markdown longer than the field allows", () => {
		const t = performance.now();
		const r = markdown(20_000).safeParse("> ".repeat(100_000) + "x");
		expect(r.success).toBe(false);
		expect(performance.now() - t).toBeLessThan(500);
	});
});
