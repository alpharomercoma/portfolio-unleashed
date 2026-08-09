"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";

// Experimental Machines is not a project — it's the independent research lab
// Alpha runs, and the portfolio's ML work (Visual-Qwen, PyTorch-for-ASICs, the
// datasets and benchmarks) are its output. It gets its own class here: a single
// dark band between the hero and the work below, linking out to the lab's site.
// Deliberately lists no sub-projects; those live on experimentalmachines.org.
//
// It shows the lab's research AREAS, not numbers: the personal achievement
// stats (the $376K grant, accelerators benched, talks) belong to Alpha and live
// in the hero. Repeating them — or a GitHub repo count — here would conflate the
// person with the lab. Areas mirror the lab site's own 01/02/03 framing.
const areas = ["Multimodality", "Accelerated computing", "Data engineering"];

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
						<div className="border-t border-white/15 pt-8 lg:border-t-0 lg:border-l lg:border-white/15 lg:pt-0 lg:pl-12">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
								Research areas
							</p>
							<ul className="mt-5 space-y-4">
								{areas.map((area, i) => (
									<li key={area} className="flex items-baseline gap-3">
										<span className="font-display text-sm font-semibold tabular-nums text-lime">
											0{i + 1}
										</span>
										<span className="font-display text-lg sm:text-xl font-semibold tracking-[-0.02em] text-white">
											{area}
										</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</a>
			</div>
		</section>
	);
}
