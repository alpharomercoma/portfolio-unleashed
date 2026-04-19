"use client";

import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useEffect, useRef } from "react";

type Award = {
	title: string;
	organization: string;
	year: string;
	color: string;
	image: string;
	context: string;
	category: "AI & Research" | "Hackathon" | "Language" | "Recognition";
};

const awards: Award[] = [
	{
		title: "PH100: 100 Brightest Minds of the Philippines",
		organization: "Stellar PH",
		year: "2025",
		color: "var(--color-yellow)",
		image: "ph100.png",
		context:
			"Inducted into Stellar PH's inaugural cohort of the 100 brightest young minds across industries, chosen from a nationwide pool of nominees.",
		category: "Recognition",
	},
	{
		title: "National AI Prompt Design Challenge PH Champion",
		organization: "Straits Interactive",
		year: "2025",
		color: "var(--color-blue)",
		image: "naipdc.jpg",
		context:
			"Won nationally with Kasanayan Navigator, a chatbot that upskills and reskills Filipinos toward their desired role using chain-of-thought and guardrailed prompt design.",
		category: "AI & Research",
	},
	{
		title: "Philippine Junior Data Science Challenge Finalist",
		organization: "UP Data Science Society",
		year: "2024",
		color: "var(--color-red)",
		image: "pjdsc.jpg",
		context:
			"Finalist and recipient of the GlobalCo Special Award for Para Po!, a public transport route optimizer with an incentivized carbon footprint reduction program.",
		category: "AI & Research",
	},
	{
		title: "Codetober Web Development Champions",
		organization: "FEU Tech AITS",
		year: "2024",
		color: "var(--color-green)",
		image: "codetober.png",
		context:
			"Shipped Kape ni Rab, a full coffee shop site, in 48 hours to take the championship at the FEU Tech Alliance of IT Students' annual dev challenge.",
		category: "Hackathon",
	},
	{
		title: "Algolympics Finalist",
		organization: "UP Diliman ACM Student Chapter",
		year: "2024",
		color: "var(--color-blue)",
		image: "algolympics.png",
		context:
			"Finalist at the premier competitive programming tournament of the University of the Philippines Diliman ACM Student Chapter.",
		category: "Hackathon",
	},
	{
		title: "NASA Space Apps Challenge Global Nominee",
		organization: "NASA",
		year: "2023",
		color: "var(--color-red)",
		image: "nasa_nominee_23.png",
		context:
			"Globally nominated with Fireguard, a satellite-driven, community-based fire management system addressing recurring fire incidents across the Philippines.",
		category: "Hackathon",
	},
	{
		title: "Nihongojin Across the Philippines Luzon Winner",
		organization: "Japan Foundation",
		year: "2023",
		color: "var(--color-green)",
		image: "nihongojin.png",
		context:
			"Won the Luzon regional essay contest celebrating Filipinos learning Japanese, judged by the Japan Foundation, Manila.",
		category: "Language",
	},
	{
		title: "Nihongo Stories Featured Learner",
		organization: "Japan Foundation",
		year: "2023",
		color: "var(--color-blue)",
		image: "nihongo_stories.png",
		context:
			"Featured as one of the Japan Foundation's standout learners, celebrated for a journey from anime fandom to proficient cultural translator.",
		category: "Language",
	},
	{
		title: "Japanese Language Proficiency Test N3",
		organization: "Japan Foundation",
		year: "2023",
		color: "var(--color-yellow)",
		image: "jlpt_n3.png",
		context:
			"Passed the JLPT N3, the intermediate tier of the internationally standardized Japanese proficiency examination.",
		category: "Language",
	},
];

const ITEMS_PER_PAGE = 4;
const AUTO_ROTATE_INTERVAL = 6000;

export function AwardsSection() {
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
	} = useCarousel(awards, ITEMS_PER_PAGE, AUTO_ROTATE_INTERVAL);

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
			className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50/60"
		>
			<div className="max-w-6xl mx-auto">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-16">
					<div className="max-w-3xl">
						<p className="animate-on-scroll opacity-0 eyebrow mb-4">
							Awards & recognition
						</p>
						<h2
							className="animate-on-scroll opacity-0 display-lg mb-4"
							style={{ animationDelay: "100ms" }}
						>
							Named to Stellar PH&apos;s PH100 and the national AI champion.
						</h2>
						<p
							className="animate-on-scroll opacity-0 lede"
							style={{ animationDelay: "150ms" }}
						>
							Recognition spanning AI research, hackathons, software
							competitions, and language proficiency.
						</p>
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

				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
					{currentItems.map((award, index) => (
						<article
							key={`${award.title}-${currentPage}`}
							className="flex flex-col rounded-3xl overflow-hidden bg-white border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)]"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 50}ms`,
								opacity: 0,
							}}
						>
							<div
								className="relative aspect-[4/3] overflow-hidden"
								style={{
									backgroundColor: `color-mix(in oklch, ${award.color} 10%, white)`,
								}}
							>
								<Image
									src={"/awards/" + award.image}
									alt={award.title}
									fill
									className="object-cover"
								/>
							</div>
							<div className="flex flex-col flex-1 p-5 sm:p-6">
								<div className="flex items-center justify-between gap-2 mb-3">
									<span
										className="inline-flex items-center rounded-full text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5"
										style={{
											backgroundColor: `color-mix(in oklch, ${award.color} 14%, white)`,
											color: award.color,
										}}
									>
										{award.category}
									</span>
									<span className="text-xs font-medium text-muted-foreground">
										{award.year}
									</span>
								</div>
								<h3 className="font-semibold text-foreground text-[15px] leading-snug tracking-tight mb-1.5">
									{award.title}
								</h3>
								<p className="text-xs font-medium text-muted-foreground mb-3">
									{award.organization}
								</p>
								<p className="text-xs text-muted-foreground leading-relaxed">
									{award.context}
								</p>
							</div>
						</article>
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
