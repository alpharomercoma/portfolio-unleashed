"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { Talk } from "@/lib/talks/schema";
import { FeaturedTalk, TalkRow } from "./talk-list";

export function SpeakingIndex({ talks }: { talks: Talk[] }) {
	const categories = useMemo(
		() => ["All", ...Array.from(new Set(talks.map((t) => t.category))).sort()],
		[talks],
	);
	const [active, setActive] = useState("All");
	const filtered =
		active === "All" ? talks : talks.filter((t) => t.category === active);
	// Lead with an image-backed talk so the hero never falls back to a blank
	// placeholder; the rest keep their chronological order.
	const lead = filtered.find((t) => t.showcaseImage) ?? filtered[0];
	const rest = filtered.filter((t) => t !== lead);

	return (
		<>
			<div
				role="tablist"
				aria-label="Filter talks by category"
				className="flex flex-wrap gap-2 mb-12"
			>
				{categories.map((c) => {
					const on = c === active;
					return (
						<button
							key={c}
							type="button"
							role="tab"
							aria-selected={on}
							onClick={() => setActive(c)}
							className={cn(
								"rounded-full px-4 h-9 text-sm font-medium transition-all border",
								on
									? "bg-foreground text-background border-foreground"
									: "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground",
							)}
						>
							{c}
						</button>
					);
				})}
			</div>

			{lead ? (
				<>
					<FeaturedTalk talk={lead} />
					{rest.length > 0 && (
						<div className="mt-14 sm:mt-16 divide-y divide-border border-t border-border">
							{rest.map((t) => (
								<TalkRow key={t.slug} talk={t} />
							))}
						</div>
					)}
				</>
			) : (
				<div className="rounded-2xl border border-border bg-secondary p-10 text-center">
					<p className="text-sm text-muted-foreground">
						No talks in this category yet.
					</p>
				</div>
			)}
		</>
	);
}
