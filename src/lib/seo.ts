// Single source of truth for the canonical site origin. Used by metadata,
// the sitemap/robots routes, and JSON-LD so they never drift apart.
export const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
	"https://alpharomer.com";

export const SITE_NAME = "Alpha Romer Coma";

// Profiles for Person JSON-LD `sameAs` (kept in sync with the footer links).
export const SOCIAL_LINKS = [
	"https://github.com/alpharomercoma",
	"https://linkedin.com/in/alpharomercoma",
	"https://youtube.com/@alpharomercoma",
];
