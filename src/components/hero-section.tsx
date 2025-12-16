"use client";

import { ResumeButton } from "@/components/resume-modal";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
const affiliations = [
	{ name: "AWS", logo: "/aws.png" },
	{ name: "Google Cloud", logo: "/gcp.png" },
	{ name: "Vercel", logo: "/vercel.png" },
	{ name: "Tavily", logo: "/tavily.png" },
	{ name: "GitHub", logo: "/github.jpg" },
	{ name: "GitHub Campus Expert", logo: "/github_campus_expert.png" },
	{
		name: "GitHub Campus Expert Philippines",
		logo: "/github_campus_expert_philippines.png",
	},
	{ name: "Kollab", logo: "/kollab.png" },
	{ name: "FEU Institute of Technology", logo: "/fit.png" },
	{ name: "FEU Tech ACM", logo: "/fitacm.png" },
	{
		name: "Artificial Intelligence Society of the Philippines",
		logo: "/aap.png",
	},
];

import { CalendarModal } from "./calendar-modal";

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
			className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 pt-24 pb-8 overflow-hidden"
		>
			{/* Subtle grid background */}
			<div className="absolute inset-0 pointer-events-none">
				<svg className="w-full h-full" preserveAspectRatio="none">
					<defs>
						<pattern
							id="heroGridPattern"
							width="60"
							height="60"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 60 0 L 0 0 0 60"
								fill="none"
								stroke="currentColor"
								strokeWidth="0.5"
								className="text-gray-200"
							/>
							<path
								d="M 0 0 L 60 60"
								fill="none"
								stroke="currentColor"
								strokeWidth="0.3"
								className="text-gray-200"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#heroGridPattern)" />
				</svg>
			</div>

			<div className="max-w-6xl mx-auto w-full relative z-10">
				<div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
					<div className="order-2 lg:order-1 text-center lg:text-left">
						<h1
							className="animate-on-scroll opacity-0 text-4xl sm:text-5xl md:text-6xl lg:text-6xl text-foreground leading-tight mb-4 mx-auto lg:mx-0 max-w-xl lg:max-w-none"
							style={{ animationDelay: "100ms" }}
						>
							Building Intelligent Systems&nbsp;that&nbsp;Scale.
						</h1>

						<p
							className="animate-on-scroll opacity-0 text-base sm:text-lg md:text-xl text-muted-foreground mb-8 lg:mb-6 mx-auto lg:mx-0 max-w-md"
							style={{ animationDelay: "150ms" }}
						>
							Alpha Romer Coma • AI/ML Engineer
						</p>

						<div
							className="animate-on-scroll opacity-0 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-3 sm:justify-center lg:justify-start"
							style={{ animationDelay: "200ms" }}
						>
							<Button
								size="lg"
								className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-12 sm:h-11 px-6 w-full sm:w-auto"
								onClick={() => setIsCalendarOpen(true)}
							>
								Let&apos;s Talk
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
							<ResumeButton className="w-full sm:w-auto h-12 sm:h-11" />
						</div>
						<CalendarModal
							isOpen={isCalendarOpen}
							onClose={() => setIsCalendarOpen(false)}
						/>
					</div>

					<div className="order-1 lg:order-2 hidden lg:flex justify-center lg:justify-end">
						<div
							className="animate-on-scroll opacity-0 relative w-full max-w-md aspect-square"
							style={{ animationDelay: "150ms" }}
						>
							<svg
								className="w-full h-full"
								viewBox="0 0 400 400"
								preserveAspectRatio="xMidYMid meet"
							>
								{/* Connection lines */}
								<g opacity="0.4">
									<line
										x1="200"
										y1="200"
										x2="80"
										y2="80"
										stroke="var(--color-blue)"
										strokeWidth="2"
									/>
									<line
										x1="200"
										y1="200"
										x2="320"
										y2="80"
										stroke="var(--color-red)"
										strokeWidth="2"
									/>
									<line
										x1="200"
										y1="200"
										x2="80"
										y2="320"
										stroke="var(--color-yellow)"
										strokeWidth="2"
									/>
									<line
										x1="200"
										y1="200"
										x2="320"
										y2="320"
										stroke="var(--color-green)"
										strokeWidth="2"
									/>
								</g>

								{/* Center node - AI/ML */}
								<circle
									cx="200"
									cy="200"
									r="40"
									fill="white"
									stroke="#e5e7eb"
									strokeWidth="2"
									filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
								/>
								<text
									x="200"
									y="205"
									textAnchor="middle"
									fontSize="14"
									fontWeight="600"
									fill="#1f2937"
								>
									AI/ML
								</text>

								{/* Software Engineering - Blue (top left) */}
								<g>
									<rect
										x="20"
										y="45"
										width="120"
										height="70"
										rx="8"
										fill="var(--color-blue)"
										filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
									/>
									<text
										x="80"
										y="75"
										textAnchor="middle"
										fontSize="12"
										fontWeight="600"
										fill="white"
									>
										Software
									</text>
									<text
										x="80"
										y="95"
										textAnchor="middle"
										fontSize="12"
										fontWeight="600"
										fill="white"
									>
										Engineering
									</text>
								</g>

								{/* Machine Learning - Red (top right) */}
								<g>
									<rect
										x="260"
										y="45"
										width="120"
										height="70"
										rx="8"
										fill="var(--color-red)"
										filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
									/>
									<text
										x="320"
										y="75"
										textAnchor="middle"
										fontSize="12"
										fontWeight="600"
										fill="white"
									>
										Machine
									</text>
									<text
										x="320"
										y="95"
										textAnchor="middle"
										fontSize="12"
										fontWeight="600"
										fill="white"
									>
										Learning
									</text>
								</g>

								{/* Leadership - Yellow (bottom left) */}
								<g>
									<rect
										x="20"
										y="285"
										width="120"
										height="70"
										rx="8"
										fill="var(--color-yellow)"
										filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
									/>
									<text
										x="80"
										y="325"
										textAnchor="middle"
										fontSize="12"
										fontWeight="600"
										fill="white"
									>
										Leadership
									</text>
								</g>

								{/* Cloud Computing - Green (bottom right) */}
								<g>
									<rect
										x="260"
										y="285"
										width="120"
										height="70"
										rx="8"
										fill="var(--color-green)"
										filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
									/>
									<text
										x="320"
										y="315"
										textAnchor="middle"
										fontSize="12"
										fontWeight="600"
										fill="white"
									>
										Cloud
									</text>
									<text
										x="320"
										y="335"
										textAnchor="middle"
										fontSize="12"
										fontWeight="600"
										fill="white"
									>
										Computing
									</text>
								</g>

								{/* Small connector dots */}
								<circle
									cx="140"
									cy="140"
									r="4"
									fill="var(--color-blue)"
									opacity="0.6"
								/>
								<circle
									cx="260"
									cy="140"
									r="4"
									fill="var(--color-red)"
									opacity="0.6"
								/>
								<circle
									cx="140"
									cy="260"
									r="4"
									fill="var(--color-yellow)"
									opacity="0.6"
								/>
								<circle
									cx="260"
									cy="260"
									r="4"
									fill="var(--color-green)"
									opacity="0.6"
								/>
							</svg>
						</div>
					</div>
				</div>

				<div
					className="animate-on-scroll opacity-0"
					style={{ animationDelay: "300ms" }}
				>
					<p className="text-center text-sm text-muted-foreground mb-6">
						Affiliated with Leading Organizations
					</p>
					<div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-8 md:gap-x-10 lg:gap-x-12 gap-y-4 sm:gap-y-5 max-w-4xl mx-auto mb-4 sm:mb-6">
						{affiliations.map((company) => (
							<div
								key={company.name}
								className="hover:scale-105 transition-transform duration-300 flex items-center justify-center"
								title={company.name}
							>
								<Image
									src={"/affiliations" + company.logo || "/placeholder.svg"}
									alt={company.name}
									width={100}
									height={100}
									className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain max-w-[80px] sm:max-w-[100px] md:max-w-[115px]"
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
