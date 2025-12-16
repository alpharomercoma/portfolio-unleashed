"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const featuredPosts = [
	{
		id: 1,
		title: "Crafting the Winning Prompt of National AI Prompt Design Challenge",
		description:
			"Explore the technique breakdown of the winning application of NAIPDC PH 2025, Kasanayan Navigator. From Model Selection, Chain-of-Thought, XML Tags, security/fact-checking protocols, engagement tactics, and beyond.",
		image: "naipdc.jpg",
		category: "Software Engineering",
		color: "var(--color-blue)",
		href: "https://alpharomer.vercel.app/blog/crafting-the-winning-prompt-of-national-ai-prompt-design-challenge",
	},
	{
		id: 2,
		title: "Supercharge your ML Research with Google TPU Research Cloud",
		description:
			"How AI is transforming software development workflows and boosting productivity.",
		image: "tpu.png",
		category: "Machine Learning",
		color: "var(--color-red)",
		href: "https://docs.google.com/presentation/d/1C6ccqrJz--90Po2eo1G8F4Uko0TOejT6SNwInZswiJ4",
	},
	{
		id: 3,
		title: "AWS re:Invent 2025 All Builders Welcome Grant Experience",
		description:
			"A deep dive into transformer architectures and training techniques for production-ready LLMs.",
		image: "reinvent25.png",
		category: "Leadership",
		color: "var(--color-yellow)",
		href: "https://www.linkedin.com/posts/alpharomercoma_what-an-exceptional-q4-so-far-1-conference-activity-7403666560558522368-1Vl3?utm_source=share&utm_medium=member_desktop&rcm=ACoAADzegpgBjqet1h1qWydacUd5Gy-94wQGIOo",
	},
	{
		id: 4,
		title:
			"GitHub Universe'25 Recap from az:Repo at Microsoft Office Philippines",
		description:
			"Explore the technique breakdown of the winning application of NAIPDC PH 2025, Kasanayan Navigator. From Model Selection, Chain-of-Thought, XML Tags, security/fact-checking protocols, engagement tactics, and beyond.",
		image: "azrepo.jpg",
		category: "Cloud Computing",
		color: "var(--color-green)",
		href: "https://docs.google.com/presentation/d/1V4pM8MyWvL7RDXvM-_AKTCWY1SrnylaAmJcO-tjsS94/edit?usp=sharing",
	},
];

export function FeaturedSection() {
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
			id="featured"
			className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50/50"
		>
			<div className="max-w-7xl mx-auto">
				<div className="animate-on-scroll opacity-0 text-center mb-8 sm:mb-12">
					<h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
						Featured Work
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						Highlights from my recent projects and research
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6">
					{featuredPosts.map((post, index) => (
						<Link
							key={post.id}
							href={post.href}
							className="animate-on-scroll opacity-0 group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
							style={{ animationDelay: `${index * 100}ms` }}
						>
							{/* Image container */}
							{/* center */}
							<div className="relative aspect-video overflow-hidden">
								<Image
									src={"/featured/" + post.image || "/placeholder.svg"}
									alt={post.title}
									fill
									className="object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								{/* Category badge */}
								<div
									className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium text-white"
									style={{ backgroundColor: post.color }}
								>
									{post.category}
								</div>
							</div>

							{/* Content */}
							<div className="p-4 sm:p-5">
								<h3
									className={
										"text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-[var(--color-blue)] transition-colors"
									}
								>
									{post.title}
								</h3>
								{/* <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.description}</p> */}
								<div
									className="flex items-center text-sm font-medium"
									style={{ color: post.color }}
								>
									Read more
									<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</div>
							</div>

							{/* Bottom color accent line */}
							<div
								className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
								style={{ backgroundColor: post.color }}
							/>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
