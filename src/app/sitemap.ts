import type { MetadataRoute } from "next";
import { defineQuery } from "next-sanity";

import { SITE_URL } from "@/lib/seo";
import { latestEventDate } from "@/lib/talks/schema";
import { getPublishedTalks } from "@/lib/talks/store";
import { sanityFetch } from "@/sanity/lib/fetch";

// Regenerate at most hourly so admin-added talks/posts appear without a redeploy.
export const revalidate = 3600;

const blogSlugs = defineQuery(
	`*[_type == "post" && defined(slug.current)]{ "slug": slug.current, "date": coalesce(date, _updatedAt) }`,
);

function toDate(value?: string): Date | undefined {
	if (!value) return undefined;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: SITE_URL, changeFrequency: "monthly", priority: 1 },
		{ url: `${SITE_URL}/speaking`, changeFrequency: "weekly", priority: 0.8 },
		{ url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
		{ url: `${SITE_URL}/gallery`, changeFrequency: "monthly", priority: 0.6 },
		{ url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
	];

	const talks = await getPublishedTalks().catch(() => []);
	const talkRoutes: MetadataRoute.Sitemap = talks.map((t) => ({
		url: `${SITE_URL}/speaking/${t.slug}`,
		lastModified: toDate(t.updatedAt) ?? toDate(latestEventDate(t)),
		changeFrequency: "yearly",
		priority: 0.6,
	}));

	const posts =
		(await sanityFetch({
			query: blogSlugs,
			perspective: "published",
			stega: false,
		}).catch(() => [])) ?? [];
	const blogRoutes: MetadataRoute.Sitemap = (
		posts as { slug: string; date?: string }[]
	).map((p) => ({
		url: `${SITE_URL}/blog/${p.slug}`,
		lastModified: toDate(p.date),
		changeFrequency: "yearly",
		priority: 0.7,
	}));

	return [...staticRoutes, ...talkRoutes, ...blogRoutes];
}
