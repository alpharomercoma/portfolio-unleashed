import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { SiteShell } from "@/components/site-shell";
import { getAbout } from "@/lib/about/store";
import { computeStats } from "@/lib/talks/schema";
import { getPublishedTalks } from "@/lib/talks/store";

import { SITE_URL } from "@/lib/seo";

// Re-rendered daily, so a talk counts as delivered once its date passes.
export const revalidate = 86400;

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
	const [about, talks] = await Promise.all([getAbout(), getPublishedTalks()]);
	const stats = computeStats(talks);
	const facts = [
		{ value: String(stats.sessions), label: "Sessions delivered" },
		{
			value: stats.attendees.toLocaleString("en-US"),
			label: "Attendees",
		},
		{ value: String(stats.yearsSpeaking), label: "Years speaking" },
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
		<SiteShell>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<article>
				<PageHeader title={`${about.title}.`} />
				<div className="site-container mt-10 grid gap-12 pb-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16 lg:pb-24">
					<div className="measure min-w-0">
						<Markdown>{about.body}</Markdown>
					</div>

					{/* Every figure is read from the stores, so it stays true as talks
					    are added in the admin. */}
					<aside className="lg:sticky lg:top-24 lg:self-start">
						<dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-t-2 border-brand pt-4 lg:grid-cols-1">
							{facts.map((f) => (
								<div key={f.label} className="flex flex-col">
									<dt className="order-2 text-sm text-muted-foreground">
										{f.label}
									</dt>
									<dd className="order-1 display-md">{f.value}</dd>
								</div>
							))}
						</dl>
						<ul className="mt-6 flex flex-col border-t border-border pt-3 text-sm font-medium">
							{links.map((l) => (
								<li key={l.label}>
									<Link
										href={l.href}
										target={l.external ? "_blank" : undefined}
										rel={l.external ? "noopener noreferrer" : undefined}
										className="text-link inline-flex min-h-10 items-center gap-1.5"
									>
										{l.label}
										{l.external && (
											<ArrowUpRight className="size-3.5" aria-hidden />
										)}
									</Link>
								</li>
							))}
						</ul>
					</aside>
				</div>
			</article>
		</SiteShell>
	);
}
