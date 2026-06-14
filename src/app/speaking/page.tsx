import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { SpeakingIndex } from "@/components/speaking/speaking-index";
import { computeStats } from "@/lib/talks/schema";
import { getAllTalks } from "@/lib/talks/store";

const SITE_URL = "https://alpharomer.com";
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
	const talks = await getAllTalks();
	const stats = computeStats(talks);

	const statItems = [
		{ value: String(stats.talks), label: "Talks & workshops" },
		{ value: String(stats.sessions), label: "Sessions delivered" },
		{
			value: `${stats.developersReached.toLocaleString()}+`,
			label: "Developers reached",
			lime: true,
		},
		{ value: String(stats.yearsSpeaking), label: "Years speaking" },
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
		<main className="min-h-screen bg-background">
			<script
				type="application/ld+json"
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<Navbar />
			<section className="px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-14 sm:pb-16">
				<div className="max-w-6xl mx-auto">
					<h1 className="display-xl max-w-3xl">
						Talks &amp; <span className="lime-mark">workshops</span>.
					</h1>
					<p className="lede mt-6 max-w-2xl">
						From PyTorch Conference Europe to community stages across the
						Philippines, sessions on AI, accelerated computing, and developer
						tools.
					</p>

					<div className="mt-14 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 border-t border-foreground/15 pt-10">
						{statItems.map((s) => (
							<div key={s.label}>
								<div className="font-display text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-foreground leading-none">
									{s.lime ? (
										<span className="lime-mark">{s.value}</span>
									) : (
										s.value
									)}
								</div>
								<div className="mt-3 text-sm font-medium text-foreground">
									{s.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-24 border-t border-border">
				<div className="max-w-6xl mx-auto">
					{talks.length > 0 ? (
						<SpeakingIndex talks={talks} />
					) : (
						<div className="rounded-2xl border border-border bg-secondary p-10 text-center">
							<p className="text-sm text-muted-foreground">
								Talks are being published. Check back soon.
							</p>
						</div>
					)}
				</div>
			</section>
			<Footer />
		</main>
	);
}
