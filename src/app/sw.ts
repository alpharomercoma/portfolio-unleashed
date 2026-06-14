/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type {
	PrecacheEntry,
	RuntimeCaching,
	SerwistGlobalConfig,
} from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		// Replaced at build time with the precache manifest (injectionPoint).
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}

declare const self: ServiceWorkerGlobalScope;

// Admin, the API, and the Sanity Studio must always hit the network — never
// serve a cached (stale) admin page or API response.
const networkOnly: RuntimeCaching = {
	matcher: ({ url, sameOrigin }) =>
		sameOrigin && /^\/(admin|api|studio)(\/|$)/.test(url.pathname),
	handler: new NetworkOnly(),
};

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: [networkOnly, ...defaultCache],
	fallbacks: {
		entries: [
			{
				// Served when a document navigation fails while offline.
				url: "/offline",
				matcher({ request }) {
					return request.destination === "document";
				},
			},
		],
	},
});

serwist.addEventListeners();
