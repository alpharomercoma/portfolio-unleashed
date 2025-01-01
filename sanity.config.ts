"use client";
/**
 * This config is used to set up Sanity Studio that's mounted on the `app/(sanity)/studio/[[...tool]]/page.tsx` route
 */
import { visionTool } from "@sanity/vision";
import { PluginOptions, defineConfig } from "sanity";
import { unsplashImageAsset } from "sanity-plugin-asset-source-unsplash";
import {
	presentationTool,
	defineDocuments,
	defineLocations,
	type DocumentLocation,
} from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { blockContentType } from "@/sanity/schemas/blockContentType";
import { studioUrl } from "@/sanity/lib/api";
import { pageStructure, singletonPlugin } from "@/sanity/plugins/settings";
import { assistWithPresets } from "@/sanity/plugins/assist";
import author from "@/sanity/schemas/documents/author";
import post from "@/sanity/schemas/documents/post";
import settings from "@/sanity/schemas/singletons/settings";
import { resolveHref } from "@/sanity/lib/utils";
import { env } from "@/env";
const homeLocation = {
	title: "Home",
	href: "/blog",
} satisfies DocumentLocation;

export default defineConfig({
	basePath: studioUrl,
	projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	dataset: env.NEXT_PUBLIC_SANITY_DATASET,
	schema: {
		types: [
			// Singletons
			settings,
			// Documents
			post,
			blockContentType,
			author,
		],
	},
	plugins: [
		presentationTool({
			previewUrl: {
				origin: env.NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_ORIGIN,
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
		singletonPlugin([settings.name]),
		// Add an image asset source for Unsplash
		unsplashImageAsset(),
		// Sets up AI Assist with preset prompts
		// https://www.sanity.io/docs/ai-assist
		assistWithPresets(),
		// Vision lets you query your content with GROQ in the studio
		// https://www.sanity.io/docs/the-vision-plugin
		process.env.NODE_ENV === "development" &&
			visionTool({ defaultApiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION }),
	].filter(Boolean) as PluginOptions[],
});
