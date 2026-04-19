"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Github, Linkedin } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { CalendarModal } from "./calendar-modal";

const affiliations = [
	{ name: "AWS", logo: "/aws.png" },
	{ name: "Google Cloud", logo: "/gcp.png" },
	{ name: "Vercel", logo: "/vercel.png" },
	{ name: "Tavily", logo: "/tavily.png" },
	{ name: "PyTorch", logo: "/pytorch.png" },
	{ name: "GitHub", logo: "/github.jpg" },
	{ name: "GitHub Campus Expert", logo: "/github_campus_expert.png" },
	{ name: "FreeCodeCamp", logo: "/fcc.png" },
	{ name: "FEU Institute of Technology", logo: "/fit.png" },
	{ name: "FEU Tech ACM", logo: "/fitacm.png" },
	{
		name: "Artificial Intelligence Society of the Philippines",
		logo: "/aap.png",
	},
];

const stats = [
	{
		value: "$376K",
		label: "Compute grant",
		sub: "Google Cloud TPU Research Cloud",
	},
	{
		value: "92%",
		label: "VLM thesis accuracy",
		sub: "Visual-Qwen, multimodal",
	},
	{
		value: "4×",
		label: "Accelerators benched",
		sub: "H100, TPU v6e, Trainium1",
	},
	{
		value: "25+",
		label: "Conference talks",
		sub: "PyTorch Conf Europe, Microsoft, Google, AWS",
	},
];

const credentials = [
	"AWS Community Builder, AI Engineering",
	"Google ML Engineer",
	"AWS ML Engineer",
	"Azure AI Engineer",
	"GitHub Campus Expert",
];

export function HeroSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
			id="about"
			className="relative flex flex-col justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 bg-background"
		>
			<div className="max-w-6xl mx-auto w-full">
				<div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center mb-20 sm:mb-24">
					<div className="order-1 lg:order-1">
						<h1
							className="animate-on-scroll opacity-0 display-xl mb-6 max-w-xl"
							style={{ animationDelay: "100ms" }}
						>
							Building intelligent{" "}
							<span className="relative inline-block text-[var(--color-blue)]">
								systems
								<svg
									aria-hidden="true"
									viewBox="0 0 220 12"
									preserveAspectRatio="none"
									className="absolute left-0 right-0 -bottom-[0.12em] w-full h-[0.38em] text-[var(--color-blue)]/60"
								>
									<path
										d="M2 8 C 60 2, 160 2, 218 8"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
									/>
								</svg>
							</span>{" "}
							that scale.
						</h1>

						<p
							className="animate-on-scroll opacity-0 lede mb-8 max-w-lg"
							style={{ animationDelay: "150ms" }}
						>
							ML engineer specializing in{" "}
							<span className="font-semibold text-foreground">
								multimodality
							</span>{" "}
							and{" "}
							<span className="font-semibold text-foreground">
								accelerated computing
							</span>
							. Speaker at{" "}
							<span className="font-semibold text-foreground">
								PyTorch Conference Europe 2026
							</span>
							, backed by a $376,000 Google Cloud compute grant.
						</p>

						<div
							className="animate-on-scroll opacity-0 flex flex-col sm:flex-row gap-3"
							style={{ animationDelay: "220ms" }}
						>
							<Button
								size="lg"
								className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-12 px-6"
								onClick={() => setIsCalendarOpen(true)}
							>
								Get in touch
								<ArrowRight className="ml-1.5 h-4 w-4" />
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="rounded-full h-12 px-6 border-gray-200 hover:bg-gray-50"
							>
								<a
									href="https://linkedin.com/in/alpharomercoma"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Linkedin className="h-4 w-4" />
									LinkedIn
									<ExternalLink className="h-3.5 w-3.5 opacity-60" />
								</a>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="rounded-full h-12 px-6 border-gray-200 hover:bg-gray-50"
							>
								<a
									href="https://github.com/alpharomercoma"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Github className="h-4 w-4" />
									GitHub
									<ExternalLink className="h-3.5 w-3.5 opacity-60" />
								</a>
							</Button>
						</div>
						<CalendarModal
							isOpen={isCalendarOpen}
							onClose={() => setIsCalendarOpen(false)}
						/>
					</div>

					<div className="order-2 lg:order-2 flex justify-center lg:justify-end">
						<div
							className="animate-on-scroll opacity-0 w-full max-w-md"
							style={{ animationDelay: "150ms" }}
						>
							<div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(15,23,42,0.08)]">
								<div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
									<div className="flex items-center gap-1.5">
										<span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
										<span className="h-3 w-3 rounded-full bg-[#febc2e]" />
										<span className="h-3 w-3 rounded-full bg-[#28c840]" />
									</div>
									<span className="ml-3 text-[13px] text-gray-500 font-mono">
										alpha_stats.py
									</span>
								</div>
								<div className="p-5">
									<div className="grid grid-cols-2 gap-2.5">
										{stats.map((stat) => (
											<div
												key={stat.label}
												className="rounded-xl bg-gray-50 px-4 py-4"
											>
												<div className="text-2xl font-semibold text-foreground leading-none mb-1.5 tracking-tight">
													{stat.value}
												</div>
												<div className="text-xs font-medium text-foreground">
													{stat.label}
												</div>
												<div className="text-[11px] text-muted-foreground mt-0.5">
													{stat.sub}
												</div>
											</div>
										))}
									</div>
									<div className="my-5 border-t border-gray-100" />
									<div className="text-[13px] font-medium text-foreground mb-3">
										Credentials
									</div>
									<div className="flex flex-wrap gap-1.5">
										{credentials.map((cert) => (
											<span
												key={cert}
												className="inline-flex items-center rounded-full bg-[color-mix(in_oklch,var(--color-blue)_10%,white)] text-[var(--color-blue)] text-[11px] font-medium px-2.5 py-1"
											>
												{cert}
											</span>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div
					className="animate-on-scroll opacity-0"
					style={{ animationDelay: "300ms" }}
				>
					<p className="eyebrow text-center mb-8">Trusted & affiliated with</p>
					<div className="flex flex-wrap justify-center items-center gap-x-10 sm:gap-x-12 md:gap-x-14 gap-y-6 max-w-5xl mx-auto">
						{affiliations.map((company) => (
							<div
								key={company.name}
								className="flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
								title={company.name}
							>
								<Image
									src={"/affiliations" + company.logo || "/placeholder.svg"}
									alt={company.name}
									width={100}
									height={100}
									className="h-8 sm:h-9 md:h-10 w-auto object-contain max-w-[90px] sm:max-w-[110px]"
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
