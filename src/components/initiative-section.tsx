"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";

// Experimental Machines is not a project — it's the independent research lab
// Alpha runs, and the portfolio's ML work (Visual-Qwen, PyTorch-for-ASICs, the
// datasets and benchmarks) are its output. It gets its own class here: a single
// dark band between the hero and the work below, linking out to the lab's site.
// Deliberately lists no sub-projects; those live on experimentalmachines.org.
const stats = [
	{ value: "$376K", label: "Google TPU Research Cloud grant" },
	{ value: "11", label: "Accelerators benchmarked" },
	{ value: "69", label: "Open-source repositories" },
];

export function InitiativeSection() {
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
		<section ref={sectionRef} className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
			<div className="max-w-6xl mx-auto">
				<a
					href="https://experimentalmachines.org"
					target="_blank"
					rel="noopener noreferrer"
					className="animate-on-scroll opacity-0 group relative block overflow-hidden rounded-[2rem] bg-ink text-white px-7 sm:px-12 lg:px-16 py-12 sm:py-14 transition-transform duration-300 hover:-translate-y-0.5"
				>
					<div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 lg:items-center">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
								An initiative I run
							</p>
							<h2 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.0] tracking-[-0.03em] text-white">
								Experimental <span className="text-lime">Machines</span>
							</h2>
							<p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
								An independent research lab across intelligence, compute, and
								data. We run the tests ourselves and publish the code, methods,
								and raw numbers, to test what others assume.
							</p>
							<span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-lime">
								Visit Experimental Machines
								<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
							</span>
						</div>
						<div className="grid grid-cols-3 gap-4 lg:gap-6 border-t border-white/15 pt-8 lg:border-t-0 lg:border-l lg:border-white/15 lg:pt-0 lg:pl-12">
							{stats.map((stat) => (
								<div key={stat.label}>
									<div className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-none text-white">
										{stat.value}
									</div>
									<div className="mt-2 text-xs leading-snug text-white/60">
										{stat.label}
									</div>
								</div>
							))}
						</div>
					</div>
				</a>
			</div>
		</section>
	);
}
