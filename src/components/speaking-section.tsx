"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin, Presentation } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
const speakingEvents = [
	{
		title: "Product Building with AI Workshop",
		event: "Philippine Innovation Conference 2025",
		date: "Nov 21, 2025",
		location: "University of Batangas",
		type: "Workshop",
		slideLink:
			"https://docs.google.com/presentation/d/1pQ5gzJtaP9tqAYS1ISIJ79EDVy6LHiWtXpgEOHvfQuo/edit?usp=sharing",
	},
	{
		title: "GitHub Universe'25 Recap: AI Edition",
		event: "az:Repo: The Code and Cloud Agentic Workshop",
		date: "Nov 14, 2025",
		location: "Microsoft Office Philippines",
		type: "Talk",
		slideLink:
			"https://docs.google.com/presentation/d/1V4pM8MyWvL7RDXvM-_AKTCWY1SrnylaAmJcO-tjsS94/edit?usp=sharing",
	},
	{
		title: "G-Trends: A Developer's Guide to Google's Next-Gen Toolkit",
		event: "InSession 2025",
		date: "Nov 6, 2025",
		location: "TUP - Manila",
		type: "Talk",
		slideLink:
			"https://docs.google.com/presentation/d/1Vafm3hrMy7Cs2Df_S_LJkFtQmtMSGq49UpfwWjAezsY/edit?usp=sharing",
	},
	{
		title:
			"Internship Employability Session: Resume, LinkedIn, GitHub, and Beyond",
		event: "DEPLOY():",
		date: "Nov 5, 2025",
		location: "Online",
		type: "Talk",
		slideLink:
			"https://www.canva.com/design/DAG3vgFTIRw/lX11R-l5WCG5HWNGph9WKA/view?utm_content=DAG3vgFTIRw&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h536533829a",
	},
	{
		title:
			"Open Source Series: Licensing, Version Control, Contributing, and Beyond",
		event: "Hacktoberfest Philippines 2025",
		date: "October 30, 2025",
		location: "National University - Las Piñas",
		type: "Talk",
		slideLink:
			"https://www.canva.com/design/DAG3MtSllRU/Sd8-zh-6AtAmVH5T8m-d-g/edit",
	},
	{
		title: "Let's Git Ready: From Commit to Career",
		event: "Let's Git Ready",
		date: "October 24, 2025",
		location: "Online",
		type: "Workshop",
		slideLink:
			"https://www.canva.com/design/DAG2d3Y3OsQ/mdS5rcxFRz-2SwakktNKvg/view?utm_content=DAG2d3Y3OsQ&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h6245d9bfae",
	},
	{
		title: "Supercharge your ML Research with Google's TPU Research Cloud",
		event: "SOFTCON 2025",
		date: "October 17, 2025",
		location: "Online",
		type: "Talk",
		slideLink:
			"https://docs.google.com/presentation/d/1C6ccqrJz--90Po2eo1G8F4Uko0TOejT6SNwInZswiJ4/edit?usp=sharing",
	},
	{
		title: "Boost ML Research with TPU Research Cloud",
		event: "Devfest 2025",
		date: "October 13, 2025",
		location: "LaunchGarage, Quezon City",
		type: "Talk",
		slideLink:
			"https://docs.google.com/presentation/d/1TZMmXumbaCf4PEIHcNVOuhwniLFJyOvLjPoZrnanb78/edit?usp=sharing",
	},
];

const colors = [
	"var(--color-blue)",
	"var(--color-red)",
	"var(--color-yellow)",
	"var(--color-green)",
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
			className="py-12 px-4 sm:px-6 bg-secondary/30"
		>
			<div className="max-w-6xl mx-auto">
				<div className="flex items-end justify-between mb-6">
					<div>
						<h2
							className="animate-on-scroll opacity-0 text-2xl sm:text-3xl font-bold text-foreground mb-1"
							style={{ animationDelay: "100ms" }}
						>
							Speaking
						</h2>
						<p
							className="animate-on-scroll opacity-0 text-sm text-muted-foreground"
							style={{ animationDelay: "150ms" }}
						>
							Sharing insights at conferences and events
						</p>
					</div>

					<Button
						variant="outline"
						size="sm"
						className="animate-on-scroll opacity-0 rounded-full h-8 text-xs bg-transparent"
						style={{ animationDelay: "200ms" }}
						asChild
					>
						<Link href="https://www.appsheet.com/start/571f4238-a52d-4f25-925c-6fc4e114e940">
							All Speakerships <ArrowRight className="ml-1 h-3 w-3" />
						</Link>
					</Button>
				</div>

				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{speakingEvents.map((event, index) => (
						<div
							key={`${event.title}`}
							className="flex flex-col p-4 bg-background rounded-xl border border-border hover:border-[var(--color-blue)]/30 transition-all group h-full"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 50}ms`,
								opacity: 0,
							}}
						>
							<div className="flex items-center justify-between mb-3">
								<span
									className="text-xs font-medium px-2 py-0.5 rounded-full"
									style={{
										backgroundColor: `color-mix(in oklch, ${colors[index % 4]} 15%, transparent)`,
										color: colors[index % 4],
									}}
								>
									{event.type}
								</span>
							</div>

							<h3 className="font-medium text-foreground text-sm mb-1 group-hover:text-[var(--color-blue)] transition-colors line-clamp-2">
								{event.title}
							</h3>
							<p className="text-xs text-[var(--color-blue)] mb-2">
								{event.event}
							</p>

							<div className="mt-auto space-y-1">
								<div className="flex items-center gap-1 text-xs text-muted-foreground">
									<Calendar className="h-3 w-3" /> {event.date}
								</div>
								<div className="flex items-center gap-1 text-xs text-muted-foreground">
									<MapPin className="h-3 w-3" /> {event.location}
								</div>
							</div>

							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-0 text-xs mt-3 justify-start"
								asChild
							>
								<Link
									href={event.slideLink}
									target="_blank"
									rel="noopener noreferrer"
								>
									View Slides <Presentation className="ml-1 h-3 w-3" />
								</Link>
							</Button>
						</div>
					))}
				</div>

				<div
					className="animate-on-scroll opacity-0 mt-6 p-4 bg-background border border-border rounded-xl text-center"
					style={{ animationDelay: "300ms" }}
				>
					<p className="text-sm text-muted-foreground mb-3">
						Interested in having me speak at your event?
					</p>
					<Button
						size="sm"
						className="rounded-full bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90 h-8"
						asChild
					>
						<Link href="#contact">Get in Touch</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
