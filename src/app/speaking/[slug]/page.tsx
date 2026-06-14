import { format, parseISO } from "date-fns";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { type Talk, sortTalksByRecency } from "@/lib/talks/schema";
import { getAllTalks, getTalk } from "@/lib/talks/store";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
	const talks = await getAllTalks();
	return talks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const talk = await getTalk(slug);
	if (!talk) return { title: "Talk not found" };
	return {
		title: `${talk.title} | Speaking`,
		description: talk.tagline || talk.abstract.slice(0, 155),
	};
}

function fmtDate(iso: string): string {
	try {
		return format(parseISO(iso), "MMM d, yyyy");
	} catch {
		return iso;
	}
}

// Build an embeddable URL for Canva / Google Slides decks.
function toEmbedUrl(url: string): string | null {
	if (!url) return null;
	if (url.includes("canva.com/design")) {
		return url.includes("?") ? `${url}&embed` : `${url}?embed`;
	}
	if (url.includes("docs.google.com/presentation")) {
		return url.replace(/\/(edit|view|pub).*$/, "/embed");
	}
	return null;
}

function MetaCell({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-card px-4 py-4">
			<dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
				{label}
			</dt>
			<dd className="mt-1.5 text-sm font-medium text-foreground">{value}</dd>
		</div>
	);
}

export default async function TalkPage({ params }: Props) {
	const { slug } = await params;
	const talk = await getTalk(slug);
	if (!talk) notFound();

	const events = [...talk.events].sort((a, b) => b.date.localeCompare(a.date));
	const embed = toEmbedUrl(talk.primarySlideUrl ?? "");

	// "More talks" = a few other talks by recency.
	const more = sortTalksByRecency(await getAllTalks())
		.filter((t) => t.slug !== talk.slug)
		.slice(0, 3);

	return (
		<main className="min-h-screen bg-background">
			<Navbar />

			<article className="px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-20">
				<div className="max-w-4xl mx-auto">
					<Link
						href="/speaking"
						className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="size-4" />
						All talks
					</Link>

					<header className="mt-8">
						<span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
							<span aria-hidden className="size-1.5 rounded-full bg-lime" />
							{talk.category}
						</span>
						<h1 className="display-lg mt-4">{talk.title}</h1>
						{talk.tagline && <p className="lede mt-5">{talk.tagline}</p>}
					</header>

					{/* Metadata bar */}
					<dl className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px rounded-2xl overflow-hidden border border-border bg-border">
						<MetaCell label="Type" value={talk.type} />
						<MetaCell label="Category" value={talk.category} />
						<MetaCell label="Level" value={talk.level} />
						<MetaCell label="Duration" value={`${talk.durationMinutes} min`} />
						<MetaCell label="Language" value={talk.language} />
					</dl>

					{talk.tags.length > 0 && (
						<div className="mt-6 flex flex-wrap gap-2">
							{talk.tags.map((tag) => (
								<span
									key={tag}
									className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
								>
									{tag}
								</span>
							))}
						</div>
					)}

					{talk.abstract && (
						<section className="mt-12">
							<h2 className="display-md mb-4">Abstract</h2>
							<p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
								{talk.abstract}
							</p>
						</section>
					)}

					{talk.outline.length > 0 && (
						<section className="mt-12">
							<h2 className="display-md mb-5">Outline</h2>
							<ol className="space-y-3">
								{talk.outline.map((item, i) => (
									<li key={item} className="flex gap-4">
										<span className="font-mono text-sm text-muted-foreground tabular-nums pt-0.5">
											{String(i + 1).padStart(2, "0")}
										</span>
										<span className="text-base text-foreground/90 leading-relaxed">
											{item}
										</span>
									</li>
								))}
							</ol>
						</section>
					)}

					{talk.keyTakeaways.length > 0 && (
						<section className="mt-12">
							<h2 className="display-md mb-5">Key takeaways</h2>
							<ul className="space-y-3">
								{talk.keyTakeaways.map((item) => (
									<li key={item} className="flex gap-3">
										<span
											aria-hidden
											className="mt-2 size-1.5 shrink-0 rounded-full bg-lime"
										/>
										<span className="text-base text-foreground/90 leading-relaxed">
											{item}
										</span>
									</li>
								))}
							</ul>
						</section>
					)}

					{/* Slides */}
					{talk.primarySlideUrl && (
						<section className="mt-12">
							<div className="flex items-center justify-between gap-4 mb-5">
								<h2 className="display-md">Slides</h2>
								<a
									href={talk.primarySlideUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:gap-2.5 transition-all"
								>
									Open in new tab
									<ExternalLink className="size-4" />
								</a>
							</div>
							{embed ? (
								<div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
									<iframe
										src={embed}
										title={`${talk.title} slides`}
										loading="lazy"
										allowFullScreen
										className="absolute inset-0 h-full w-full"
									/>
								</div>
							) : null}
						</section>
					)}

					{/* Events table */}
					{events.length > 0 && (
						<section className="mt-14">
							<h2 className="display-md mb-5">
								Delivered{" "}
								{events.length === 1 ? "once" : `${events.length} times`}
							</h2>
							<div className="overflow-hidden rounded-2xl border border-border">
								<div className="hidden sm:grid grid-cols-[1.4fr_1fr_auto_auto] gap-4 px-5 py-3 bg-secondary font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
									<span>Event</span>
									<span>Organizer</span>
									<span className="text-right">Date</span>
									<span className="text-right">Reach</span>
								</div>
								<ul className="divide-y divide-border">
									{events.map((e) => (
										<li
											key={e.id}
											className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_auto_auto] gap-1 sm:gap-4 px-5 py-4 sm:items-center"
										>
											<span className="min-w-0">
												<span className="block text-sm font-medium text-foreground">
													{e.slideUrl ? (
														<a
															href={e.slideUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors"
														>
															{e.eventName}
															<ArrowUpRight className="size-3.5 text-muted-foreground" />
														</a>
													) : (
														e.eventName
													)}
												</span>
												{e.venue && (
													<span className="block text-xs text-muted-foreground">
														{e.venue}
													</span>
												)}
											</span>
											<span className="text-sm text-muted-foreground">
												{e.organizerName}
											</span>
											<span className="font-mono text-xs text-muted-foreground tabular-nums sm:text-right">
												{fmtDate(e.date)}
											</span>
											<span className="font-mono text-xs text-muted-foreground tabular-nums sm:text-right">
												{e.audienceSize > 0 ? `${e.audienceSize}` : "n/a"}
											</span>
										</li>
									))}
								</ul>
							</div>
						</section>
					)}
				</div>
			</article>

			{more.length > 0 && (
				<section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-border bg-secondary">
					<div className="max-w-6xl mx-auto">
						<h2 className="display-md mb-8">More talks</h2>
						<div className="grid sm:grid-cols-3 gap-6">
							{more.map((t: Talk) => (
								<Link
									key={t.slug}
									href={`/speaking/${t.slug}`}
									className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
								>
									<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
										{t.category}
									</span>
									<h3 className="font-display text-base font-semibold text-foreground leading-snug tracking-tight mt-3">
										{t.title}
									</h3>
								</Link>
							))}
						</div>
					</div>
				</section>
			)}
			<Footer />
		</main>
	);
}
