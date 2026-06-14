import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { type Talk, latestEventDate } from "@/lib/talks/schema";

export function TalkCard({ talk }: { talk: Talk }) {
	const sessions = talk.events.length;
	const year = latestEventDate(talk).slice(0, 4);
	return (
		<Link
			href={`/speaking/${talk.slug}`}
			className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-lime/70"
		>
			{/* Brand lime glow, intensifies on hover */}
			<span
				aria-hidden
				className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-lime/25 blur-2xl transition-all duration-300 group-hover:bg-lime/50"
			/>

			<div className="relative flex items-center justify-between gap-3 mb-5">
				<span className="inline-flex items-center rounded-full bg-lime px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink">
					{talk.category}
				</span>
				{year && (
					<span className="font-mono text-xs text-muted-foreground tabular-nums">
						{year}
					</span>
				)}
			</div>

			<h3 className="relative font-display text-xl font-semibold text-foreground leading-[1.15] tracking-tight">
				{talk.title}
			</h3>
			{talk.tagline && (
				<p className="relative mt-2.5 text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
					{talk.tagline}
				</p>
			)}

			<div className="relative mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border">
				<span className="font-mono text-[11px] text-muted-foreground">
					{talk.type} · {talk.level} · {sessions}{" "}
					{sessions === 1 ? "session" : "sessions"}
				</span>
				<ArrowUpRight className="size-4 shrink-0 text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
			</div>
		</Link>
	);
}
