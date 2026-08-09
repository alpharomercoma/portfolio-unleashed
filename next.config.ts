import withSerwistInit from "@serwist/next";
import { execFileSync } from "node:child_process";
import { NextConfig } from "next";

// A revision versions the precached offline page so a new deploy busts it.
let revision: string;
try {
	revision =
		process.env.VERCEL_GIT_COMMIT_SHA ||
		execFileSync("git", ["rev-parse", "HEAD"]).toString().trim();
} catch {
	revision = String(Date.now());
}

// Serwist service worker (offline support / installable PWA). Compiled by the
// webpack build (we build with `next build --webpack`); disabled in dev so it
// never touches Turbopack. See src/app/sw.ts for the worker itself.
const withSerwist = withSerwistInit({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
	disable: process.env.NODE_ENV !== "production",
	// The offline fallback document must be precached for the SW to serve it.
	additionalPrecacheEntries: [{ url: "/offline", revision }],
});

/** @type {import("next").NextConfig} */
const config = {
	experimental: {
		optimizePackageImports: ["react-icons", "lucide-react"],
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.sanity.io",
			},
			{
				protocol: "https",
				hostname: "*.public.blob.vercel-storage.com",
			},
		],
	},
	turbopack: {},
	// Baseline security headers on every response. No strict CSP: a nonce CSP
	// forces dynamic rendering (this site is static-first) and risks breaking the
	// Sanity Studio / PWA / inline JSON-LD.
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value:
							"camera=(), microphone=(), geolocation=(), browsing-topics=()",
					},
				],
			},
		];
	},
} satisfies NextConfig;

export default withSerwist(config);
