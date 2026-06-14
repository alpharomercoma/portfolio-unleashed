import type { ClientPerspective, QueryParams } from "next-sanity";
import { draftMode } from "next/headers";

import { client } from "@/sanity/lib/client";
import { token } from "@/sanity/lib/token";

/**
 * Whether Sanity blog credentials are present. When false (local dev or a build
 * with no CMS configured), `sanityFetch` returns `null` instead of throwing, so
 * the site builds and renders blog empty-states gracefully.
 */
const isSanityConfigured = Boolean(
	process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && token,
);

/**
 * Used to fetch data in Server Components, it has built in support for handling Draft Mode and perspectives.
 * When using the "published" perspective then time-based revalidation is used, set to match the time-to-live on Sanity's API CDN (60 seconds)
 * and will also fetch from the CDN.
 * When using the "previewDrafts" perspective then the data is fetched from the live API and isn't cached, it will also fetch draft content that isn't published yet.
 */
export async function sanityFetch<const QueryString extends string>({
	query,
	params = {},
	perspective: _perspective,
	/**
	 * Stega embedded Content Source Maps are used by Visual Editing by both the Sanity Presentation Tool and Vercel Visual Editing.
	 * The Sanity Presentation Tool will enable Draft Mode when loading up the live preview, and we use it as a signal for when to embed source maps.
	 * When outside of the Sanity Studio we also support the Vercel Toolbar Visual Editing feature, which is only enabled in production when it's a Vercel Preview Deployment.
	 */
	stega: _stega,
}: {
	query: QueryString;
	params?: QueryParams | Promise<QueryParams>;
	perspective?: Omit<ClientPerspective, "raw">;
	stega?: boolean;
}) {
	// No credentials → no blog backend. Return null so callers render empty
	// states instead of the build/request crashing.
	if (!isSanityConfigured) {
		return null;
	}
	const perspective =
		_perspective || (await draftMode()).isEnabled
			? "previewDrafts"
			: "published";
	const stega =
		_stega ||
		perspective === "previewDrafts" ||
		process.env.VERCEL_ENV === "preview";
	try {
		if (perspective === "previewDrafts") {
			return await client.fetch(query, await params, {
				stega,
				perspective: "previewDrafts",
				// The token is required to fetch draft content
				token,
				// The `previewDrafts` perspective isn't available on the API CDN
				useCdn: false,
				// And we can't cache the responses as it would slow down the live preview experience
				next: { revalidate: 0 },
			});
		}
		return await client.fetch(query, await params, {
			stega,
			perspective: "published",
			// The `published` perspective is available on the API CDN
			useCdn: true,
			// Only enable Stega in production if it's a Vercel Preview Deployment, as the Vercel Toolbar supports Visual Editing
			// When using the `published` perspective we use time-based revalidation to match the time-to-live on Sanity's API CDN (60 seconds)
			next: { revalidate: 60 },
		});
	} catch (error) {
		// A misconfigured token, network failure, or unreachable project should
		// degrade to empty content rather than break the page or the build.
		console.warn("[sanity] fetch failed; returning empty result.", error);
		return null;
	}
}
