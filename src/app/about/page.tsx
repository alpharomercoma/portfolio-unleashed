import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Markdown } from "@/components/markdown";
import { Navbar } from "@/components/navbar";
import { getAbout } from "@/lib/about/store";
import { awardSchema, certificationSchema } from "@/lib/collections/schema";
import { getTypedItems } from "@/lib/collections/store";
import { computeStats } from "@/lib/talks/schema";
import { getPublishedTalks } from "@/lib/talks/store";

import { SITE_URL } from "@/lib/seo";

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
	const [about, talks, awards, certifications] = await Promise.all([
		getAbout(),
		getPublishedTalks(),
		getTypedItems("awards", awardSchema),
		getTypedItems("certifications", certificationSchema),
	]);
	const stats = computeStats(talks);
	const facts = [
		{ value: String(stats.sessions), label: "Sessions delivered" },
		{ value: String(stats.talks), label: "Talks and workshops" },
		{ value: String(awards.length), label: "Awards" },
		{ value: String(certifications.length), label: "Industry credentials" },
	];
	const links = [
		{ label: "All talks", href: "/speaking" },
		{ label: "Book a call", href: "/#contact" },
		{
			label: "GitHub",
			href: "https://github.com/alpharomercoma",
			external: true,
		},
		{
			label: "LinkedIn",
			href: "https://linkedin.com/in/alpharomercoma",
			external: true,
		},
	];

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
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<Navbar />

			<article className="px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-24">
				<div className="max-w-6xl mx-auto">
					<header className="mb-10 sm:mb-12 max-w-3xl">
						<h1 className="display-xl">{about.title}</h1>
					</header>

					<div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
						<div className="max-w-3xl min-w-0">
							<Markdown>{about.body}</Markdown>
						</div>

						{/* At-a-glance rail. Every figure is read from the stores, so it
						    stays true as talks and credentials are added in the admin. */}
						<aside className="lg:sticky lg:top-28 self-start">
							<dl className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-foreground/15 pt-7 lg:grid-cols-1">
								{facts.map((f) => (
									<div key={f.label} className="flex flex-col gap-2">
										<dt className="order-2 text-sm text-muted-foreground">
											{f.label}
										</dt>
										<dd className="font-display text-3xl font-bold tracking-[-0.03em] leading-none text-foreground">
											{f.value}
										</dd>
									</div>
								))}
							</dl>
							<ul className="mt-8 flex flex-col gap-2.5 border-t border-foreground/15 pt-7 text-sm">
								{links.map((l) => (
									<li key={l.label}>
										<Link
											href={l.href}
											target={l.external ? "_blank" : undefined}
											rel={l.external ? "noopener noreferrer" : undefined}
											className="inline-flex items-center gap-1.5 font-medium text-foreground underline decoration-lime underline-offset-4 hover:decoration-lime-strong"
										>
											{l.label}
											{l.external && <ArrowUpRight className="size-3.5" />}
										</Link>
									</li>
								))}
							</ul>
						</aside>
					</div>
				</div>
			</article>

			<Footer />
		</main>
	);
}
