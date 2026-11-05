import { readFileSync } from "node:fs";
import path from "node:path";

import { bundledThemes, codeToHtml } from "shiki";
import { describe, expect, it } from "vitest";

import { CODE_COLOR_REPLACEMENTS } from "@/app/blog/code-colors";

// Every colour pair the design system puts text or a chart on, against WCAG 2.2:
// 4.5:1 for text (1.4.3), 3:1 for chart marks and control boundaries (1.4.11).
const css = readFileSync(
	path.resolve(__dirname, "../../src/app/globals.css"),
	"utf8",
);
const root = /:root\s*\{([\s\S]*?)\n\}/.exec(css)![1];

function token(name: string): string {
	if (name === "white") return "#ffffff";
	const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\b`).exec(root);
	if (!m) throw new Error(`no token --${name}`);
	return m[1];
}

function luminance(hex: string): number {
	const channel = (i: number) => {
		const v = parseInt(hex.slice(i, i + 2), 16) / 255;
		return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

const TEXT: [string, string][] = [
	["foreground", "white"],
	["foreground", "brand-wash"],
	["foreground", "accent"],
	["muted-foreground", "white"],
	["muted-foreground", "brand-wash"],
	["muted-foreground", "accent"],
	["brand-strong", "white"],
	["brand-strong", "brand-wash"],
	["brand-strong", "accent"],
	["primary-foreground", "primary"],
	["primary-foreground", "brand-strong"],
	["white", "brand"],
	["on-brand", "brand"],
	["white", "ink"],
	["on-deep", "ink"],
	["white", "machines"],
	["white", "intelligence"],
	["ink", "white"],
	["destructive-foreground", "destructive"],
	["destructive", "white"],
];

const MARKS: [string, string][] = [
	["bar", "ink"],
	["bar-light", "white"],
	["brand", "white"],
	["input", "white"],
	["ring", "white"],
];

describe("design tokens meet WCAG AA", () => {
	it.each(TEXT)("text %s on %s is at least 4.5:1", (fg, bg) => {
		expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
	});

	it.each(MARKS)("mark %s on %s is at least 3:1", (fg, bg) => {
		expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(3);
	});
});

describe("syntax highlighting meets WCAG AA", () => {
	const ink = token("ink").toLowerCase();
	// The band behind a highlighted line: 5% white over ink (Code.module.css).
	const band =
		"#" +
		[1, 3, 5]
			.map((i) =>
				Math.round(parseInt(ink.slice(i, i + 2), 16) * 0.95 + 255 * 0.05)
					.toString(16)
					.padStart(2, "0"),
			)
			.join("");

	it("keeps the band the test assumes", () => {
		const moduleCss = readFileSync(
			path.resolve(__dirname, "../../src/app/blog/Code.module.css"),
			"utf8",
		);
		expect(moduleCss).toContain("bg-white/5");
	});

	it("lifts every token in the theme to 4.5:1 on both backgrounds", async () => {
		const { default: theme } = (await bundledThemes["dark-plus"]()) as {
			default: { tokenColors?: { settings?: { foreground?: string } }[] };
		};
		const colors = (theme.tokenColors ?? []).flatMap((t) =>
			t.settings?.foreground ? [t.settings.foreground.toLowerCase()] : [],
		);
		expect(colors.length).toBeGreaterThan(5);
		for (const raw of colors) {
			const color = CODE_COLOR_REPLACEMENTS[raw] ?? raw;
			expect(contrast(color, ink), `${raw} on ink`).toBeGreaterThanOrEqual(4.5);
			expect(contrast(color, band), `${raw} on band`).toBeGreaterThanOrEqual(
				4.5,
			);
		}
	});

	it("applies the replacements to the rendered code", async () => {
		const html = await codeToHtml("<a href='x'>y</a>", {
			lang: "html",
			theme: "dark-plus",
			colorReplacements: CODE_COLOR_REPLACEMENTS,
		});
		expect(html.toLowerCase()).not.toContain("#808080");
		expect(html.toLowerCase()).toContain("#9a9ab0");
	});
});
