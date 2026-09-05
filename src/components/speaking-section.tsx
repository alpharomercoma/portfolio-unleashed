"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { TalkCard } from "@/components/speaking/talk-card";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import type { Talk } from "@/lib/talks/schema";

export function SpeakingSection({
	talks,
	total,
}: {
	talks: Talk[];
	total: number;
}) {
	const sectionRef = useReveal<HTMLElement>();

	if (talks.length === 0) return null;

	return (
		<section
			ref={sectionRef}
			id="speaking"
			className="dark bg-background text-foreground py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8"
		>
			<div className="max-w-6xl mx-auto">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-16">
					<div className="max-w-3xl">
						<h2
							className="animate-on-scroll opacity-0 display-lg"
							style={{ animationDelay: "100ms" }}
						>
							From PyTorch Conference Europe to{" "}
							<span className="text-lime">community stages</span>.
						</h2>
						<p
							className="animate-on-scroll opacity-0 lede mt-4"
							style={{ animationDelay: "150ms" }}
						>
							{total} talks and workshops on AI, accelerated computing, and
							developer tools, for the Linux Foundation and for Microsoft,
							Google, and AWS community events.
						</p>
					</div>
					<Button
						asChild
						variant="outline"
						className="animate-on-scroll opacity-0 shrink-0"
						style={{ animationDelay: "200ms" }}
					>
						<Link href="/speaking">
							All {total} talks
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</div>

				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{talks.map((talk, i) => (
						<div
							key={talk.slug}
							className="animate-on-scroll opacity-0"
							style={{ animationDelay: `${(i + 2) * 70}ms` }}
						>
							<TalkCard talk={talk} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
