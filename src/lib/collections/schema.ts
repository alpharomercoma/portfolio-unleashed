import { z } from "zod";

// Flat, rarely-changing content types managed by the generic admin "collections"
// framework. Talks are intentionally NOT here, they keep their bespoke model.

// Visibility flag shared by every collection. Hidden items stay in the store (and
// stay editable in admin) but are dropped from public reads (`getTypedItems`), so
// you can pull something off the live site without deleting it. Toggled via its
// own admin action, never the item form. Defaults false, so legacy records that
// predate this field normalize forward on read (safeParse fills the default) — no
// data migration is needed.
const hiddenField = z.boolean().default(false);

export const certificationSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	issuer: z.string().min(1),
	// File name inside /public/certification/logo (e.g. "aws.png"), or a URL.
	logo: z.string().default(""),
	date: z.string().default(""), // ISO date "YYYY-MM-DD"
	link: z.string().default(""),
	hidden: hiddenField,
});
export type Certification = z.infer<typeof certificationSchema>;

export const AWARD_CATEGORIES = [
	"AI & Research",
	"Hackathon",
	"Language",
	"Recognition",
] as const;

export const awardSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	organization: z.string().min(1),
	year: z.string().default(""),
	// File name inside /public/awards (e.g. "ph100.png"), or a URL.
	image: z.string().default(""),
	context: z.string().default(""),
	category: z.enum(AWARD_CATEGORIES).default("Recognition"),
	hidden: hiddenField,
});
export type Award = z.infer<typeof awardSchema>;

// Numeric display order captured from a plain text input. Anything non-numeric
// (blank, undefined, junk) becomes 0, so the form never produces NaN.
const orderField = z.preprocess(
	(v) => (Number.isFinite(Number(v)) ? Number(v) : 0),
	z.number(),
);

export const recommendationSchema = z.object({
	id: z.string().min(1),
	quote: z.string().min(1),
	author: z.string().min(1),
	role: z.string().default(""),
	date: z.string().default(""), // ISO date "YYYY-MM-DD" the recommendation was given
	order: orderField,
	hidden: hiddenField,
});
export type Recommendation = z.infer<typeof recommendationSchema>;

export const PROJECT_CATEGORIES = [
	"Machine Learning",
	"Data",
	"Software Engineering",
] as const;

export const projectSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	description: z.string().default(""),
	category: z.enum(PROJECT_CATEGORIES).default("Machine Learning"),
	// Who it was built with, when that isn't just the owner. Shown under the title.
	org: z.string().default(""),
	// The line a project opens with, in its own words.
	headline: z.string().default(""),
	// A measured result, shown first when present, with its chart rows as
	// "Label = 42 ms" (a leading * marks the row the result is about). Copied from
	// the project's own report; nothing here is computed.
	finding: z.string().default(""),
	findingNote: z.string().default(""),
	bars: z.array(z.string()).default([]),
	tags: z.array(z.string()).default([]),
	metrics: z.array(z.string()).default([]),
	github: z.string().default(""),
	demo: z.string().default(""),
	demoLabel: z.string().default(""),
	// File name inside /public/projects (e.g. "acmx.png"), or a URL.
	image: z.string().default(""),
	// A real screen from the app, shown on the project's feature, and what it shows.
	shot: z.string().default(""),
	shotAlt: z.string().default(""),
	// The admin form posts "" for a record saved before this field existed.
	shotKind: z.enum(["phone", "wide"]).catch("phone"),
	order: orderField,
	hidden: hiddenField,
});
export type Project = z.infer<typeof projectSchema>;

export const galleryImageSchema = z.object({
	id: z.string().min(1),
	// Image URL from the picker (Blob), or any image path/URL.
	image: z.string().min(1),
	title: z.string().default(""), // shown on hover
	order: orderField,
	hidden: hiddenField,
});
export type GalleryImage = z.infer<typeof galleryImageSchema>;

export const selectedWorkSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	tag: z.string().default(""),
	description: z.string().default(""),
	// Image URL from the picker (Blob), or any image path/URL.
	image: z.string().default(""),
	href: z.string().default(""),
	cta: z.string().default(""),
	order: orderField,
	hidden: hiddenField,
});
export type SelectedWork = z.infer<typeof selectedWorkSchema>;

// A study from Experimental Machines, shown as its finding first. `bars` feeds the
// card's small chart: "Label = 42%", with a leading * on the row the finding is
// about. Values are copied from the study; nothing here is computed.
export const researchStudySchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	finding: z.string().min(1),
	findingNote: z.string().default(""),
	when: z.string().default(""),
	summary: z.string().default(""),
	href: z.string().default(""),
	bars: z.array(z.string()).default([]),
	order: orderField,
	hidden: hiddenField,
});
export type ResearchStudy = z.infer<typeof researchStudySchema>;
