import type { z } from "zod";

import { slugify } from "@/lib/talks/schema";
import { byDateDesc } from "@/lib/utils";
import awardSeed from "../../../data/awards.seed.json";
import certSeed from "../../../data/certifications.seed.json";
import gallerySeed from "../../../data/gallery.seed.json";
import projectSeed from "../../../data/projects.seed.json";
import recommendationSeed from "../../../data/recommendations.seed.json";
import researchSeed from "../../../data/research.seed.json";
import selectedWorkSeed from "../../../data/selected-work.seed.json";
import {
	AWARD_CATEGORIES,
	type Award,
	type Certification,
	type GalleryImage,
	PROJECT_CATEGORIES,
	type Project,
	type Recommendation,
	type ResearchStudy,
	type SelectedWork,
	awardSchema,
	certificationSchema,
	galleryImageSchema,
	projectSchema,
	recommendationSchema,
	researchStudySchema,
	selectedWorkSchema,
} from "./schema";

// A single admin-managed content type. Adding a new section = add one entry to
// the registry below; the generic list, form, and store all read from this.
export type FieldKind =
	| "text"
	| "textarea"
	| "date"
	| "select"
	| "image"
	| "list";

export type FieldConfig = {
	name: string;
	label: string;
	kind: FieldKind;
	required?: boolean;
	options?: readonly string[]; // select
	help?: string;
	placeholder?: string;
	full?: boolean; // span the full form width
};

export type CollectionConfig<T extends { id: string } = { id: string }> = {
	key: string;
	labelSingular: string;
	labelPlural: string;
	description: string;
	schema: z.ZodType<T>;
	idFrom: (data: Partial<T>) => string;
	fields: FieldConfig[];
	sort: (items: T[]) => T[];
	summary: (item: T) => { title: string; meta: string };
	seed: T[];
	// When true, the admin list is a drag-to-reorder sortable list and the manual
	// `order` field is dropped from the form (order is rewritten on drop). Only set
	// on collections sorted by `order` first. This is config, not schema — the
	// `order: number` field stays in the data.
	reorderable?: boolean;
};

const certifications: CollectionConfig<Certification> = {
	key: "certifications",
	labelSingular: "Certification",
	labelPlural: "Certifications",
	description: "Cloud, ML, and security credentials shown in Certifications.",
	schema: certificationSchema,
	idFrom: (d) => slugify(d.title ?? ""),
	fields: [
		{ name: "title", label: "Title", kind: "text", required: true, full: true },
		{ name: "issuer", label: "Issuer", kind: "text", required: true },
		{ name: "date", label: "Date earned", kind: "date" },
		{
			name: "logo",
			label: "Logo",
			kind: "image",
			help: "Upload or choose from the image library.",
		},
		{
			name: "link",
			label: "Credential URL",
			kind: "text",
			full: true,
			placeholder: "https://...",
		},
	],
	sort: (items) => [...items].sort((a, b) => byDateDesc(a.date, b.date)),
	summary: (c) => ({ title: c.title, meta: `${c.issuer} · ${c.date}` }),
	seed: certSeed as Certification[],
};

const awards: CollectionConfig<Award> = {
	key: "awards",
	labelSingular: "Award",
	labelPlural: "Awards",
	description: "Honors and competition results shown in Certifications.",
	schema: awardSchema,
	idFrom: (d) => slugify(d.title ?? ""),
	fields: [
		{ name: "title", label: "Title", kind: "text", required: true, full: true },
		{
			name: "organization",
			label: "Organization",
			kind: "text",
			required: true,
		},
		{ name: "year", label: "Year", kind: "text", placeholder: "2025" },
		{
			name: "category",
			label: "Category",
			kind: "select",
			options: AWARD_CATEGORIES,
		},
		{
			name: "image",
			label: "Image",
			kind: "image",
			full: true,
			help: "Upload or choose from the image library.",
		},
		{ name: "context", label: "Context", kind: "textarea", full: true },
	],
	sort: (items) => [...items].sort((a, b) => byDateDesc(a.year, b.year)),
	summary: (a) => ({ title: a.title, meta: `${a.organization} · ${a.year}` }),
	seed: awardSeed as Award[],
};

const recommendations: CollectionConfig<Recommendation> = {
	key: "recommendations",
	labelSingular: "Recommendation",
	labelPlural: "Recommendations",
	description: "Testimonials from faculty, mentors, and colleagues.",
	schema: recommendationSchema,
	idFrom: (d) => slugify(d.author ?? ""),
	fields: [
		{
			name: "quote",
			label: "Quote",
			kind: "textarea",
			required: true,
			full: true,
		},
		{ name: "author", label: "Author", kind: "text", required: true },
		{ name: "role", label: "Role", kind: "text" },
		{ name: "date", label: "Date given", kind: "date" },
	],
	// Dragged into order in the admin, the first being the one the homepage opens on.
	// Records never reordered are all 0, and fall back to newest first.
	sort: (items) =>
		[...items].sort((a, b) => a.order - b.order || byDateDesc(a.date, b.date)),
	reorderable: true,
	summary: (r) => ({
		title: r.author,
		meta: r.date ? `${r.role} · ${r.date}` : r.role,
	}),
	seed: recommendationSeed as Recommendation[],
};

const byOrderAsc = <T extends { order: number; title: string }>(items: T[]) =>
	[...items].sort(
		(a, b) => a.order - b.order || a.title.localeCompare(b.title),
	);

const selectedWork: CollectionConfig<SelectedWork> = {
	key: "selected-work",
	labelSingular: "Highlight",
	labelPlural: "Selected work",
	description:
		"Kept with the record; the homepage no longer has a Selected work section.",
	schema: selectedWorkSchema,
	idFrom: (d) => slugify(d.title ?? ""),
	fields: [
		{ name: "title", label: "Title", kind: "text", required: true, full: true },
		{
			name: "tag",
			label: "Tag",
			kind: "text",
			placeholder: "e.g. Accelerated Computing",
		},
		{ name: "description", label: "Description", kind: "textarea", full: true },
		{
			name: "image",
			label: "Image",
			kind: "image",
			full: true,
			help: "Upload or choose from the image library.",
		},
		{
			name: "href",
			label: "Link URL",
			kind: "text",
			full: true,
			placeholder: "https://...",
		},
		{
			name: "cta",
			label: "Lead button label",
			kind: "text",
			placeholder: "Read more",
		},
	],
	sort: byOrderAsc,
	summary: (s) => ({ title: s.title, meta: s.tag }),
	reorderable: true,
	seed: selectedWorkSeed as SelectedWork[],
};

const projects: CollectionConfig<Project> = {
	key: "projects",
	labelSingular: "Project",
	labelPlural: "Projects",
	description:
		"Rows on the homepage: the Data category lists under Data, the rest under Projects.",
	schema: projectSchema,
	idFrom: (d) => slugify(d.title ?? ""),
	fields: [
		{ name: "title", label: "Title", kind: "text", required: true, full: true },
		{
			name: "category",
			label: "Category",
			kind: "select",
			options: PROJECT_CATEGORIES,
		},
		{
			name: "org",
			label: "Built at",
			kind: "text",
			placeholder: "Experimental Machines",
			help: "Shown under the title. Leave empty for your own projects.",
		},
		{
			name: "headline",
			label: "Headline",
			kind: "text",
			full: true,
			help: "What it does, in one plain line.",
		},
		{
			name: "finding",
			label: "Result",
			kind: "text",
			placeholder: "e.g. 0.41 s",
			help: "A measured number. With chart rows, the project gets a full feature; the first of those opens the section.",
		},
		{
			name: "findingNote",
			label: "Result, in a sentence",
			kind: "textarea",
			full: true,
		},
		{
			name: "bars",
			label: "Chart rows",
			kind: "list",
			full: true,
			help: 'One per line, as "Label = 42 ms". Start a line with * to highlight it.',
		},
		{ name: "description", label: "Description", kind: "textarea", full: true },
		{
			name: "tags",
			label: "Tags",
			kind: "list",
			full: true,
			help: "One per line. Kept with the record; not shown on the site.",
		},
		{
			name: "metrics",
			label: "Metrics",
			kind: "list",
			full: true,
			help: "One per line. Kept with the record; not shown on the site.",
		},
		{
			name: "github",
			label: "GitHub URL",
			kind: "text",
			full: true,
			placeholder: "https://github.com/...",
		},
		{
			name: "demo",
			label: "Demo URL",
			kind: "text",
			full: true,
			placeholder: "https://...",
		},
		{
			name: "demoLabel",
			label: "Demo button label",
			kind: "text",
			placeholder: "Live demo",
		},
		{
			name: "image",
			label: "Image",
			kind: "image",
			full: true,
			help: "Kept with the record; not shown on the site.",
		},
		{
			name: "shot",
			label: "App screenshot",
			kind: "image",
			full: true,
			help: "A real screen from the project. With a result, it gets the project a full feature.",
		},
		{
			name: "shotAlt",
			label: "What the screenshot shows",
			kind: "textarea",
			full: true,
		},
		{
			name: "shotKind",
			label: "Screenshot shape",
			kind: "select",
			options: ["phone", "wide"],
		},
	],
	sort: byOrderAsc,
	summary: (p) => ({ title: p.title, meta: p.category }),
	reorderable: true,
	seed: projectSeed as unknown as Project[],
};

const gallery: CollectionConfig<GalleryImage> = {
	key: "gallery",
	labelSingular: "Image",
	labelPlural: "Gallery",
	description: "Standalone image gallery shown at /gallery.",
	schema: galleryImageSchema,
	idFrom: (d) =>
		slugify(d.title || "") ||
		slugify((d.image || "").split("/").pop() || "") ||
		"image",
	fields: [
		{
			name: "image",
			label: "Image",
			kind: "image",
			full: true,
			required: true,
			help: "Upload or choose from the image library.",
		},
		{
			name: "title",
			label: "Title (shown on hover)",
			kind: "text",
			full: true,
		},
	],
	sort: byOrderAsc,
	summary: (g) => ({
		title: g.title || "(untitled image)",
		meta: "",
	}),
	reorderable: true,
	seed: gallerySeed as GalleryImage[],
};

const research: CollectionConfig<ResearchStudy> = {
	key: "research",
	labelSingular: "Study",
	labelPlural: "Research",
	description:
		"Experimental Machines studies in the homepage Research section. The first is the lead card; the first four are shown.",
	schema: researchStudySchema,
	idFrom: (d) => slugify(d.title ?? ""),
	fields: [
		{ name: "title", label: "Title", kind: "text", required: true, full: true },
		{
			name: "finding",
			label: "Finding",
			kind: "text",
			required: true,
			placeholder: "e.g. 42%",
		},
		{
			name: "when",
			label: "When",
			kind: "text",
			placeholder: "e.g. GGUF, October 2026",
		},
		{
			name: "findingNote",
			label: "Finding, in a sentence",
			kind: "textarea",
			full: true,
		},
		{ name: "summary", label: "Summary", kind: "textarea", full: true },
		{
			name: "href",
			label: "Study URL",
			kind: "text",
			full: true,
			placeholder: "https://experimentalmachines.org/research/...",
		},
		{
			name: "bars",
			label: "Chart rows",
			kind: "list",
			full: true,
			help: 'One per line, as "Label = 42%". Start a line with * to highlight it.',
		},
	],
	sort: byOrderAsc,
	summary: (r) => ({ title: r.title, meta: r.finding }),
	reorderable: true,
	seed: researchSeed as ResearchStudy[],
};

// Ordered to match the homepage section flow (Research, Selected Work, Projects,
// Recommendations, Certifications), with the standalone Gallery next and Awards
// last: they stay editable but no public page shows them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COLLECTIONS: Record<string, CollectionConfig<any>> = {
	research,
	"selected-work": selectedWork,
	projects,
	recommendations,
	certifications,
	gallery,
	awards,
};

export const COLLECTION_KEYS = Object.keys(COLLECTIONS);

// Own-property lookups only: `key in COLLECTIONS` / `COLLECTIONS[key]` would
// resolve inherited names, so "/admin/constructor" or "toString" would return
// Object.prototype members instead of null.
export function isCollectionKey(key: string): boolean {
	return Object.hasOwn(COLLECTIONS, key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCollection(key: string): CollectionConfig<any> | null {
	return isCollectionKey(key) ? COLLECTIONS[key] : null;
}
