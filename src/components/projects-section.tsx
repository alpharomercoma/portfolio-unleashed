"use client";

import { Button } from "@/components/ui/button";
import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Project = {
	title: string;
	description: string;
	tags: string[];
	metrics: string[];
	github: string;
	demo: string;
	demoLabel?: string;
	color: string;
	image: string;
};

const mlProjects: Project[] = [
	{
		title: "De-mystifying PyTorch for ASICs",
		description:
			"Benchmark study across 1x H100 (RunPod), 8x H100 (Nebius), TPU v6e-8, and Trainium1 32xlarge, training image recognition and text generation models on each platform. Presented at PyTorch Conference Europe 2026 (Linux Foundation, Station F).",
		tags: ["PyTorch", "ASICs", "Accelerated Computing"],
		metrics: ["4 accelerator classes", "PyTorch Conf Europe 2026"],
		github: "https://github.com/alpharomercoma",
		demo: "https://docs.google.com/presentation/d/1sEqxCAIanj4RxWn3quSA1JZQFzoUjaiRmUxyBjahKmc/edit",
		demoLabel: "View deck",
		color: "var(--color-red)",
		image: "pytorch-asics.png",
	},
	{
		title: "Visual-Qwen",
		description:
			"Vision-language model from the MicroMARC thesis, fine-tuned on Google TPUs to detect cognitively-degrading short-form video. Built with 10 ML experts, 20 content creators, and 20 moderators in the loop.",
		tags: ["PyTorch", "TPU", "VLM"],
		metrics: ["92% accuracy", "Google Cloud TRC"],
		github: "https://github.com/alpharomercoma/micromarc",
		demo: "https://micromarc.vercel.app/",
		color: "var(--color-blue)",
		image: "visual-qwen.png",
	},
	{
		title: "Multimodal Sludge Dataset",
		description:
			"Novel multimodal (text · video · audio) dataset of 2,000+ cognitively-degrading clips scraped from TikTok and YouTube via a human-in-the-loop and synthetic-data pipeline.",
		tags: ["Dataset", "Synthetic Data", "HITL"],
		metrics: ["2,000+ samples", "Published on Kaggle"],
		github:
			"https://gist.github.com/NoctisDEV/e253977d65c5a18f7902ac984d1107e6",
		demo: "https://www.kaggle.com/datasets/jobisaacong/tiktok-sludge-dataset-500/",
		demoLabel: "Kaggle",
		color: "var(--color-green)",
		image: "sludge-dataset.png",
	},
	{
		title: "AceRouter",
		description:
			"AI agent for Philippine delivery riders that optimizes routes, drafts client messages, and maximizes earnings via conversational guidance powered by Gemini.",
		tags: ["Next.js", "Gemini", "Agents"],
		metrics: ["Gemini-powered", "Prompt engineered"],
		github: "https://github.com/alpharomercoma/acerouter",
		demo: "https://acerouter.vercel.app",
		color: "var(--color-yellow)",
		image: "acerouter.png",
	},
];

const sweProjects: Project[] = [
	{
		title: "FEU Tech ACMX",
		description:
			"Official cross-platform application of the FEU Tech ACM, released on Google Play, Microsoft Store, Xiaomi GetApps, and Huawei App Gallery.",
		tags: ["Next.js", "shadcn/ui", "Vercel"],
		metrics: ["4,000+ students", "90K+ tasks/yr"],
		github: "https://github.com/FEUTechACMX/acmx",
		demo: "https://acmx.vercel.app",
		color: "var(--color-blue)",
		image: "acmx.png",
	},
	{
		title: "TypeScript JobSpy",
		description:
			"TypeScript job-scraping library aggregating postings from the major job boards. Production-grade rate limiting and anti-detection across 60+ countries.",
		tags: ["TypeScript", "npm", "Web Scraping"],
		metrics: ["7,200 jobs/min", "60+ countries"],
		github: "https://github.com/alpharomercoma/ts-jobspy",
		demo: "https://www.npmjs.com/package/ts-jobspy",
		color: "var(--color-yellow)",
		image: "ts-jobspy.png",
	},
	{
		title: "Para Po!",
		description:
			"Geospatial jeepney & transport route optimizer with an incentivized carbon-footprint reduction program. Finalist at the Philippine Junior Data Science Challenge 2024.",
		tags: ["Next.js", "Geospatial", "Data Science"],
		metrics: ["PJDSC Finalist", "GlobalCo Special Award"],
		github: "https://github.com/alpharomercoma/para-po",
		demo: "https://parapo.vercel.app",
		color: "var(--color-green)",
		image: "para-po.png",
	},
	{
		title: "Project NATURE · NASA '24",
		description:
			"Interactive 3D globe that translates the U.S. Greenhouse Gas Center dataset into a public storytelling platform for climate-change education.",
		tags: ["Next.js", "Data Viz", "3D"],
		metrics: ["NASA Space Apps 2024", "Built in 48h"],
		github: "https://github.com/FEUTechACM/NASA-hackathon-2024",
		demo: "https://projectnature.vercel.app",
		color: "var(--color-blue)",
		image: "project-nature.png",
	},
	{
		title: "Fireguard",
		description:
			"Data-driven, community-based fire-management system leveraging satellite active-fire data to address fire incidents across the Philippines.",
		tags: ["Research", "Satellite Data"],
		metrics: ["NASA Global Nominee '23", "Top 40 worldwide"],
		github:
			"https://www.spaceappschallenge.org/2023/find-a-team/feu-tech-acm/?tab=project",
		demo: "https://drive.google.com/file/d/1FE7qHmqmVG-y03WzYkNwnDzSRIBPOyUl/view",
		color: "var(--color-red)",
		image: "fireguard.png",
	},
	{
		title: "Kape ni Rab!",
		description:
			"Coffee shop website built in 48 hours and crowned champion of Codetober 2024, the FEU Tech AITS web development competition.",
		tags: ["Next.js", "shadcn/ui", "Vercel"],
		metrics: ["Codetober '24 Champion", "Built in 2 days"],
		github: "http://github.com/alpharomercoma/kape",
		demo: "https://alpharomercoma.github.io/kape",
		color: "var(--color-yellow)",
		image: "kape-ni-rab.png",
	},
	{
		title: "Markdown Studio",
		description:
			"Cross-platform markdown note-taking & blogging app. Shipped to Google Play Store and Microsoft Store with 200+ installs.",
		tags: ["MongoDB", "React", "Express"],
		metrics: ["200+ installs", "2 app stores"],
		github: "http://github.com/alpharomercoma/mdstudio",
		demo: "https://markdownstudio.vercel.app/",
		color: "var(--color-green)",
		image: "mdstudio.png",
	},
	{
		title: "Setsunai · Private Space",
		description:
			"Open-source, self-hosted, end-to-end-encrypted private space for thoughts that need no audience.",
		tags: ["Next.js", "Redis", "E2E Encryption"],
		metrics: ["Open source", "Self-hosted"],
		github: "http://github.com/alpharomercoma/setsunai",
		demo: "https://setsunai.vercel.app",
		color: "var(--color-red)",
		image: "setsunai.png",
	},
	{
		title: "MyMNHS",
		description:
			"Unofficial platform for Meycauayan National High School, complete with real-time chat, announcements, and forums. My first full-stack release.",
		tags: ["React", "Express", "Socket.io"],
		metrics: ["Real-time chat", "First full-stack"],
		github: "https://github.com/alpharomercoma/mymnhs",
		demo: "https://mymnhs.vercel.app",
		color: "var(--color-blue)",
		image: "mymnhs.png",
	},
];

const ITEMS_PER_PAGE = 6;
const AUTO_ROTATE_INTERVAL = 0; // disabled so tab switches feel intentional

type Tab = "ml" | "swe";

const tabConfig: Record<Tab, { label: string; count: number }> = {
	ml: { label: "Machine Learning", count: mlProjects.length },
	swe: { label: "Software Engineering", count: sweProjects.length },
};

export function ProjectsSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const [tab, setTab] = useState<Tab>("ml");
	const items = tab === "ml" ? mlProjects : sweProjects;

	const {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
		stopAutoRotate,
		isAutoRotating,
	} = useCarousel(items, ITEMS_PER_PAGE, AUTO_ROTATE_INTERVAL || undefined);

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

	useEffect(() => {
		if (currentPage !== 0) goToPage(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab]);

	return (
		<section
			ref={sectionRef}
			id="projects"
			className="py-20 sm:py-28 px-4 sm:px-6"
		>
			<div className="max-w-6xl mx-auto">
				<div className="max-w-3xl mb-10 sm:mb-12">
					<p className="animate-on-scroll opacity-0 eyebrow mb-4">
						Selected work
					</p>
					<h2
						className="animate-on-scroll opacity-0 display-lg mb-4"
						style={{ animationDelay: "100ms" }}
					>
						Research, accelerated compute, and production systems.
					</h2>
					<p
						className="animate-on-scroll opacity-0 lede"
						style={{ animationDelay: "150ms" }}
					>
						Work across my two niches, multimodality and accelerated computing,
						plus the software engineering projects that keep shipping to real
						users.
					</p>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-4 mb-8">
					<div
						role="tablist"
						aria-label="Project categories"
						className="inline-flex items-center gap-1 p-1 rounded-full bg-gray-50 border border-gray-100"
					>
						{(Object.keys(tabConfig) as Tab[]).map((k) => {
							const active = tab === k;
							return (
								<button
									key={k}
									type="button"
									role="tab"
									aria-selected={active}
									onClick={() => setTab(k)}
									className={cn(
										"inline-flex items-center gap-2 rounded-full px-4 sm:px-5 h-9 text-sm font-medium transition-all",
										active
											? "bg-foreground text-background"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{tabConfig[k].label}
									<span
										className={cn(
											"text-[11px] font-semibold tabular-nums",
											active
												? "text-background/70"
												: "text-muted-foreground/60",
										)}
									>
										{tabConfig[k].count}
									</span>
								</button>
							);
						})}
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

				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{currentItems.map((project, index) => (
						<article
							key={`${tab}-${project.title}-${currentPage}`}
							className="group flex flex-col rounded-3xl overflow-hidden bg-white border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)]"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 40}ms`,
								opacity: 0,
							}}
						>
							<div
								className="relative aspect-[16/10] overflow-hidden"
								style={{
									backgroundColor: `color-mix(in oklch, ${project.color} 10%, white)`,
								}}
							>
								<Image
									src={"/projects/" + project.image}
									alt={project.title}
									fill
									className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
								/>
							</div>
							<div className="flex flex-col flex-1 p-6">
								<div className="flex items-start justify-between gap-3 mb-3">
									<h3 className="font-semibold text-foreground text-[17px] leading-snug tracking-tight">
										{project.title}
									</h3>
									<ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
								</div>
								<p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
									{project.description}
								</p>
								<div className="flex flex-wrap gap-1.5 mb-4">
									{project.metrics.map((metric) => (
										<span
											key={metric}
											className="inline-flex items-center rounded-full text-[11px] font-medium px-2.5 py-1"
											style={{
												backgroundColor: `color-mix(in oklch, ${project.color} 14%, white)`,
												color: project.color,
											}}
										>
											{metric}
										</span>
									))}
								</div>
								<div className="mt-auto flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										className="rounded-full border-gray-200 h-9 px-4"
										asChild
									>
										<Link
											href={project.github}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Github className="h-3.5 w-3.5" /> Code
										</Link>
									</Button>
									<Button
										size="sm"
										className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-9 px-4"
										asChild
									>
										<Link
											href={project.demo}
											target="_blank"
											rel="noopener noreferrer"
										>
											{project.demoLabel ?? "Live demo"}{" "}
											<ArrowUpRight className="h-3.5 w-3.5" />
										</Link>
									</Button>
								</div>
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
