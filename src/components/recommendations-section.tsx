"use client";

import { ArrowUpRight, Quote } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

// A short, curated strip: faculty, a Samsung engineer, and a startup AI
// engineer. The full set lives on LinkedIn (linked below). Quotes trimmed for
// scannability; wording preserved.
const recommendations = [
	{
		quote:
			"His blend of intellectual curiosity, leadership qualities, and character make him a standout individual.",
		author: "Justine Jude Pura",
		title: "CS Faculty, FEU Tech",
	},
	{
		quote:
			"A development-oriented person whose passion for the field is unparalleled; his enthusiasm for sharing ideas fosters a dynamic, engaging environment.",
		author: "John Kenneth Andales",
		title: "Software Engineer, Samsung",
	},
	{
		quote:
			"An amazing team player who steps up his game. His ability to turn the tide in our team's favor is incredible.",
		author: "Xynil Jhed Lacap",
		title: "AI Engineer, Boost Capital",
	},
];

function initials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("");
}

export function RecommendationsSection() {
	const sectionRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("animate-fade-up");
					}
				});
			},
			{ threshold: 0.1 },
		);
		const elements = sectionRef.current?.querySelectorAll(".animate-on-scroll");
		elements?.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, []);

	return (
		<section
			ref={sectionRef}
			id="recommendations"
			className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 border-t border-border"
		>
			<div className="max-w-6xl mx-auto">
				<div className="animate-on-scroll opacity-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
					<div className="max-w-2xl">
						<p className="eyebrow mb-4">Recommendations</p>
						<h2 className="display-md">
							What faculty, mentors, and engineers say.
						</h2>
					</div>
					<Link
						href="https://www.linkedin.com/in/alpharomercoma/details/recommendations/"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:gap-2.5 transition-all shrink-0"
					>
						All 16 on LinkedIn
						<ArrowUpRight className="size-4" />
					</Link>
				</div>

				<div className="grid md:grid-cols-3 gap-6">
					{recommendations.map((rec, index) => (
						<figure
							key={rec.author}
							className="animate-on-scroll opacity-0 flex flex-col rounded-3xl border border-border bg-card p-7 sm:p-8"
							style={{ animationDelay: `${index * 80}ms` }}
						>
							<Quote className="size-6 text-foreground mb-5 shrink-0" />
							<blockquote className="text-[15px] text-foreground leading-relaxed flex-1">
								{rec.quote}
							</blockquote>
							<figcaption className="flex items-center gap-3 mt-7 pt-6 border-t border-border">
								<span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground shrink-0">
									{initials(rec.author)}
								</span>
								<span className="min-w-0">
									<span className="block text-sm font-medium text-foreground truncate">
										{rec.author}
									</span>
									<span className="block text-xs text-muted-foreground truncate">
										{rec.title}
									</span>
								</span>
							</figcaption>
						</figure>
					))}
				</div>
			</div>
		</section>
	);
}
