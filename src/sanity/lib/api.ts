/**
 * As this file is reused in several other files, try to keep it lean and small.
 * Importing other npm packages here could lead to needlessly increasing the client bundle size, or end up in a server-only function that don't need it.
 */

/**
 * see https://www.sanity.io/docs/api-versioning for how versioning works
 */
export const apiVersion =
	process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01";

/**
 * Sanity project id / dataset. These fall back to harmless placeholders so the
 * app (and the `sanity` CLI used by `typegen`) can build and run even when blog
 * credentials are absent. Without a real project id, blog fetches are skipped
 * (see `isSanityConfigured` in `./fetch`) and the blog renders empty states.
 */
export const projectId =
	process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

/**
 * Used to configure edit intent links, for Presentation Mode, as well as to configure where the Studio is mounted in the router.
 */
export const studioUrl = "/studio";
