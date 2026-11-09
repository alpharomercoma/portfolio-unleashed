"use client";

import { useId, useState } from "react";

import type { Recommendation } from "@/lib/collections/schema";
import { cn, splitQuote } from "@/lib/utils";

// One voice at a time, large. Its opening sentence is the headline (only its first
// clause when the sentence runs long) and the rest of the quote follows, never cut. The names sit above it: quotes differ in length, so
// below it they'd move under the finger, and on a phone the answer would change
// out of view.
export function RecommendationsSection({
	recommendations,
}: {
	recommendations: Recommendation[];
}) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const panelId = useId();
	const active =
		recommendations.find((r) => r.id === activeId) ?? recommendations[0];
	if (!active) return null;

	const { lead, rest } = splitQuote(active.quote);

	return (
		<section
			id="recommendations"
			aria-labelledby="recommendations-title"
			className="surface-ink mt-16 py-12 lg:mt-24 lg:py-16"
		>
			<div className="site-container">
				<h2
					id="recommendations-title"
					className="text-sm font-medium text-on-deep"
				>
					What people I&apos;ve worked with say
				</h2>

				{recommendations.length > 1 && (
					<div role="group" aria-label="Choose whose words to read">
						<ul className="nav-scroll -mx-(--gutter) mt-6 flex gap-2 overflow-x-auto px-(--gutter) sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
							{recommendations.map((r) => {
								const on = r.id === active.id;
								return (
									<li key={r.id} className="shrink-0">
										<button
											type="button"
											aria-pressed={on}
											aria-controls={panelId}
											onClick={() => setActiveId(r.id)}
											className={cn(
												"h-10 rounded-full border px-4 text-sm font-medium transition-colors",
												on
													? "border-white bg-white text-ink"
													: "border-white/50 text-white hover:bg-white/15",
											)}
										>
											{r.author.replace(/,.*$/, "")}
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				)}

				{/* The region stays mounted so the change is announced; the figure inside remounts
				    to play its entrance. */}
				<div
					id={panelId}
					aria-live="polite"
					aria-atomic="true"
					className="mt-8 lg:mt-10"
				>
					<figure key={active.id} className="quote-in">
						<blockquote>
							<p className="display-xl max-w-5xl text-pretty">{lead}</p>
							{rest && (
								<p className="mt-4 max-w-3xl leading-relaxed text-on-deep">
									{rest}
								</p>
							)}
						</blockquote>
						<figcaption className="mt-5">
							<span className="block font-medium">{active.author}</span>
							{active.role && (
								<span className="block text-sm text-on-deep">
									{active.role}
								</span>
							)}
						</figcaption>
					</figure>
				</div>
			</div>
		</section>
	);
}
