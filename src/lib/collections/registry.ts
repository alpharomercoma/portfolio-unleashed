import type { z } from "zod";

import { slugify } from "@/lib/talks/schema";
import awardSeed from "../../../data/awards.seed.json";
import certSeed from "../../../data/certifications.seed.json";
import recommendationSeed from "../../../data/recommendations.seed.json";
import {
	AWARD_CATEGORIES,
	type Award,
	type Certification,
	type Recommendation,
	awardSchema,
	certificationSchema,
	recommendationSchema,
} from "./schema";

// A single admin-managed content type. Adding a new section = add one entry to
// the registry below; the generic list, form, and store all read from this.
export type FieldKind = "text" | "textarea" | "date" | "select" | "image";

export type FieldConfig = {
	name: string;
	label: string;
	kind: FieldKind;
	required?: boolean;
	options?: readonly string[]; // select
	imageDir?: string; // image: /public subdir to list, e.g. "/certification/logo"
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
};

const byDateDesc = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0);

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
			imageDir: "/certification/logo",
			help: "Pick an existing logo or paste a custom path/URL.",
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
			imageDir: "/awards",
			full: true,
			help: "Pick an existing image or paste a custom path/URL.",
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
	],
	// Curated order, keep as authored.
	sort: (items) => items,
	summary: (r) => ({ title: r.author, meta: r.role }),
	seed: recommendationSeed as Recommendation[],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COLLECTIONS: Record<string, CollectionConfig<any>> = {
	certifications,
	awards,
	recommendations,
};

export const COLLECTION_KEYS = Object.keys(COLLECTIONS);

export function isCollectionKey(key: string): boolean {
	return key in COLLECTIONS;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCollection(key: string): CollectionConfig<any> | null {
	return COLLECTIONS[key] ?? null;
}
