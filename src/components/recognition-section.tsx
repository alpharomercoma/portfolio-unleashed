"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import type { Award, Certification } from "@/lib/collections/schema";

const CERTS_PER_PAGE = 6; // 2 columns x 3 rows

// Bare file names resolve to the public asset dir; full URLs/paths pass through.
function asset(dir: string, value: string) {
	if (!value) return "";
	return /^(https?:|\/)/.test(value) ? value : `${dir}/${value}`;
}

function formatDate(iso: string) {
	if (!iso) return "";
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function RecognitionSection({
	awards,
	certifications,
}: {
	awards: Award[];
	certifications: Certification[];
}) {
	const sectionRef = useRef<HTMLElement>(null);
	const totalCredentials = certifications.length;
	const {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
		stopAutoRotate,
		isAutoRotating,
	} = useCarousel(certifications, CERTS_PER_PAGE);

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
			id="recognition"
			className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-lime-wash border-t border-border"
		>
			<div className="max-w-6xl mx-auto">
				<div className="animate-on-scroll opacity-0 mb-12 sm:mb-16 max-w-3xl">
					<h2 className="display-lg mb-5">
						Honored as a PH100 mind and the national AI{" "}
						<span className="lime-mark">champion</span>.
					</h2>
					<p className="lede">
						Awards across AI research and hackathons, plus {totalCredentials}{" "}
						industry credentials from Google, Microsoft, AWS, GitHub, and more.
					</p>
				</div>

				{/* Awards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{awards.map((award, index) => (
						<article
							key={award.id}
							className="animate-on-scroll opacity-0 flex flex-col rounded-3xl overflow-hidden bg-card border border-border transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
							style={{ animationDelay: `${index * 70}ms` }}
						>
							<div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
								<Image
									src={asset("/awards", award.image)}
									alt={award.title}
									fill
									sizes="(max-width: 640px) 100vw, 33vw"
									className="object-cover"
								/>
							</div>
							<div className="flex flex-col flex-1 p-5 sm:p-6">
								<div className="flex items-center justify-between gap-2 mb-3">
									<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
										<span
											aria-hidden
											className="size-1.5 rounded-full bg-lime"
										/>
										{award.category}
									</span>
									<span className="font-mono text-xs text-muted-foreground tabular-nums">
										{award.year}
									</span>
								</div>
								<h3 className="font-display text-base font-semibold text-foreground leading-snug tracking-tight mb-1.5">
									{award.title}
								</h3>
								<p className="text-xs font-medium text-muted-foreground mb-2.5">
									{award.organization}
								</p>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{award.context}
								</p>
							</div>
						</article>
					))}
				</div>

				{/* Certifications: 2 x 3 paginated carousel */}
				<div className="animate-on-scroll opacity-0 mt-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
					<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
						<div>
							<h3 className="font-display text-xl font-semibold tracking-tight">
								{totalCredentials} industry credentials
							</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Cloud, ML, and security certifications across the major
								platforms.
							</p>
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

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{currentItems.map((cert, index) => (
							<Link
								key={`${cert.id}-${currentPage}`}
								href={cert.link || "#"}
								target={cert.link ? "_blank" : undefined}
								rel={cert.link ? "noopener noreferrer" : undefined}
								className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25"
								style={{
									animation: "fadeIn 0.3s ease forwards",
									animationDelay: `${index * 40}ms`,
									opacity: 0,
								}}
							>
								<span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary overflow-hidden">
									<Image
										src={asset("/certification/logo", cert.logo)}
										alt={cert.issuer}
										width={28}
										height={28}
										className="size-6 object-contain"
									/>
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-medium text-foreground leading-snug line-clamp-2">
										{cert.title}
									</span>
									<span className="block text-xs text-muted-foreground mt-0.5">
										{cert.issuer} · {formatDate(cert.date)}
									</span>
								</span>
								{cert.link && (
									<ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
								)}
							</Link>
						))}
					</div>

					<CarouselDots
						currentPage={currentPage}
						totalPages={totalPages}
						onGoToPage={goToPage}
						onUserInteraction={stopAutoRotate}
						className="mt-6"
					/>
				</div>
			</div>
		</section>
	);
}
