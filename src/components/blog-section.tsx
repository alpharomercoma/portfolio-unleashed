"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const blogPosts = [
	{
		title: "My US B-1 Business VISA Application Experience",
		excerpt:
			"Heading to the US for a business conference from the Philippines? Here's how to navigate the B-1 VISA application.",
		date: "Jan 28, 2024",
		readTime: "6 min",
		category: "Business",
		color: "var(--color-red)",
		image: "b1-visa.png",
		link: "https://alphacoma.com/blog/my-us-b-1-business-visa-application-experience",
	},
	{
		title: "Crafting the Winning Prompt of National AI Prompt Design Challenge",
		excerpt:
			"Explore the technique breakdown of the winning application of NAIPDC PH 2025, Kasanayan Navigator",
		date: "Feb 15, 2024",
		readTime: "6 min",
		category: "Prompt Engineering",
		color: "var(--color-blue)",
		image: "naipdc.jpg",
		link: "https://alphacoma.com/blog/crafting-the-winning-prompt-of-national-ai-prompt-design-challenge",
	},
	{
		title: "Definitive Guide to Computer Science Thesis at FEU Tech",
		excerpt:
			"Conquer FEU Tech's 4-part CS thesis with proven tips on team-building, algorithms, defenses, datasets, and strategic AI and cloud resources.",
		date: "Jan 10, 2024",
		readTime: "8 min",
		category: "Education",
		color: "var(--color-green)",
		image: "thesis.png",
		link: "https://alphacoma.com/blog/definitive-guide-to-computer-science-thesis-at-feu-tech",
	},
];

export function BlogSection() {
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
			id="blog"
			className="py-12 px-4 sm:px-6 bg-secondary/30"
		>
			<div className="max-w-6xl mx-auto">
				<div className="flex items-end justify-between mb-6">
					<div>
						<h2
							className="animate-on-scroll opacity-0 text-2xl sm:text-3xl font-bold text-foreground mb-1"
							style={{ animationDelay: "100ms" }}
						>
							Blog
						</h2>
						<p
							className="animate-on-scroll opacity-0 text-sm text-muted-foreground"
							style={{ animationDelay: "150ms" }}
						>
							Thoughts on AI/ML and engineering.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="animate-on-scroll opacity-0 rounded-full h-8 text-xs bg-transparent"
						style={{ animationDelay: "200ms" }}
						asChild
					>
						<Link href="/blog">
							All Posts <ArrowRight className="ml-1 h-3 w-3" />
						</Link>
					</Button>
				</div>

				<div className="grid sm:grid-cols-3 gap-4">
					{blogPosts.map((post, index) => (
						<Link
							key={post.title}
							href={post.link}
							className="animate-on-scroll opacity-0 bg-background rounded-xl border border-border hover:border-[var(--color-blue)]/30 transition-all group block overflow-hidden"
							style={{ animationDelay: `${(index + 1) * 50}ms` }}
						>
							<div className="relative h-40 overflow-hidden bg-secondary/10">
								<Image
									src={"/blog/" + post.image || "/placeholder.svg"}
									alt={post.title}
									fill
									className="object-cover group-hover:scale-105 transition-transform duration-500"
								/>
							</div>
							<div className="p-4">
								<span
									className="text-[10px] font-medium px-2 py-0.5 rounded-full"
									style={{
										backgroundColor: `color-mix(in oklch, ${post.color} 15%, transparent)`,
										color: post.color,
									}}
								>
									{post.category}
								</span>
								<h3
									className={
										"font-medium text-foreground text-base mt-2 mb-1 group-hover:text-[var(--color-blue)] transition-colors line-clamp-2"
									}
								>
									{post.title}
								</h3>
								<p className="text-sm text-muted-foreground mb-2 line-clamp-3">
									{post.excerpt}
								</p>
								<div className="flex items-center justify-between text-[10px] text-muted-foreground">
									<span>{post.date}</span>
									<span className="flex items-center gap-1">
										<Clock className="h-3 w-3" /> {post.readTime}
									</span>
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
