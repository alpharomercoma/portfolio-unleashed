import { ArrowUpRight, Mic } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { type Talk, latestEventDate } from "@/lib/talks/schema";

function metaLine(talk: Talk): string {
	const sessions = talk.events.length;
	return [
		talk.type,
		talk.level,
		`${sessions} ${sessions === 1 ? "session" : "sessions"}`,
	]
		.filter(Boolean)
		.join(" · ");
}

const chip =
	"inline-flex items-center rounded-full bg-lime px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink";

/** Cover image with a branded fallback for talks that have no showcase image. */
function TalkCover({
	talk,
	sizes,
	priority,
}: {
	talk: Talk;
	sizes: string;
	priority?: boolean;
}) {
	if (!talk.showcaseImage) {
		return (
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-lime/45 via-lime/15 to-transparent">
				<Mic className="size-6 text-ink/45" />
				<span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/70">
					{talk.category}
				</span>
			</div>
		);
	}
	return (
		<Image
			src={talk.showcaseImage}
			alt={talk.title}
			fill
			sizes={sizes}
			priority={priority}
			className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
		/>
	);
}

/** Large image-led lead, mirroring the blog hero post. */
export function FeaturedTalk({ talk }: { talk: Talk }) {
	const year = latestEventDate(talk).slice(0, 4);
	return (
		<Link href={`/speaking/${talk.slug}`} className="group block">
			<div className="relative aspect-[16/9] md:aspect-[5/2] overflow-hidden rounded-3xl border border-border bg-secondary">
				<TalkCover
					talk={talk}
					sizes="(min-width: 1024px) 72rem, 100vw"
					priority
				/>
				<span
					aria-hidden
					className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-lime/20 blur-3xl transition-all duration-500 group-hover:bg-lime/35"
				/>
			</div>

			<div className="mt-7 md:grid md:grid-cols-[1.5fr_1fr] md:gap-x-12 lg:gap-x-16">
				<div>
					<div className="flex items-center gap-3 mb-4">
						<span className={chip}>{talk.category}</span>
						{year && (
							<span className="font-mono text-xs text-muted-foreground tabular-nums">
								{year}
							</span>
						)}
					</div>
					<h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.05] tracking-tight text-foreground text-balance group-hover:underline decoration-lime/60 underline-offset-[6px]">
						{talk.title}
					</h2>
				</div>
				<div className="mt-4 md:mt-1.5">
					{talk.tagline && <p className="lede text-pretty">{talk.tagline}</p>}
					<div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
						<span>{metaLine(talk)}</span>
						<ArrowUpRight className="size-4 shrink-0 text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
					</div>
				</div>
			</div>
		</Link>
	);
}

/** Spacious editorial row: side thumbnail + descriptive text. */
export function TalkRow({ talk }: { talk: Talk }) {
	const year = latestEventDate(talk).slice(0, 4);
	return (
		<Link
			href={`/speaking/${talk.slug}`}
			className="group grid items-center gap-5 py-8 sm:grid-cols-[minmax(0,17rem)_1fr] sm:gap-8 sm:py-10"
		>
			<div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-secondary">
				<TalkCover talk={talk} sizes="(min-width: 640px) 17rem, 100vw" />
			</div>
			<div className="min-w-0">
				<div className="mb-3 flex items-center gap-3">
					<span className={chip}>{talk.category}</span>
					{year && (
						<span className="font-mono text-xs text-muted-foreground tabular-nums">
							{year}
						</span>
					)}
				</div>
				<h3 className="font-display text-2xl sm:text-[1.7rem] font-semibold leading-[1.12] tracking-tight text-foreground group-hover:underline decoration-lime/60 underline-offset-4">
					{talk.title}
				</h3>
				{talk.tagline && (
					<p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground line-clamp-2">
						{talk.tagline}
					</p>
				)}
				<div className="mt-5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
					<span>{metaLine(talk)}</span>
					<ArrowUpRight className="size-4 shrink-0 text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
				</div>
			</div>
		</Link>
	);
}
