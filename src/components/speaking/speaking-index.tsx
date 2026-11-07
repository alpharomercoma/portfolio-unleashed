"use client";

import { useMemo, useState } from "react";

import { TalkRow } from "@/components/speaking/talk-card";
import { type Talk, talksByYear } from "@/lib/talks/schema";
import { cn } from "@/lib/utils";

/** The full catalogue, one entry per talk, by year. */
export function SpeakingIndex({ talks }: { talks: Talk[] }) {
	const categories = useMemo(
		() => ["All", ...Array.from(new Set(talks.map((t) => t.category))).sort()],
		[talks],
	);
	const [active, setActive] = useState("All");
	const filtered =
		active === "All" ? talks : talks.filter((t) => t.category === active);

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

			{talksByYear(filtered).map(({ year, talks: group }) => (
				<section key={year} aria-labelledby={`talks-${year}`} className="mt-10">
					<h2 id={`talks-${year}`} className="display-md">
						{year}
					</h2>
					<ul className="mt-4 grid gap-x-12 lg:grid-cols-2">
						{group.map((t) => (
							<li key={t.slug} className="border-t border-border">
								<TalkRow talk={t} />
							</li>
						))}
					</ul>
				</section>
			))}
		</>
	);
}
