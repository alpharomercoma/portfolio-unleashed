"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { Talk } from "@/lib/talks/schema";
import { TalkCard } from "./talk-card";

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
			<div
				role="tablist"
				aria-label="Filter talks by category"
				className="flex flex-wrap gap-2 mb-10"
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
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{filtered.map((t) => (
					<TalkCard key={t.slug} talk={t} />
				))}
			</div>
		</>
	);
}
