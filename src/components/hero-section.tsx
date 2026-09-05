"use client";

import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import { ArrowDown, ArrowRight, Github, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CalendarModal } from "./calendar-modal";

// Industry affiliations only. The university seals (FEU Tech, FEU Tech ACM,
// AAP) are illegible at logo-wall size and read as clutter; those organisations
// still appear where they carry meaning (awards, recommendations, talks).
//
// The files have very different aspect ratios (freeCodeCamp is 8:1, AWS is
// 16:9 with padding), so a single fixed height makes wordmarks huge and
// square marks tiny. Each logo gets a class that evens out its visual mass.
const wide = "h-6 sm:h-7 max-w-[7.5rem] sm:max-w-[8.5rem]";
const boxy = "h-9 sm:h-10 md:h-11";
const affiliations = [
	{ name: "AWS", logo: "/aws.png", size: boxy },
	{ name: "Google Cloud", logo: "/gcp.png", size: boxy },
	{ name: "Vercel", logo: "/vercel.png", size: boxy },
	{ name: "Tavily", logo: "/tavily.png", size: wide },
	{ name: "PyTorch", logo: "/pytorch.png", size: wide },
	{ name: "GitHub", logo: "/github.jpg", size: boxy },
	{
		name: "GitHub Campus Expert",
		logo: "/github_campus_expert.png",
		size: boxy,
	},
	{ name: "freeCodeCamp", logo: "/fcc.png", size: wide },
];

export type HeroStats = {
	/** Sessions actually delivered, computed from the published talks. */
	sessions: number;
};

export function HeroSection({ stats }: { stats: HeroStats }) {
	const sectionRef = useReveal<HTMLElement>();
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	// The numbers here are personal proof points. The talk figure is derived from
	// the talks store so it always agrees with /speaking and the Speaking band.
	const proof = [
		{
			value: "$376K",
			label: "Compute grant",
			sub: "Google Cloud TPU Research Cloud",
			mark: true,
		},
		{
			value: "99%",
			label: "Visual-Qwen accuracy",
			sub: "Sludge detection on 300 held-out clips",
		},
		{
			value: "11",
			label: "Accelerators benched",
			sub: "MI300X and H200 down to phone NPUs",
		},
		{
			value: String(stats.sessions),
			label: "Sessions delivered",
			sub: "PyTorch Conf Europe, Microsoft, Google, AWS",
		},
	];

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

					{/* One primary action, one path into the work, and the two
					    profiles as quiet icon buttons so the row stays light on
					    phones (no more three stacked full-width buttons). */}
					<div
						className="animate-on-scroll opacity-0 mt-9 flex flex-wrap items-center gap-3"
						style={{ animationDelay: "220ms" }}
					>
						<Button
							size="lg"
							className="w-full sm:w-auto"
							onClick={() => setIsCalendarOpen(true)}
						>
							Get in touch
							<ArrowRight className="h-4 w-4" />
						</Button>
						<Button
							asChild
							size="lg"
							variant="outline"
							className="flex-1 sm:flex-none"
						>
							<Link href="/#work">
								See the work
								<ArrowDown className="h-4 w-4" />
							</Link>
						</Button>
						<Button
							asChild
							size="icon-lg"
							variant="outline"
							aria-label="GitHub profile"
						>
							<a
								href="https://github.com/alpharomercoma"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Github className="h-4 w-4" />
							</a>
						</Button>
						<Button
							asChild
							size="icon-lg"
							variant="outline"
							aria-label="LinkedIn profile"
						>
							<a
								href="https://linkedin.com/in/alpharomercoma"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Linkedin className="h-4 w-4" />
							</a>
						</Button>
					</div>
					<CalendarModal
						isOpen={isCalendarOpen}
						onClose={() => setIsCalendarOpen(false)}
					/>
				</div>

				{/* Proof band */}
				<div
					className="animate-on-scroll opacity-0 mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 border-t border-foreground/15 pt-10"
					style={{ animationDelay: "300ms" }}
				>
					{proof.map((stat) => (
						<div key={stat.label}>
							<div className="font-display text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-foreground leading-none">
								{stat.mark ? (
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

				{/* Affiliations: eight logos that sit on one line on desktop and a
				    tidy 4 x 2 grid on phones, instead of a ragged wrap. */}
				<div
					className="animate-on-scroll opacity-0 mt-16 sm:mt-20"
					style={{ animationDelay: "360ms" }}
				>
					<p className="text-sm font-medium text-muted-foreground mb-6">
						Trusted &amp; affiliated with
					</p>
					<ul className="grid grid-cols-4 items-center gap-x-4 gap-y-6 sm:gap-x-6 md:flex md:justify-between md:gap-x-8">
						{affiliations.map((company) => (
							<li
								key={company.name}
								className="flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
								title={company.name}
							>
								<Image
									src={`/affiliations${company.logo}`}
									alt={company.name}
									width={120}
									height={48}
									className={`w-auto object-contain ${company.size}`}
								/>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
