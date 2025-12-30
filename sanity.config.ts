"use client";
/**
 * This config is used to set up Sanity Studio that's mounted on the `app/(sanity)/studio/[[...tool]]/page.tsx` route
 */
import { studioUrl } from "@/sanity/lib/api";
import { resolveHref } from "@/sanity/lib/utils";
import { assistWithPresets } from "@/sanity/plugins/assist";
import { pageStructure, singletonPlugin } from "@/sanity/plugins/settings";
import { blockContentType } from "@/sanity/schemas/blockContentType";
import author from "@/sanity/schemas/documents/author";
import post from "@/sanity/schemas/documents/post";
import settings from "@/sanity/schemas/singletons/settings";
import { codeInput } from "@sanity/code-input";
import { colorInput } from "@sanity/color-input";
import { table } from "@sanity/table";
import { visionTool } from "@sanity/vision";
import { PluginOptions, defineConfig } from "sanity";
import { unsplashImageAsset } from "sanity-plugin-asset-source-unsplash";
import { media } from "sanity-plugin-media";
import {
	defineDocuments,
	defineLocations,
	presentationTool,
	type DocumentLocation,
} from "sanity/presentation";
import { structureTool } from "sanity/structure";

const homeLocation = {
	title: "Home",
	href: "/blog",
} satisfies DocumentLocation;

export default defineConfig({
	basePath: studioUrl,
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
	schema: {
		types: [
			// Singletons
			settings,
			// Documents
			post,
			blockContentType,
			author,
			{
				name: "product",
				title: "Product",
				type: "document",
				fields: [
					{
						// Include the table as a field
						// Giving it a semantic title
						name: "sizeChart",
						title: "Size Chart",
						type: "table",
					},
				],
			},
		],
	},
	plugins: [
		presentationTool({
			previewUrl: {
				origin: process.env.NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN,
				preview: "/blog",
				previewMode: {
					enable: "/api/draft-mode/enable",
				},
			},
			resolve: {
				mainDocuments: defineDocuments([
					{
						route: "/blog/:slug",
						filter: '_type == "post" && _id == $id',
					},
				]),
				locations: {
					settings: defineLocations({
						locations: [homeLocation],
						message: "This document is used on all pages",
						tone: "caution",
					}),
					post: defineLocations({
						select: {
							title: "title",
							slug: "slug.current",
						},
						resolve: (doc) => ({
							locations: [
								{
									title: doc?.title || "Untitled",
									href: resolveHref("post", doc?.slug) ?? "/blog",
								},
								homeLocation,
							],
						}),
					}),
				},
			},
		}),
		structureTool({ structure: pageStructure([settings]) }),
		// Configures the global "new document" button, and document actions, to suit the Settings document singleton
		colorInput(),
		table(),
		singletonPlugin([settings.name]),
		// Add an image asset source for Unsplash
		unsplashImageAsset(),
		codeInput(),
		media(),
		// Sets up AI Assist with preset prompts
		// https://www.sanity.io/docs/ai-assist
		assistWithPresets(),
		// Vision lets you query your content with GROQ in the studio
		// https://www.sanity.io/docs/the-vision-plugin
		process.env.NODE_ENV === "development" &&
			visionTool({
				defaultApiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!,
			}),
	].filter(Boolean) as PluginOptions[],
});
