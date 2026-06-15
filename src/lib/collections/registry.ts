import type { z } from "zod";

import { slugify } from "@/lib/talks/schema";
import { byDateDesc } from "@/lib/utils";
import awardSeed from "../../../data/awards.seed.json";
import certSeed from "../../../data/certifications.seed.json";
import gallerySeed from "../../../data/gallery.seed.json";
import projectSeed from "../../../data/projects.seed.json";
import recommendationSeed from "../../../data/recommendations.seed.json";
import selectedWorkSeed from "../../../data/selected-work.seed.json";
import {
	AWARD_CATEGORIES,
	type Award,
	type Certification,
	type GalleryImage,
	PROJECT_CATEGORIES,
	type Project,
	type Recommendation,
	type SelectedWork,
	awardSchema,
	certificationSchema,
	galleryImageSchema,
	projectSchema,
	recommendationSchema,
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
	// on collections sorted by `byOrderAsc`. This is config, not schema — the
	// `order: number` field stays in the data.
	reorderable?: boolean;
};

const certifications: CollectionConfig<Certification> = {
	key: "certifications",
	labelSingular: "Certification",
	labelPlural: "Certifications",
	description: "Cloud, ML, and security credentials shown in Recognition.",
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
	description: "Honors and competition results shown in Recognition.",
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
	// Newest-first by the date the recommendation was given.
	sort: (items) => [...items].sort((a, b) => byDateDesc(a.date, b.date)),
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
		"The lead + supporting highlights in the homepage Selected Work section.",
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
		"ML and software engineering work shown in the Projects carousel.",
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
		{ name: "description", label: "Description", kind: "textarea", full: true },
		{
			name: "tags",
			label: "Tags",
			kind: "list",
			full: true,
			help: "One per line. Tech/topic chips.",
		},
		{
			name: "metrics",
			label: "Metrics",
			kind: "list",
			full: true,
			help: "One per line. Shown as pills on the card.",
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
			help: "Upload or choose from the image library.",
		},
	],
	sort: byOrderAsc,
	summary: (p) => ({ title: p.title, meta: p.category }),
	reorderable: true,
	seed: projectSeed as Project[],
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

// Ordered to match the homepage section flow (Selected Work, Projects, then
// Recognition = Awards before Certifications, then Recommendations), with the
// standalone Gallery last.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COLLECTIONS: Record<string, CollectionConfig<any>> = {
	"selected-work": selectedWork,
	projects,
	awards,
	certifications,
	recommendations,
	gallery,
};

export const COLLECTION_KEYS = Object.keys(COLLECTIONS);

export function isCollectionKey(key: string): boolean {
	return key in COLLECTIONS;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCollection(key: string): CollectionConfig<any> | null {
	return COLLECTIONS[key] ?? null;
}
