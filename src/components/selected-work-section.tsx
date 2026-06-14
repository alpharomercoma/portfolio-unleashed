"use client";

import type { SelectedWork } from "@/lib/collections/schema";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

// Resolve a stored image value: pass through absolute paths/URLs, otherwise
// treat it as a file name in /public/featured.
function asset(value: string): string {
	return /^(https?:|\/)/.test(value) ? value : `/featured/${value}`;
}

function Tag({ label }: { label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
			<span aria-hidden className="size-1.5 rounded-full bg-lime" />
			{label}
		</span>
	);
}

export function SelectedWorkSection({ items }: { items: SelectedWork[] }) {
	const sectionRef = useRef<HTMLElement>(null);
	const lead = items[0];
	const supporting = items.slice(1);

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

	if (!lead) return null;

	return (
		<section
			ref={sectionRef}
			id="work"
			className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 border-t border-border"
		>
			<div className="max-w-6xl mx-auto">
				<div className="animate-on-scroll opacity-0 mb-12 sm:mb-16 max-w-3xl">
					<h2 className="display-lg mb-5">
						Research, accelerated computing, and{" "}
						<span className="lime-mark">community</span>.
					</h2>
					<p className="lede">
						A few pieces: a shipped vision-language model, accelerator
						benchmarks, and talks that show how the research, the systems work,
						and the teaching fit together.
					</p>
				</div>

				{/* Lead piece */}
				<Link
					href={lead.href}
					target="_blank"
					rel="noopener noreferrer"
					className="animate-on-scroll opacity-0 group block rounded-3xl border border-border bg-card overflow-hidden mb-6 transition-colors hover:border-foreground/25"
					style={{ animationDelay: "100ms" }}
				>
					<div className="grid md:grid-cols-5">
						<div className="md:col-span-3 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
							<Tag label={lead.tag} />
							<h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-snug mt-5 mb-4 max-w-xl">
								{lead.title}
							</h3>
							<p className="text-muted-foreground leading-relaxed mb-7 max-w-xl">
								{lead.description}
							</p>
							<span className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground text-sm font-medium px-5 h-10 w-fit transition-transform group-hover:translate-x-0.5">
								{lead.cta || "Read more"}
								<ArrowRight className="h-4 w-4" />
							</span>
						</div>
						<div className="md:col-span-2 relative min-h-[240px] md:min-h-full border-t md:border-t-0 md:border-l border-border">
							<Image
								src={asset(lead.image)}
								alt={lead.title}
								fill
								sizes="(max-width: 768px) 100vw, 40vw"
								className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
							/>
						</div>
					</div>
				</Link>

				{/* Supporting pieces */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
					{supporting.map((item, index) => (
						<Link
							key={item.id}
							href={item.href}
							target="_blank"
							rel="noopener noreferrer"
							className="animate-on-scroll opacity-0 group flex flex-col rounded-3xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
							style={{ animationDelay: `${(index + 2) * 90}ms` }}
						>
							<div className="relative aspect-[16/10] overflow-hidden border-b border-border">
								<Image
									src={asset(item.image)}
									alt={item.title}
									fill
									sizes="(max-width: 640px) 100vw, 33vw"
									className="object-cover transition-transform duration-500 group-hover:scale-105"
								/>
							</div>
							<div className="flex flex-col flex-1 p-6">
								<Tag label={item.tag} />
								<h3 className="font-display text-lg font-semibold text-foreground tracking-tight leading-snug mt-3 mb-2">
									{item.title}
								</h3>
								<p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
									{item.description}
								</p>
								<span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
									Read more
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
								</span>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
