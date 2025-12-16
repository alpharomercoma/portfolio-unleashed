"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import { ExternalLink, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const projects = [
	{
		title: "TypeScript JobSpy",
		description:
			"TypeScript job scraping library that aggregates job postings from popular job boards. Scrapes ~7200 jobs per minute with 100% success rate across 60+ countries in any industry.",
		tags: ["TypeScript", "NPM", "Web Scraping"],
		github: "https://github.com/alpharomercoma/ts-jobspy",
		demo: "https://www.npmjs.com/package/ts-jobspy",
		color: "var(--color-blue)",
		image: "ts-jobspy.png",
	},
	{
		title: "Visual Qwen",
		description:
			"A 92% accurate novel Vision-Language Model to detect cognitively-degrading video content. 10 machine learning experts, 20 content creators, 20 content moderators, & 3 data scientists",
		tags: ["PyTorch", "TPU", "Google Cloud"],
		github: "https://github.com/alpharomercoma/micromarc",
		demo: "https://micromarc.vercel.app/",
		color: "var(--color-red)",
		image: "visual-qwen.png",
	},
	{
		title: "Multimodal Sludge Dataset",
		description:
			"A novel dataset of scraped 2000+ multimodal (text, video, audio) dataset of cognitively-degrading content fron TikTok and YouTube, created in a human-in-the-loop and synthetic data generation pipeline.",
		tags: ["Dataset", "Synthetic Data Generation", "Human-in-the-Loop"],
		github:
			"https://gist.github.com/NoctisDEV/e253977d65c5a18f7902ac984d1107e6",
		demo: "https://www.kaggle.com/datasets/jobisaacong/tiktok-sludge-dataset-500/",
		color: "var(--color-green)",
		image: "sludge-dataset.png",
	},
	{
		title: "FEU Tech ACMX",
		description:
			"The official and premier cross-platform application of The FEU Tech ACM, serving 4,000+ Tamaraw students and automating 90,000+ undertakings annually. Released on major stores including Google Play Store, Microsoft Store, Xiaomi GetApps, & Huawei App Gallery",
		tags: ["NextJS", "ShadcnUI", "Vercel"],
		github: "https://github.com/FEUTechACMX/acmx",
		demo: "https://acmx.vercel.app",
		color: "var(--color-red)",
		image: "acmx.png",
	},
	{
		title: "Para Po!",
		description:
			"Para Po! is an award-winning project recognized as a finalist and recipient of the GlobalCo Special Award at the Philippine Junior Data Science Challenge in November 2024.",
		tags: ["NextJS", "Geospatial Mapping", "Data Science"],
		github: "https://github.com/alpharomercoma/para-po",
		demo: "https://parapo.vercel.app",
		color: "var(--color-yellow)",
		image: "para-po.png",
	},
	{
		title: "Project NATURE of NASA '24",
		description:
			"An interactive 3D Globe/Map storytelling platform aiming to educate about factors that significantly contribute to climate change by simplifying the data available on the U.S. Greenhouse Gas Center website and other sources.",
		tags: ["NextJS", "Data Visualization", "Data Science"],
		github: "https://github.com/FEUTechACM/NASA-hackathon-2024",
		demo: "https://projectnature.vercel.app",
		color: "var(--color-green)",
		image: "project-nature.png",
	},
	{
		title: "Markdown Studio",
		description:
			"Modern cross-platform note-taking & blogging application with 200+ users on Google Play Store and Microsoft Store",
		tags: ["MongoDB", "ReactJS", "ExpressJS", "NodeJS"],
		github: "http://github.com/alpharomercoma/mdstudio",
		demo: "https://markdownstudio.vercel.app/",
		color: "var(--color-blue)",
		image: "mdstudio.png",
	},
	{
		title: "Kape ni Rab",
		description:
			"Kape ni Rab! was the champion website developed in just two days during the Codetober: Web Development Competition hosted by the FEU Tech Alliance of Information Technology Students in October 2024.",
		tags: ["NextJS", "ShadcnUI", "Vercel"],
		github: "http://github.com/alpharomercoma/kape",
		demo: "https://alpharomercoma.github.io/kape",
		color: "var(--color-red)",
		image: "kape-ni-rab.png",
	},
	{
		title: "MyMNHS",
		description:
			"MyMNHS was the unofficial platform of Meycauayan National High School, completed with a real-time chat feature, announcements, and forums",
		tags: ["React", "ExpressJS", "Socket.io", "MySQL"],
		github: "https://github.com/alpharomercoma/mymnhs",
		demo: "https://mymnhs.vercel.app",
		color: "var(--color-yellow)",
		image: "mymnhs.png",
	},
	{
		title: "AceRouter",
		description:
			"AceRouter is an AI-powered chat agent that helps delivery riders in the Philippines optimize routes, communicate with delivery points, and maximize their earnings efficiently.",
		tags: ["NextJS", "Gemini", "Prompt Engineering"],
		github: "https://github.com/alpharomercoma/acerouter",
		demo: "https://acerouter.vercel.app",
		color: "var(--color-green)",
		image: "acerouter.png",
	},
	{
		title:
			"Fireguard: A Data-driven Community-based Global Fire Management System",
		description:
			"NASA Hackathon's award-winning data-driven, community-based global fire management system that leverages satellite-derived active fire data to address fire incidents across the Philippines",
		tags: ["Research", "Data Science"],
		github:
			"https://www.spaceappschallenge.org/2023/find-a-team/feu-tech-acm/?tab=project",
		demo: "https://drive.google.com/file/d/1FE7qHmqmVG-y03WzYkNwnDzSRIBPOyUl/view",
		color: "var(--color-green)",
		image: "fireguard.png",
	},
];

const ITEMS_PER_PAGE = 6;

export function ProjectsSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
	} = useCarousel(projects, ITEMS_PER_PAGE);

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
		<section ref={sectionRef} id="projects" className="py-12 px-4 sm:px-6">
			<div className="max-w-7xl mx-auto">
				<div className="flex items-end justify-between mb-6">
					<div>
						<h2
							className="animate-on-scroll opacity-0 text-2xl sm:text-3xl font-bold text-foreground mb-1"
							style={{ animationDelay: "100ms" }}
						>
							Projects
						</h2>
						<p
							className="animate-on-scroll opacity-0 text-sm text-muted-foreground"
							style={{ animationDelay: "150ms" }}
						>
							A selection of impactful AI/ML projects.
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

				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{currentItems.map((project, index) => (
						<Card
							key={`${project.title}-${currentPage}`}
							className="group bg-background border-border hover:border-[var(--color-blue)]/30 transition-all duration-300 overflow-hidden h-full"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 50}ms`,
								opacity: 0,
							}}
						>
							<div className="relative aspect-video overflow-hidden bg-secondary/10">
								<Image
									src={"/projects/" + project.image || "/placeholder.svg"}
									alt={project.title}
									fill
									className="group-hover:scale-105 transition-transform duration-500"
								/>
								<div
									className="absolute top-3 left-3 w-2 h-2 rounded-full"
									style={{ backgroundColor: project.color }}
								/>
							</div>
							<CardContent className="p-4">
								<h3 className="font-semibold text-foreground mb-1 text-md group-hover:text-[var(--color-blue)] transition-colors">
									{project.title}
								</h3>
								<p className="text-sm text-muted-foreground mb-3 ">
									{project.description}
								</p>
								<div className="flex flex-wrap gap-1 mb-3">
									{project.tags.map((tag) => (
										<Badge
											key={tag}
											variant="secondary"
											className="text-xs px-1.5 py-0 h-5"
										>
											{tag}
										</Badge>
									))}
								</div>
								<div className="flex justify-between pt-2">
									<Button variant="outline" asChild>
										<Link
											href={project.github}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Github className="h-3 w-3 mr-1" /> View Code
										</Link>
									</Button>
									<Button variant="default" asChild>
										<Link
											href={project.demo}
											target="_blank"
											rel="noopener noreferrer"
										>
											<ExternalLink className="h-3 w-3 mr-1" /> View Demo
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
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
