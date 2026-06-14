import "server-only";

/**
 * Sanity read token, used for draft/preview content. Intentionally NOT required:
 * when it (or the project id) is absent, `sanityFetch` short-circuits to empty
 * results so the site still builds and runs without blog credentials.
 */
export const token = process.env.SANITY_API_READ_TOKEN;
