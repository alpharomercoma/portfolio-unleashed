"use client";

import { Quote } from "lucide-react";
import { useEffect, useRef } from "react";

import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";

// LinkedIn recommendations from faculty, advisers, and industry colleagues.
// Wording preserved verbatim.
const recommendations = [
	{
		quote:
			"What distinguishes Alpha further is his remarkable humility and positive attitude. Despite his impressive credentials and achievements, he remains grounded and approachable, always willing to learn and grow. His blend of intellectual curiosity, leadership qualities, and character make him a standout individual.",
		author: "Justine Jude Pura",
		role: "CS Faculty, FEU Tech",
	},
	{
		quote:
			"I can confidently say that he is an exceptional Webmaster with a forward-thinking mindset. Alpha never limited himself to his job responsibilities. Instead, he consistently ventured beyond his role, introducing ideas that greatly benefited the entire computer science community at FEU Tech.",
		author: "Guennevere Rito",
		role: "VP of External Affairs, FEU Tech ACM",
	},
	{
		quote:
			"Beyond his technical skills, Alpha was a collaborative and proactive member of the ACM Student Chapter, an academic organization for computer science, always contributing insightful ideas and fostering a positive environment.",
		author: "Abraham Magpantay",
		role: "Former Adviser, FEU Tech ACM",
	},
	{
		quote:
			"As Webmaster at FEU Tech ACM, he demonstrated exceptional leadership and technical skills. His commitment to the ACM Beyond Campus Initiative positively impacted a lot of people. Alpha's full-stack and back-end expertise, combined with a passion for education, make him an outstanding developer and team player.",
		author: "Rab Karl Colasino",
		role: "ACMX Lead, FEU Tech ACMX",
	},
	{
		quote:
			"Alpha consistently performs well academically. His work reflects a deep understanding of the material, and he consistently produces quality assignments. Alpha is exceptionally curious and displays a genuine eagerness to learn. He works well with his classmates and it is evident that he is a team player.",
		author: "Beau Gray Habal",
		role: "CS Faculty, FEU Tech",
	},
	{
		quote:
			"I was Alpha's Computer Systems Architecture professor, but I didn't see him just as a student of CSA; he has always given an effort towards class work and goes beyond what is being asked. I have always admired how he goes beyond what classes require.",
		author: "Michelle Anne Constantino",
		role: "CS Faculty, FEU Tech",
	},
	{
		quote:
			"Mr. Alpha Romer is my data structures student. He is industrious and knowledgeable in computer programming. He is a multilingual person and very competitive when it comes to project submissions. He can be a candidate for software development internships in the future.",
		author: "Angelo Arguson, DIT",
		role: "CS Faculty, FEU Tech",
	},
	{
		quote:
			"Alpha Romer Coma, my student in design thinking, exhibits a profound passion for academic excellence, evident in the outstanding quality of his work. I eagerly anticipate witnessing his continued growth and achievements.",
		author: "Jeneffer Sabonsolin",
		role: "CS Faculty, FEU Tech",
	},
	{
		quote:
			"Alpha is an amazing team player who always steps up his game, especially in developing a program. He is really adept at adapting in unfavorable situations, and his ability to turn the tide in our team's favor is incredible.",
		author: "Xynil Jhed Lacap",
		role: "AI Engineer, Boost Capital",
	},
	{
		quote:
			"Mr. Coma is a development-oriented person, as his passion for the field is unparalleled. His enthusiasm for sharing ideas and collaborating with colleagues fosters a dynamic and engaging work environment.",
		author: "John Kenneth Andales",
		role: "Software Engineer, Samsung",
	},
];

const PER_PAGE = 4; // 2 columns x 2 rows

function initials(name: string) {
	return name
		.replace(/,.*$/, "")
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("");
}

export function RecommendationsSection() {
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
							key={`${rec.author}-${currentPage}`}
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
