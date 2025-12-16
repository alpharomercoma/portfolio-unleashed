"use client";

import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import { Quote } from "lucide-react";
import { useEffect, useRef } from "react";

const recommendations = [
	{
		quote:
			"What distinguishes Alpha further is his remarkable humility and positive attitude. Despite his impressive credentials and achievements, he remains grounded and approachable, always willing to learn and grow. His blend of intellectual curiosity, leadership qualities, and character make him a standout individual.",
		author: "Justine Jude Pura",
		title: "CS Faculty",
		company: "FEU Tech",
		color: "var(--color-blue)",
	},
	{
		quote:
			"I can confidently say that he is an exceptional Webmaster with a forward-thinking mindset. Alpha never limited himself to his job responsibilities. Instead, he consistently ventured beyond his role, introducing ideas that greatly benefited the entire computer science community at FEU Tech.",
		author: "Guennevere Rito",
		title: "Vice President of External Affairs",
		company: "FEU Tech ACM",
		color: "var(--color-red)",
	},
	{
		quote:
			"Beyond his technical skills, Alpha was a collaborative and proactive member of the ACM Student Chapter, an academic organization for computer science, always contributing insightful ideas and fostering a positive environment.",
		author: "Abraham Magpantay",
		title: "Former Adviser",
		company: "FEU Tech ACM",
		color: "var(--color-yellow)",
	},
	{
		quote:
			"As Webmaster at FEU Tech ACM, He demonstrated exceptional leadership and technical skills. Also, his commitment to the ACM Beyond Campus Initiative positively impacted over a lot of people. Alpha's full-stack and back-end expertise, combined with a passion for education, make him an outstanding developer and team player.",
		author: "Rab Karl Colasino",
		title: "ACMX Lead",
		company: "FEU Tech ACMX",
		color: "var(--color-green)",
	},
	{
		quote:
			"Alpha consistently performs well academically. His work reflects a deep understanding of the material, and he consistently produces quality assignment. Alpha is exceptionally curious and displays a genuine eagerness to learn. He works well with his fellow classmates and is evident that he is a team player.",
		author: "Beau Gray Habal",
		title: "CS Faculty",
		company: "FEU Tech",
		color: "var(--color-blue)",
	},
	{
		quote:
			"I was Alpha's Computer Systems Architecture professor, but I didn't see him just as a student of CSA, he has always given an effort towards class work and goes beyond what is being asked. I had always admired how you go beyond what classes are always.",
		author: "Michelle Anne Constantino",
		title: "CS Faculty",
		company: "FEU Tech",
		color: "var(--color-red)",
	},
	{
		quote:
			"Mr. Alpha Romer is my data structure student. He is industrious and knowledgeable in computer programming. He is a multilingual person and a very competitive when it comes to project submissions. He can be a candidate for intern software development in the future of this school.",
		author: "Angelo Arguson, DIT",
		title: "CS Faculty",
		company: "FEU Tech",
		color: "var(--color-yellow)",
	},
	{
		quote:
			"Alpha Romer Coma, my student in design thinking, exhibits a profound passion for academic excellence, evident in the outstanding quality of his work. I eagerly anticipate witnessing his continued growth and achievements.",
		author: "Jeneffer Sabonsolin",
		title: "CS Faculty",
		company: "FEU Tech",
		color: "var(--color-green)",
	},
	{
		quote:
			"Alpha is an amazing team player, who always steps up his game especially in developing a program. He is really adept at adapting in unfavorable situations, and his skills to turn the tide in our team's favor is incredible.",
		author: "Xynil Jhed Lacap",
		title: "AI Engineer",
		company: "Boost Capital",
		color: "var(--color-blue)",
	},
	{
		quote:
			"Mr. Coma is a development-oriented person, as his passion for the field is unparalleled. His enthusiasm for sharing ideas and collaborating with colleagues fosters a dynamic and engaging work environment.",
		author: "John Kenneth Andales",
		title: "Software Engineer",
		company: "Samsung",
		color: "var(--color-red)",
	},
];

const ITEMS_PER_PAGE = 4;

export function RecommendationsSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
	} = useCarousel(recommendations, ITEMS_PER_PAGE);

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
			className="py-12 px-4 sm:px-6"
		>
			<div className="max-w-6xl mx-auto">
				<div className="flex items-end justify-between mb-6">
					<div>
						<h2
							className="animate-on-scroll opacity-0 text-2xl sm:text-3xl font-bold text-foreground mb-1"
							style={{ animationDelay: "100ms" }}
						>
							Recommendations
						</h2>
						<p
							className="animate-on-scroll opacity-0 text-sm text-muted-foreground"
							style={{ animationDelay: "150ms" }}
						>
							What colleagues say about working with me.
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
					{currentItems.map((rec, index) => (
						<div
							key={`${rec.author}-${currentPage}`}
							className="p-4 bg-secondary/50 rounded-xl border border-border hover:border-[var(--color-blue)]/30 transition-all group h-full flex flex-col"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 50}ms`,
								opacity: 0,
							}}
						>
							<Quote
								className="h-5 w-5 mb-2 shrink-0"
								style={{ color: rec.color, opacity: 0.5 }}
							/>
							<p className="text-sm text-foreground mb-3 leading-relaxed flex-1">
								"{rec.quote}"
							</p>
							<div className="flex items-center gap-2 mt-auto">
								<div
									className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
									style={{ backgroundColor: rec.color }}
								>
									{rec.author
										.split(" ")
										.map((n) => n[0])
										.join("")}
								</div>
								<div>
									<p className="font-medium text-foreground text-sm">
										{rec.author}
									</p>
									<p className="text-xs text-muted-foreground">
										{rec.title}, {rec.company}
									</p>
								</div>
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
