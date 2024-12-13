import { WithPWA } from "next-pwa";
import nextPWA from "next-pwa";

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
	// https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps#8-securing-your-application
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
				],
			},
			{
				source: "/sw.js",
				headers: [
					{
						key: "Content-Type",
						value: "application/javascript; charset=utf-8",
					},
					{
						key: "Cache-Control",
						value: "no-cache, no-store, must-revalidate",
					},
					{
						key: "Content-Security-Policy",
						value: "default-src 'self'; script-src 'self'",
					},
				],
			},
		];
	},
};

export default withPWA(config);
