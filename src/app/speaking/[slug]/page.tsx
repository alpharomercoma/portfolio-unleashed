import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteImage } from "@/components/site-image";
import { SiteShell } from "@/components/site-shell";
import { SlidesEmbed } from "@/components/speaking/slides-embed";
import { longDate } from "@/components/speaking/talk-meta";
import {
	type Talk,
	type TalkEvent,
	isDelivered,
	latestEventDate,
	sortTalksByRecency,
} from "@/lib/talks/schema";
import { toEmbedUrl } from "@/lib/talks/embed";
import { getPublishedTalks, getTalk } from "@/lib/talks/store";

type Props = { params: Promise<{ slug: string }> };

// Re-rendered daily, so an event moves from upcoming to delivered once it passes.
export const revalidate = 86400;

// Canonical origin; matches the root layout's metadataBase so canonical,
// OpenGraph, and JSON-LD URLs all agree.
import { SITE_URL } from "@/lib/seo";
const DEFAULT_OG = "/og.png";

export async function generateStaticParams() {
	const talks = await getPublishedTalks();
	return talks.map((t) => ({ slug: t.slug }));
}

function metaDescription(talk: Talk): string {
	const raw = (talk.tagline || talk.abstract || "").replace(/\s+/g, " ").trim();
	return raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}...` : raw;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const talk = await getTalk(slug);
	// Drafts are not public: hide their metadata like a missing talk.
	if (!talk || talk.status !== "published")
		return { title: "Talk not found", robots: { index: false } };

	const description = metaDescription(talk);
	const path = `/speaking/${slug}`;
	// Every talk gets a share image: its cover, or the site default for the
	// rare cover-less talk. Relative paths resolve against metadataBase.
	const ogImage = talk.showcaseImage || DEFAULT_OG;
	const published = (talk.createdAt || latestEventDate(talk) || "").slice(
		0,
		10,
	);
	const modified = (talk.updatedAt || talk.createdAt || "").slice(0, 10);

	return {
		title: `${talk.title} | Speaking`,
		description,
		keywords: talk.tags.length ? talk.tags : undefined,
		authors: [{ name: "Alpha Romer Coma", url: SITE_URL }],
		alternates: { canonical: path },
		openGraph: {
			type: "article",
			title: talk.title,
			description,
			url: path,
			siteName: "Alpha Romer Coma",
			locale: "en_US",
			images: [{ url: ogImage, alt: talk.title }],
			...(published ? { publishedTime: published } : {}),
			...(modified ? { modifiedTime: modified } : {}),
			authors: [SITE_URL],
			tags: talk.tags,
		},
		twitter: {
			card: "summary_large_image",
			site: "@alpharomercoma",
			creator: "@alpharomercoma",
			title: talk.title,
			description,
			images: [ogImage],
		},
	};
}

/** This session's own deck and recording, skipping a repeat of the talk's deck. */
function SessionLinks({
	event,
	primarySlideUrl,
	talkVideoUrl,
}: {
	event: TalkEvent;
	primarySlideUrl?: string;
	talkVideoUrl?: string;
}) {
	const links = [
		{
			label: "Slides",
			href: event.slideUrl === primarySlideUrl ? "" : event.slideUrl,
		},
		{
			label: "Video",
			href: event.videoUrl === talkVideoUrl ? "" : event.videoUrl,
		},
	].filter((l) => /^https?:\/\//.test(l.href));
	if (links.length === 0) return null;
	return (
		<span className="mt-1 flex gap-3">
			{links.map((l) => (
				<a
					key={l.label}
					href={l.href}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`${l.label} from ${event.eventName}`}
					className="text-link inline-flex min-h-10 items-center"
				>
					{l.label}
				</a>
			))}
		</span>
	);
}

export default async function TalkPage({ params }: Props) {
	const { slug } = await params;
	const talk = await getTalk(slug);
	// Drafts 404 publicly; they're only reachable from the admin.
	if (!talk || talk.status !== "published") notFound();

	const events = [...talk.events].sort((a, b) => b.date.localeCompare(a.date));
	const delivered = events.filter((e) => isDelivered(e));
	const upcoming = events.filter((e) => !isDelivered(e));
	const embed = toEmbedUrl(talk.primarySlideUrl ?? "");

	// "More talks" = a few other published talks by recency.
	const more = sortTalksByRecency(await getPublishedTalks())
		.filter((t) => t.slug !== talk.slug)
		.slice(0, 3);

	const talkUrl = `${SITE_URL}/speaking/${talk.slug}`;
	const ogImageUrl = new URL(talk.showcaseImage || DEFAULT_OG, SITE_URL).href;
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
					{
						"@type": "ListItem",
						position: 3,
						name: talk.title,
						item: talkUrl,
					},
				],
			},
			{
				"@type": "CreativeWork",
				"@id": talkUrl,
				name: talk.title,
				headline: talk.title,
				description: talk.abstract || talk.tagline,
				url: talkUrl,
				image: ogImageUrl,
				inLanguage: "English",
				...(talk.tags.length ? { keywords: talk.tags.join(", ") } : {}),
				...(talk.createdAt
					? { datePublished: talk.createdAt.slice(0, 10) }
					: {}),
				...(talk.updatedAt
					? { dateModified: talk.updatedAt.slice(0, 10) }
					: {}),
				author: {
					"@type": "Person",
					name: "Alpha Romer Coma",
					url: SITE_URL,
				},
				...(events.length
					? {
							recordedAt: events.map((e) => ({
								"@type": "Event",
								name: e.eventName,
								startDate: e.date,
								...(e.venue
									? { location: { "@type": "Place", name: e.venue } }
									: {}),
								...(e.organizerName
									? {
											organizer: {
												"@type": "Organization",
												name: e.organizerName,
											},
										}
									: {}),
							})),
						}
					: {}),
			},
		],
	};

	const facts = [
		{ label: "Type", value: talk.type },
		{ label: "Category", value: talk.category },
		...(talk.level ? [{ label: "Level", value: talk.level }] : []),
		{ label: "Duration", value: `${talk.durationMinutes} minutes` },
	];

	return (
		<SiteShell>
			<script
				type="application/ld+json"
				// JSON-LD: escape "<" so no field value can close the <script> tag.
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>

			<article className="site-container pb-16 pt-8 lg:pb-24 lg:pt-10">
				<Link
					href="/speaking"
					className="-ml-1 inline-flex min-h-10 items-center gap-1.5 rounded-full px-1 text-sm font-medium hover:underline hover:underline-offset-4"
				>
					<ArrowLeft className="size-4" aria-hidden />
					All talks
				</Link>

				<header className="mt-4 max-w-4xl">
					<h1 className="display-xl">{talk.title}</h1>
					{talk.tagline && <p className="lede mt-5">{talk.tagline}</p>}
				</header>

				<div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
					<aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:self-start">
						<dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t-2 border-brand pt-4 lg:grid-cols-1">
							{facts.map((f) => (
								<div key={f.label}>
									<dt className="text-sm text-muted-foreground">{f.label}</dt>
									<dd className="font-medium">{f.value}</dd>
								</div>
							))}
						</dl>
						{talk.tags.length > 0 && (
							<ul className="mt-6 flex flex-wrap gap-1.5">
								{talk.tags.map((tag) => (
									<li
										key={tag}
										className="rounded-full border border-input px-2.5 py-0.5 text-xs text-muted-foreground"
									>
										{tag}
									</li>
								))}
							</ul>
						)}
					</aside>
					<div className="min-w-0 lg:col-start-1 lg:row-start-1">
						{talk.showcaseImage && (
							<div className="relative aspect-video overflow-hidden rounded-[1.75rem] border border-border bg-secondary">
								<SiteImage
									src={talk.showcaseImage}
									alt={`Title slide of ${talk.title}`}
									fill
									sizes="(min-width: 1024px) 54rem, 100vw"
									className="object-cover"
									priority
								/>
							</div>
						)}

						{talk.abstract && (
							<section className="mt-12 measure">
								<h2 className="display-md">Abstract</h2>
								<p className="mt-4 text-lg leading-[1.75]">{talk.abstract}</p>
							</section>
						)}

						{talk.outline.length > 0 && (
							<section className="mt-12 measure">
								<h2 className="display-md">Outline</h2>
								<ol className="mt-4 list-decimal space-y-2 pl-6 leading-relaxed marker:text-muted-foreground">
									{talk.outline.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ol>
							</section>
						)}

						{talk.keyTakeaways.length > 0 && (
							<section className="mt-12 measure">
								<h2 className="display-md">Key takeaways</h2>
								<ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed marker:text-brand">
									{talk.keyTakeaways.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</section>
						)}

						{talk.videoUrl && (
							<p className="mt-12">
								<a
									href={talk.videoUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-link inline-flex min-h-10 items-center gap-1.5 font-medium"
								>
									Watch the recording
									<ArrowUpRight className="size-4" aria-hidden />
								</a>
							</p>
						)}

						{talk.primarySlideUrl && (
							<section className="mt-12">
								<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
									<h2 className="display-md">Slides</h2>
									<a
										href={talk.primarySlideUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-link inline-flex min-h-10 items-center gap-1.5 text-sm font-medium"
									>
										Open the slides
										<ArrowUpRight className="size-4" aria-hidden />
									</a>
								</div>
								{embed && (
									<SlidesEmbed src={embed} title={`${talk.title} slides`} />
								)}
							</section>
						)}

						{upcoming.length > 0 && (
							<section className="mt-12">
								<h2 className="display-md">Upcoming</h2>
								<ul className="mt-4 divide-y divide-border border-y border-border">
									{upcoming.map((e) => (
										<li key={e.id} className="py-3">
											<span className="block font-medium">{e.eventName}</span>
											<span className="block text-sm text-muted-foreground">
												{[e.venue, longDate(e.date)].filter(Boolean).join(", ")}
											</span>
										</li>
									))}
								</ul>
							</section>
						)}

						{delivered.length > 0 && (
							<section className="mt-12">
								<h2 className="display-md">
									Delivered{" "}
									{delivered.length === 1
										? "once"
										: `${delivered.length} times`}
								</h2>
								<table className="mt-4 w-full border-collapse text-left text-sm">
									<thead>
										<tr className="border-b-2 border-brand">
											<th scope="col" className="py-2 pr-4 font-medium">
												Event
											</th>
											<th
												scope="col"
												className="hidden py-2 pr-4 font-medium sm:table-cell"
											>
												Organizer
											</th>
											<th scope="col" className="py-2 pr-4 font-medium">
												Date
											</th>
											<th scope="col" className="py-2 text-right font-medium">
												Reach
											</th>
										</tr>
									</thead>
									<tbody>
										{delivered.map((e) => (
											<tr
												key={e.id}
												className="border-b border-border align-top"
											>
												<td className="py-3 pr-4">
													<span className="block font-medium">
														{e.eventName}
													</span>
													{e.venue && (
														<span className="block text-muted-foreground">
															{e.venue}
														</span>
													)}
													<span className="block text-muted-foreground sm:hidden">
														{e.organizerName}
													</span>
													<SessionLinks
														event={e}
														primarySlideUrl={talk.primarySlideUrl}
														talkVideoUrl={talk.videoUrl}
													/>
												</td>
												<td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">
													{e.organizerName}
												</td>
												<td className="py-3 pr-4 tabular-nums text-muted-foreground">
													{longDate(e.date)}
												</td>
												<td className="py-3 text-right tabular-nums text-muted-foreground">
													{e.audienceSize > 0
														? e.audienceSize.toLocaleString("en-US")
														: "Not recorded"}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</section>
						)}
					</div>
				</div>
			</article>

			{more.length > 0 && (
				<section
					aria-labelledby="more-talks"
					className="bg-brand-wash py-12 lg:py-16"
				>
					<div className="site-container">
						<h2 id="more-talks" className="display-md">
							More talks
						</h2>
						<ul className="mt-6 grid gap-6 sm:grid-cols-3">
							{more.map((t: Talk) => (
								<li key={t.slug} className="border-t-2 border-brand pt-4">
									<p className="text-sm text-muted-foreground">{t.category}</p>
									<h3 className="display-sm mt-1.5">
										<Link href={`/speaking/${t.slug}`} className="text-link">
											{t.title}
										</Link>
									</h3>
								</li>
							))}
						</ul>
					</div>
				</section>
			)}
		</SiteShell>
	);
}
