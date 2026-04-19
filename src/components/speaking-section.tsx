"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Presentation } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

type Talk = {
	title: string;
	event: string;
	date: string;
	location: string;
	type: "Keynote" | "Talk" | "Workshop";
	upcoming?: boolean;
	summary: string;
	color: string;
	slideLink: string;
};

const speakingEvents: Talk[] = [
	{
		title:
			"From Zero to Trainium: Building Your First Model on AWS's Native PyTorch Stack",
		event: "AWS Community Day Philippines 2026",
		date: "Jun 20, 2026",
		location: "AWS Cloud Clubs PH",
		type: "Talk",
		upcoming: true,
		summary:
			"Quick start on AWS's native PyTorch stack: provisioning Trainium, porting a model, and running your first training job in under an hour.",
		color: "var(--color-yellow)",
		slideLink: "https://alpharomer.com",
	},
	{
		title: "Introduction to GitHub Copilot and AI Development",
		event: "Sparkpoint 2026",
		date: "May 2, 2026",
		location: "National University Laguna",
		type: "Talk",
		upcoming: true,
		summary:
			"Hands-on intro to GitHub Copilot: prompt patterns, agent mode, and wiring AI assistance into day-to-day development.",
		color: "var(--color-blue)",
		slideLink: "https://alpharomer.com",
	},
	{
		title: "Frontiers of Modern AI: Multimodality & Accelerated Computing",
		event: "EDiTH Episode 9",
		date: "Apr 10, 2026",
		location: "FEU Institute of Technology",
		type: "Talk",
		summary:
			"Tour of the two frontiers defining modern AI: multimodal fusion architectures and the accelerator stack (H100, TPU v6e, Trainium).",
		color: "var(--color-green)",
		slideLink:
			"https://docs.google.com/presentation/d/11Yb8gllp48PWzvoU3Vm22ibUUEJTK7qxswhkkFZKhQE/edit?usp=sharing",
	},
	{
		title:
			"De-mystifying PyTorch for ASICs: When (and Why) To Move Your Development To AI Accelerators",
		event: "PyTorch Conference Europe 2026",
		date: "Apr 7, 2026",
		location: "Station F, Paris, France",
		type: "Talk",
		summary:
			"Benchmark walkthrough for image recognition and text generation across 1x H100 (RunPod), 8x H100 (Nebius), TPU v6e-8, and Trainium1 32xlarge.",
		color: "var(--color-red)",
		slideLink:
			"https://docs.google.com/presentation/d/1sEqxCAIanj4RxWn3quSA1JZQFzoUjaiRmUxyBjahKmc/edit?usp=sharing",
	},
	{
		title: "Git and GitHub Workshop",
		event: "JBECP, JRU Chapter",
		date: "Mar 5, 2026",
		location: "Jose Rizal University",
		type: "Workshop",
		summary:
			"3-hour workshop on Git fundamentals, from initializing a repo to resolving merge conflicts and shipping your first pull request.",
		color: "var(--color-yellow)",
		slideLink:
			"https://docs.google.com/presentation/d/1NkZ__hvRhYn7IHl_Jmo14K3OwfJp7YPvfsCRCvdeUvw/edit?usp=sharing",
	},
	{
		title: "Online Safety in the Age of AI",
		event: "Ctrl + Prompt",
		date: "Jan 8, 2026",
		location: "FEU Institute of Technology",
		type: "Talk",
		summary:
			"Navigating AI in the classroom: prompt injection, data leakage, and the safety practices students should adopt early.",
		color: "var(--color-blue)",
		slideLink:
			"https://docs.google.com/presentation/d/1DTv2zeT8myufqUtGj-eS5dnzN3obDTXtop6af8Lm72E/edit?usp=sharing",
	},
];

export function SpeakingSection() {
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
			id="speaking"
			className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50/60"
		>
			<div className="max-w-6xl mx-auto">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-16">
					<div className="max-w-3xl">
						<p className="animate-on-scroll opacity-0 eyebrow mb-4">Speaking</p>
						<h2
							className="animate-on-scroll opacity-0 display-lg mb-4"
							style={{ animationDelay: "100ms" }}
						>
							From PyTorch Conference Europe to community stages.
						</h2>
						<p
							className="animate-on-scroll opacity-0 lede"
							style={{ animationDelay: "150ms" }}
						>
							25+ talks on multimodality, accelerated computing, and developer
							tooling at the Linux Foundation, Microsoft, Google, and AWS
							community events.
						</p>
					</div>

					<Button
						variant="outline"
						size="sm"
						className="animate-on-scroll opacity-0 rounded-full h-10 px-5 text-sm bg-white border-gray-200 hover:bg-white hover:border-gray-300 shrink-0"
						style={{ animationDelay: "200ms" }}
						asChild
					>
						<Link
							href="https://www.appsheet.com/start/571f4238-a52d-4f25-925c-6fc4e114e940"
							target="_blank"
							rel="noopener noreferrer"
						>
							Full speakership database{" "}
							<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
						</Link>
					</Button>
				</div>

				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{speakingEvents.map((event, index) => (
						<article
							key={event.title}
							className="flex flex-col p-6 sm:p-7 rounded-3xl h-full transition-transform duration-300 hover:-translate-y-1"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 50}ms`,
								opacity: 0,
								backgroundColor: `color-mix(in oklch, ${event.color} 11%, white)`,
							}}
						>
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-1.5">
									<span
										className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/70"
										style={{ color: event.color }}
									>
										{event.type}
									</span>
									{event.upcoming && (
										<span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-foreground text-background">
											Upcoming
										</span>
									)}
								</div>
								<span className="text-xs font-medium text-muted-foreground">
									{event.date}
								</span>
							</div>

							<h3 className="font-semibold text-foreground text-lg leading-snug tracking-tight mb-2">
								{event.title}
							</h3>
							<p
								className="text-sm font-medium mb-3"
								style={{ color: event.color }}
							>
								{event.event}
							</p>
							<p className="text-sm text-muted-foreground leading-relaxed mb-6">
								{event.summary}
							</p>

							<div className="mt-auto pt-5 border-t border-black/5 flex items-center justify-between">
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
									<MapPin className="h-3.5 w-3.5 shrink-0" />
									<span className="truncate">{event.location}</span>
								</div>
								{!event.upcoming && (
									<Link
										href={event.slideLink}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:opacity-70 transition-opacity shrink-0"
									>
										Slides
										<Presentation className="h-3.5 w-3.5" />
									</Link>
								)}
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
