"use client";

import { Button } from "@/components/ui/button";
import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/collections/schema";
import { ArrowUpRight, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useReveal } from "@/hooks/use-reveal";

const ITEMS_PER_PAGE = 6;
const AUTO_ROTATE_INTERVAL = 0; // disabled so tab switches feel intentional

type Tab = "ml" | "swe";

const tabLabel: Record<Tab, string> = {
	ml: "Machine Learning",
	swe: "Software Engineering",
};

// Resolve a stored image value to a URL: pass through absolute paths/URLs,
// otherwise treat it as a file name in /public/projects.
function asset(value: string): string {
	return /^(https?:|\/)/.test(value) ? value : `/projects/${value}`;
}

export function ProjectsSection({ projects }: { projects: Project[] }) {
	const sectionRef = useReveal<HTMLElement>();
	const [tab, setTab] = useState<Tab>("ml");
	const ml = projects.filter((p) => p.category === "Machine Learning");
	const swe = projects.filter((p) => p.category === "Software Engineering");
	const items = tab === "ml" ? ml : swe;
	const counts: Record<Tab, number> = { ml: ml.length, swe: swe.length };

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
		if (currentPage !== 0) goToPage(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab]);

	return (
		<section
			ref={sectionRef}
			id="projects"
			className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-secondary border-t border-border"
		>
			<div className="max-w-6xl mx-auto">
				<div className="max-w-3xl mb-10 sm:mb-12">
					<h2
						className="animate-on-scroll opacity-0 display-lg mb-5"
						style={{ animationDelay: "100ms" }}
					>
						Things I&apos;ve built, research to production.
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
						className="inline-flex items-center gap-1 p-1 rounded-full bg-secondary border border-border"
					>
						{(Object.keys(tabLabel) as Tab[]).map((k) => {
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
									{tabLabel[k]}
									<span
										className={cn(
											"text-[11px] font-semibold tabular-nums",
											active
												? "text-background/70"
												: "text-muted-foreground/60",
										)}
									>
										{counts[k]}
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
							className="group flex flex-col rounded-3xl overflow-hidden bg-card border border-border transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
							style={{
								animation: "fadeIn 0.3s ease forwards",
								animationDelay: `${index * 40}ms`,
								opacity: 0,
							}}
						>
							<div className="relative aspect-[16/10] overflow-hidden bg-muted border-b border-border">
								<Image
									src={asset(project.image)}
									alt={project.title}
									fill
									sizes="(max-width: 640px) 100vw, 33vw"
									className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
								/>
							</div>
							<div className="flex flex-col flex-1 p-6">
								{/* No arrow here: the card itself is not a link, only the
								    two buttons below are. An arrow would promise a click
								    that does nothing. */}
								<h3 className="font-display font-semibold text-foreground text-[17px] leading-snug tracking-tight mb-3">
									{project.title}
								</h3>
								<p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
									{project.description}
								</p>
								{/* Metrics as one quiet line, not a row of chips; the demo
								    button is the card's single filled action and the repo is
								    a plain link beside it. */}
								{project.metrics.length > 0 && (
									<p className="text-xs text-muted-foreground mb-5">
										{project.metrics.join(" · ")}
									</p>
								)}
								<div className="mt-auto flex items-center gap-4">
									<Button
										size="sm"
										className="bg-foreground text-background hover:bg-foreground/85"
										asChild
									>
										<Link
											href={project.demo}
											target="_blank"
											rel="noopener noreferrer"
										>
											{project.demoLabel || "Live demo"}
											<ArrowUpRight className="h-3.5 w-3.5" />
										</Link>
									</Button>
									<Link
										href={project.github}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
									>
										<Github className="h-3.5 w-3.5" /> Code
									</Link>
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
