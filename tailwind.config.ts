import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

export default {
	content: [
		"./src/**/*.{ts,tsx,js,jsx,mdx}",
		"./app/**/*.{ts,tsx,js,jsx,mdx}",
		"./sanity/**/*.{ts,tsx,js,jsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-inter)"],
			},
		},
	},
	future: {
		hoverOnlyWhenSupported: true,
	},
	plugins: [typography],
} satisfies Config;
