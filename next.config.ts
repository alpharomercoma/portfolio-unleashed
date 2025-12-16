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
		],
	},
	// Empty turbopack config to silence webpack/turbopack conflict warning
	turbopack: {},
} satisfies NextConfig;

export default withPWA(config);
