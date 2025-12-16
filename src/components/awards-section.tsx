"use client";

import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useEffect, useRef } from "react";

const awards = [
	{
		title: "PH100 | 100 brightest minds of The Philippines",
		organization: "Stellar PH",
		year: "2025",
		color: "var(--color-yellow)",
		image: "ph100.png",
	},
	{
		title: "National AI Prompt Design Challenge PH 2025 Champion",
		organization: "Straits Interactive",
		year: "2025",
		color: "var(--color-blue)",
		image: "naipdc.jpg",
	},
	{
		title:
			"Philippine Junior Data Science Challenge Finalist & GlobalCo Special Awards",
		organization: "UP Data Science Society",
		year: "2024",
		color: "var(--color-red)",
		image: "pjdsc.jpg",
	},
	{
		title: "Codetober: Web Development Champions",
		organization: "FEU Tech AITS",
		year: "2024",
		color: "var(--color-green)",
		image: "codetober.png",
	},
	{
		title: "Algolympics 2024 Finalist",
		organization: "UP Diliman ACM Student Chapter",
		year: "2024",
		color: "var(--color-blue)",
		image: "algolympics.png",
	},
	{
		title: "Space Apps 2023 Global Nominee",
		organization: "NASA Space Apps Challenge",
		year: "2023",
		color: "var(--color-red)",
		image: "nasa_nominee_23.png",
	},
	{
		title: "Nihongojin Across the Philippines Essay Luzon Winner",
		organization: "Japan Foundation",
		year: "2023",
		color: "var(--color-green)",
		image: "nihongojin.png",
	},
	{
		title: "Nihongo Stories Featured Learner",
		organization: "Japan Foundation",
		year: "2023",
		color: "var(--color-blue)",
		image: "nihongo_stories.png",
	},
	{
		title: "Japanese Language Proficiency Test N3",
		organization: "Japan Foundation",
		year: "2023",
		color: "var(--color-yellow)",
		image: "jlpt_n3.png",
	},
	{
		title: "Mandarin Chinese YCT Level 2",
		organization: "Confucius Institute",
		year: "2017",
		color: "var(--color-red)",
		image: "yct2.jpg",
	},
];

const ITEMS_PER_PAGE = 4;

export function AwardsSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
	} = useCarousel(awards, ITEMS_PER_PAGE);

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
			id="awards"
			className="py-12 px-4 sm:px-6 bg-secondary/30"
		>
			<div className="max-w-6xl mx-auto">
				<div className="flex items-end justify-between mb-6">
					<div>
						<h2
							className="animate-on-scroll opacity-0 text-2xl sm:text-3xl font-bold text-foreground mb-1"
							style={{ animationDelay: "100ms" }}
						>
							Awards
						</h2>
						<p
							className="animate-on-scroll opacity-0 text-sm text-muted-foreground"
							style={{ animationDelay: "150ms" }}
						>
							Recognition for contributions to AI/ML.
						</p>
					</div>

					<CarouselControls
						currentPage={currentPage}
						totalPages={totalPages}
						onPrev={prevPage}
						onNext={nextPage}
						className="animate-on-scroll opacity-0"
					/>
				</div>

				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{currentItems.map((award, index) => (
						<div
							key={`${award.title}-${currentPage}`}
							className="bg-background rounded-xl border border-border hover:border-[var(--color-blue)]/30 transition-all group overflow-hidden"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 50}ms`,
								opacity: 0,
							}}
						>
							<div className="relative h-40 overflow-hidden bg-secondary/10">
								<Image
									src={"/awards/" + award.image || "/placeholder.svg"}
									alt={award.title}
									fill
									className="object-cover group-hover:scale-105 transition-transform duration-500"
								/>
								<div
									className="absolute top-3 left-3 w-2 h-2 rounded-full"
									style={{ backgroundColor: award.color }}
								/>
							</div>
							<div className="p-4">
								<h3 className="font-medium text-foreground text-sm group-hover:text-[var(--color-blue)] transition-colors">
									{award.title}
								</h3>
								<p className="text-xs text-muted-foreground mt-1">
									{award.organization} • {award.year}
								</p>
							</div>
						</div>
					))}
				</div>

				<CarouselDots
					currentPage={currentPage}
					totalPages={totalPages}
					onGoToPage={goToPage}
					className="mt-4"
				/>
			</div>
		</section>
	);
}
