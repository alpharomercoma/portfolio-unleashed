import { WithPWA } from "next-pwa";
import nextPWA from "next-pwa";
import { NextConfig } from "next";
const withPWA: WithPWA = nextPWA({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	register: true,
	skipWaiting: true,
	scope: "/",
	cacheId: "alpha",
	cleanupOutdatedCaches: true,
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
	// Empty turbopack config to silence webpack/turbopack conflict warning
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

export default withPWA(config);
