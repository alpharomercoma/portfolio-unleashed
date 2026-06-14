"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Linkedin } from "lucide-react";
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
			className="hero-lime-field relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-44 pb-16 sm:pb-20"
		>
			<div aria-hidden className="hero-blobs">
				<span className="hero-blob hero-blob-1" />
				<span className="hero-blob hero-blob-2" />
				<span className="hero-blob hero-blob-3" />
			</div>
			<div className="relative z-10 max-w-6xl mx-auto w-full">
				<div className="max-w-4xl">
					<h1
						className="animate-on-scroll opacity-0 display-xl"
						style={{ animationDelay: "100ms" }}
					>
						Building intelligent <span className="lime-mark">systems</span> that
						scale.
					</h1>

					<p
						className="animate-on-scroll opacity-0 lede mt-7 max-w-2xl"
						style={{ animationDelay: "150ms" }}
					>
						ML engineer specializing in{" "}
						<span className="font-semibold text-foreground">multimodality</span>{" "}
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
						className="animate-on-scroll opacity-0 mt-9 flex flex-col sm:flex-row gap-3"
						style={{ animationDelay: "220ms" }}
					>
						<Button size="lg" onClick={() => setIsCalendarOpen(true)}>
							Get in touch
							<ArrowRight className="h-4 w-4" />
						</Button>
						<Button asChild size="lg" variant="outline">
							<a
								href="https://linkedin.com/in/alpharomercoma"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Linkedin className="h-4 w-4" />
								LinkedIn
							</a>
						</Button>
						<Button asChild size="lg" variant="outline">
							<a
								href="https://github.com/alpharomercoma"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Github className="h-4 w-4" />
								GitHub
							</a>
						</Button>
					</div>
					<CalendarModal
						isOpen={isCalendarOpen}
						onClose={() => setIsCalendarOpen(false)}
					/>
				</div>

				{/* Bold inline stat band (replaces the bento card) */}
				<div
					className="animate-on-scroll opacity-0 mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 border-t border-foreground/15 pt-10"
					style={{ animationDelay: "300ms" }}
				>
					{stats.map((stat, i) => (
						<div key={stat.label}>
							<div className="font-display text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-foreground leading-none">
								{i === 0 ? (
									<span className="lime-mark">{stat.value}</span>
								) : (
									stat.value
								)}
							</div>
							<div className="mt-3 text-sm font-semibold text-foreground">
								{stat.label}
							</div>
							<div className="mt-0.5 text-xs text-muted-foreground">
								{stat.sub}
							</div>
						</div>
					))}
				</div>

				{/* Affiliations */}
				<div
					className="animate-on-scroll opacity-0 mt-16 sm:mt-20"
					style={{ animationDelay: "360ms" }}
				>
					<p className="text-sm font-medium text-muted-foreground mb-7">
						Trusted &amp; affiliated with
					</p>
					<div className="flex flex-wrap items-center gap-x-10 sm:gap-x-12 md:gap-x-14 gap-y-6">
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
