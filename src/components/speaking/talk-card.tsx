import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { type Talk, latestEventDate } from "@/lib/talks/schema";

export function TalkCard({ talk }: { talk: Talk }) {
	const sessions = talk.events.length;
	const year = latestEventDate(talk).slice(0, 4);
	return (
		<Link
			href={`/speaking/${talk.slug}`}
			className="group flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
		>
			<div className="flex items-center justify-between gap-3 mb-4">
				<span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
					<span aria-hidden className="size-1.5 rounded-full bg-lime" />
					{talk.category}
				</span>
				{year && (
					<span className="font-mono text-xs text-muted-foreground tabular-nums">
						{year}
					</span>
				)}
			</div>
			<h3 className="font-display text-lg font-semibold text-foreground leading-snug tracking-tight">
				{talk.title}
			</h3>
			{talk.tagline && (
				<p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
					{talk.tagline}
				</p>
			)}
			<div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-border">
				<span className="font-mono text-[11px] text-muted-foreground">
					{talk.type} · {talk.level} · {sessions}{" "}
					{sessions === 1 ? "event" : "events"}
				</span>
				<ArrowUpRight className="size-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
			</div>
		</Link>
	);
}
