"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SiteImage } from "@/components/site-image";
import { TalkRow } from "@/components/speaking/talk-card";
import { lastGiven } from "@/components/speaking/talk-meta";
import type { Talk } from "@/lib/talks/schema";
import { cn } from "@/lib/utils";

export function SpeakingIndex({ talks }: { talks: Talk[] }) {
	const categories = useMemo(
		() => ["All", ...Array.from(new Set(talks.map((t) => t.category))).sort()],
		[talks],
	);
	const [active, setActive] = useState("All");
	const filtered =
		active === "All" ? talks : talks.filter((t) => t.category === active);
	// Lead with a talk that has a cover, so the top card is never an empty box.
	const lead = filtered.find((t) => t.showcaseImage) ?? filtered[0];
	const rest = filtered.filter((t) => t !== lead);

	return (
		<>
			<fieldset className="min-w-0">
				<legend className="sr-only">Filter talks by category</legend>
				<div className="flex flex-wrap gap-2">
					{categories.map((c) => {
						const on = c === active;
						return (
							<button
								key={c}
								type="button"
								aria-pressed={on}
								onClick={() => setActive(c)}
								className={cn(
									"h-10 rounded-full border px-4 text-sm font-medium transition-colors",
									on
										? "border-brand bg-brand text-white"
										: "border-input text-foreground hover:bg-accent",
								)}
							>
								{c}
							</button>
						);
					})}
				</div>
			</fieldset>
			<p role="status" className="mt-4 text-sm text-muted-foreground">
				{filtered.length} {filtered.length === 1 ? "talk" : "talks"}
				{active === "All" ? "" : ` in ${active}`}
			</p>

			{lead && (
				<article className="mt-8 grid overflow-hidden rounded-[1.75rem] border border-border lg:grid-cols-[1.1fr_1fr]">
					<div className="relative aspect-video bg-secondary">
						{lead.showcaseImage && (
							<SiteImage
								src={lead.showcaseImage}
								alt=""
								fill
								priority
								sizes="(min-width: 1024px) 40rem, 100vw"
								className="object-cover"
							/>
						)}
					</div>
					<div className="flex flex-col justify-center p-8 sm:p-10">
						<p className="text-sm text-muted-foreground">{lastGiven(lead)}</p>
						<h2 className="display-md mt-3">
							<Link href={`/speaking/${lead.slug}`} className="text-link">
								{lead.title}
							</Link>
						</h2>
						{lead.tagline && (
							<p className="mt-4 text-muted-foreground">{lead.tagline}</p>
						)}
					</div>
				</article>
			)}

			{rest.length > 0 && (
				<ul className="mt-10 grid gap-x-12 lg:grid-cols-2">
					{rest.map((t) => (
						<li key={t.slug} className="border-t border-border">
							<TalkRow talk={t} headingLevel="h2" showTagline />
						</li>
					))}
				</ul>
			)}
		</>
	);
}
