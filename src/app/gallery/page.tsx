import type { Metadata } from "next";

import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { PageHeader } from "@/components/page-header";
import { SiteShell } from "@/components/site-shell";
import { galleryImageSchema } from "@/lib/collections/schema";
import { getTypedItems } from "@/lib/collections/store";

import { SITE_URL } from "@/lib/seo";
const DESCRIPTION = "Talks, travel, and art I like.";

export const metadata: Metadata = {
	title: "Gallery | Alpha Romer Coma",
	description: DESCRIPTION,
	alternates: { canonical: "/gallery" },
	openGraph: {
		type: "website",
		title: "Gallery | Alpha Romer Coma",
		description: DESCRIPTION,
		url: "/gallery",
		siteName: "Alpha Romer Coma",
		locale: "en_US",
		images: [{ url: "/og.png", alt: "Alpha Romer Coma" }],
	},
	twitter: {
		card: "summary_large_image",
		site: "@alpharomercoma",
		creator: "@alpharomercoma",
		title: "Gallery | Alpha Romer Coma",
		description: DESCRIPTION,
		images: ["/og.png"],
	},
};

export default async function GalleryPage() {
	const images = await getTypedItems("gallery", galleryImageSchema);

	const jsonLd = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "BreadcrumbList",
				itemListElement: [
					{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
					{
						"@type": "ListItem",
						position: 2,
						name: "Gallery",
						item: `${SITE_URL}/gallery`,
					},
				],
			},
			{
				"@type": "ImageGallery",
				name: "Gallery | Alpha Romer Coma",
				url: `${SITE_URL}/gallery`,
				description: DESCRIPTION,
				image: images.map((g) => g.image).filter(Boolean),
			},
		],
	};

	return (
		<SiteShell>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<PageHeader title="Gallery.">{DESCRIPTION}</PageHeader>
			<div className="site-container mt-10 pb-16 lg:pb-24">
				{images.length > 0 ? (
					<GalleryGrid
						images={images.map((g) => ({
							id: g.id,
							image: g.image,
							title: g.title,
						}))}
					/>
				) : (
					<p className="text-muted-foreground">No photos are published yet.</p>
				)}
			</div>
		</SiteShell>
	);
}
