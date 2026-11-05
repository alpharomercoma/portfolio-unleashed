import type { Metadata } from "next";
import Link from "next/link";

import { BarRows, Columns } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { SiteShell } from "@/components/site-shell";
import { SpeakingIndex } from "@/components/speaking/speaking-index";
import {
	computeStats,
	sessionsByYear,
	talksByCategory,
} from "@/lib/talks/schema";
import { getPublishedTalks } from "@/lib/talks/store";

import { SITE_URL } from "@/lib/seo";

// Re-rendered daily, so a talk counts as delivered once its date passes.
export const revalidate = 86400;
const SPEAKING_DESCRIPTION =
	"Talks and workshops on AI, accelerated computing, and developer tools, from PyTorch Conference Europe to community stages across the Philippines.";

export const metadata: Metadata = {
	title: "Speaking | Alpha Romer Coma",
	description: SPEAKING_DESCRIPTION,
	keywords: [
		"Alpha Romer Coma",
		"speaking",
		"talks",
		"workshops",
		"keynote",
		"AI",
		"machine learning",
		"accelerated computing",
		"PyTorch",
		"developer tools",
	],
	alternates: { canonical: "/speaking" },
	openGraph: {
		type: "website",
		title: "Speaking | Alpha Romer Coma",
		description: SPEAKING_DESCRIPTION,
		url: "/speaking",
		siteName: "Alpha Romer Coma",
		locale: "en_US",
		images: [{ url: "/og.png", alt: "Alpha Romer Coma speaking" }],
	},
	twitter: {
		card: "summary_large_image",
		site: "@alpharomercoma",
		creator: "@alpharomercoma",
		title: "Speaking | Alpha Romer Coma",
		description: SPEAKING_DESCRIPTION,
		images: ["/og.png"],
	},
};

export default async function SpeakingPage() {
	const talks = await getPublishedTalks();
	const stats = computeStats(talks);

	const byYear = sessionsByYear(talks);
	const latestYear = byYear.at(-1)?.year;
	const topics = talksByCategory(talks);

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
						name: "Speaking",
						item: `${SITE_URL}/speaking`,
					},
				],
			},
			{
				"@type": "ItemList",
				name: "Talks & workshops",
				description: SPEAKING_DESCRIPTION,
				numberOfItems: talks.length,
				itemListElement: talks.map((t, i) => ({
					"@type": "ListItem",
					position: i + 1,
					url: `${SITE_URL}/speaking/${t.slug}`,
					name: t.title,
				})),
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
			<PageHeader title="Speaking.">
				From PyTorch Conference Europe to community stages across the
				Philippines.
			</PageHeader>

			{talks.length > 0 && (
				<section
					aria-label="Speaking in numbers"
					className="site-container mt-10 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
				>
					<div className="surface-ink flex flex-col justify-between gap-10 rounded-[1.75rem] p-8 sm:p-10">
						<div>
							<p className="finding">
								{stats.attendees.toLocaleString("en-US")}
							</p>
							<p className="mt-2 leading-snug text-on-deep">
								attendees across {stats.sessions} sessions
							</p>
						</div>
						<div>
							<p className="mb-3 text-sm text-on-deep">Sessions by year</p>
							<Columns
								data={byYear.map((y) => ({
									label: y.year,
									value: y.sessions,
									highlight: y.year === latestYear,
								}))}
							/>
						</div>
					</div>
					<div className="rounded-[1.75rem] border border-border p-8 sm:p-10">
						<p className="font-medium">Talks by topic</p>
						<BarRows
							className="mt-5"
							tone="light"
							rows={topics.map((t, i) => ({
								label: t.category,
								value: t.talks,
								display: String(t.talks),
								highlight: i === 0,
							}))}
						/>
					</div>
				</section>
			)}

			<section
				aria-label="All talks"
				className="site-container pb-16 pt-12 lg:pb-24"
			>
				{talks.length > 0 ? (
					<SpeakingIndex talks={talks} />
				) : (
					<p className="text-muted-foreground">
						No talks are published yet. The{" "}
						<Link href="/blog" className="text-link">
							writing
						</Link>{" "}
						covers some of the same ground.
					</p>
				)}
			</section>
		</SiteShell>
	);
}
