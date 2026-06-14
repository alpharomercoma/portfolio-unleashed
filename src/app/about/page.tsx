import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Markdown } from "@/components/markdown";
import { Navbar } from "@/components/navbar";
import { getAbout } from "@/lib/about/store";

const SITE_URL = "https://alpharomer.com";

// Strip markdown syntax to a plain-text excerpt for meta descriptions.
function excerpt(markdown: string, max = 155): string {
	const plain = markdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
		.replace(/[#>*_`~-]/g, "") // syntax chars
		.replace(/\s+/g, " ")
		.trim();
	return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}

export async function generateMetadata(): Promise<Metadata> {
	const about = await getAbout();
	const description = excerpt(about.body);
	return {
		title: `${about.title} | Alpha Romer Coma`,
		description,
		alternates: { canonical: "/about" },
		openGraph: {
			type: "profile",
			title: `${about.title} | Alpha Romer Coma`,
			description,
			url: "/about",
			siteName: "Alpha Romer Coma",
			locale: "en_US",
			images: [{ url: "/og.png", alt: "Alpha Romer Coma" }],
		},
		twitter: {
			card: "summary_large_image",
			site: "@alpharomercoma",
			creator: "@alpharomercoma",
			title: `${about.title} | Alpha Romer Coma`,
			description,
			images: ["/og.png"],
		},
	};
}

export default async function AboutPage() {
	const about = await getAbout();

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
						name: "About",
						item: `${SITE_URL}/about`,
					},
				],
			},
			{
				"@type": "ProfilePage",
				name: `${about.title} | Alpha Romer Coma`,
				url: `${SITE_URL}/about`,
				description: excerpt(about.body),
				mainEntity: {
					"@type": "Person",
					name: "Alpha Romer Coma",
					url: SITE_URL,
					jobTitle: "Machine Learning Engineer",
				},
			},
		],
	};

	return (
		<main className="min-h-screen bg-background">
			<script
				type="application/ld+json"
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<Navbar />

			<article className="px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-24">
				<div className="max-w-3xl mx-auto">
					<header className="mb-10 sm:mb-12">
						<span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
							<span aria-hidden className="size-1.5 rounded-full bg-lime" />
							About
						</span>
						<h1 className="display-xl mt-4">{about.title}</h1>
					</header>

					<Markdown>{about.body}</Markdown>
				</div>
			</article>

			<Footer />
		</main>
	);
}
