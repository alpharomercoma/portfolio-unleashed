"use client";

import { Quote } from "lucide-react";
import { useEffect, useRef } from "react";

import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import type { Recommendation } from "@/lib/collections/schema";

const PER_PAGE = 4; // 2 columns x 2 rows

function initials(name: string) {
	return name
		.replace(/,.*$/, "")
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("");
}

export function RecommendationsSection({
	recommendations,
}: {
	recommendations: Recommendation[];
}) {
	const sectionRef = useRef<HTMLElement>(null);
	const {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
		stopAutoRotate,
		isAutoRotating,
	} = useCarousel(recommendations, PER_PAGE);

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
			className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-secondary border-t border-border"
		>
			<div className="max-w-6xl mx-auto">
				<div className="animate-on-scroll opacity-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
					<div className="max-w-2xl">
						<h2 className="display-md">
							What faculty, mentors, and engineers say.
						</h2>
					</div>
					<CarouselControls
						currentPage={currentPage}
						totalPages={totalPages}
						onPrev={prevPage}
						onNext={nextPage}
						onUserInteraction={stopAutoRotate}
						isAutoRotating={isAutoRotating}
						className="shrink-0"
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
					{currentItems.map((rec, index) => (
						<figure
							key={`${rec.id}-${currentPage}`}
							className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-7"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 40}ms`,
								opacity: 0,
							}}
						>
							<Quote className="size-5 text-foreground mb-4 shrink-0" />
							<blockquote className="text-[15px] text-foreground leading-relaxed flex-1 line-clamp-5">
								{rec.quote}
							</blockquote>
							<figcaption className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
								<span className="flex size-9 items-center justify-center rounded-full bg-lime text-ink text-xs font-semibold shrink-0">
									{initials(rec.author)}
								</span>
								<span className="min-w-0">
									<span className="block text-sm font-medium text-foreground truncate">
										{rec.author}
									</span>
									<span className="block text-xs text-muted-foreground truncate">
										{rec.role}
									</span>
								</span>
							</figcaption>
						</figure>
					))}
				</div>

				<CarouselDots
					currentPage={currentPage}
					totalPages={totalPages}
					onGoToPage={goToPage}
					onUserInteraction={stopAutoRotate}
					className="mt-8"
				/>
			</div>
		</section>
	);
}
