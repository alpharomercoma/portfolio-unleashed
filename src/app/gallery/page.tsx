import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Navbar } from "@/components/navbar";
import { galleryImageSchema } from "@/lib/collections/schema";
import { getTypedItems } from "@/lib/collections/store";

import { SITE_URL } from "@/lib/seo";
const DESCRIPTION =
	"A visual log of talks, hackathons, and the things I build.";

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
		<main className="min-h-screen bg-background">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<Navbar />

			<section className="px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-24">
				<div className="max-w-6xl mx-auto">
					<header className="mb-12 sm:mb-14 max-w-3xl">
						<span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
							<span aria-hidden className="size-1.5 rounded-full bg-lime" />
							Gallery
						</span>
						<h1 className="display-xl mt-4">
							Moments &amp; <span className="lime-mark">making</span>.
						</h1>
						<p className="lede mt-6">{DESCRIPTION}</p>
					</header>

					{images.length > 0 ? (
						<GalleryGrid
							images={images.map((g) => ({
								id: g.id,
								image: g.image,
								title: g.title,
							}))}
						/>
					) : (
						<div className="rounded-2xl border border-border bg-secondary p-10 text-center">
							<p className="text-sm text-muted-foreground">
								No images yet. Add some from the admin dashboard.
							</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</main>
	);
}
