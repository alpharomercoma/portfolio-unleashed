import { getCollection } from "@/lib/collections/registry";

// The admin sections in the SAME order they appear on the public site:
// Selected Work, Projects, Speaking/Talks, Recognition (Awards then
// Certifications), Recommendations, then the standalone About page. Talks and
// About are not collections, so they are interleaved explicitly. Both the admin
// nav (layout) and the hub render from this single source of truth.
export type AdminSectionKind = "talks" | "collection" | "about";

export type AdminSection = {
	key: string;
	label: string;
	href: string;
	kind: AdminSectionKind;
	description: string;
	unit: string;
};

function collectionSection(key: string): AdminSection {
	const cfg = getCollection(key);
	const label = cfg?.labelPlural ?? key;
	return {
		key,
		label,
		href: `/admin/${key}`,
		kind: "collection",
		description: cfg?.description ?? "",
		unit: label.toLowerCase(),
	};
}

const TALKS: AdminSection = {
	key: "talks",
	label: "Talks",
	href: "/admin/talks",
	kind: "talks",
	description: "Talks, workshops, keynotes, and podcasts with their events.",
	unit: "talks",
};

const ABOUT: AdminSection = {
	key: "about",
	label: "About",
	href: "/admin/about",
	kind: "about",
	description: "Your personal story, written in markdown with images.",
	unit: "about page",
};

export const ADMIN_SECTIONS: AdminSection[] = [
	collectionSection("selected-work"),
	collectionSection("projects"),
	TALKS,
	collectionSection("awards"),
	collectionSection("certifications"),
	collectionSection("recommendations"),
	ABOUT,
	collectionSection("gallery"),
];
