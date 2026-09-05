"use client";

import { ArrowUpRight } from "lucide-react";

import { useReveal } from "@/hooks/use-reveal";

// The independent research work now runs as two sibling labs with one founder:
// Experimental Machines (hardware benchmarks) and Experimental Intelligence
// (models, datasets, training methodology). Neither is a project; the
// portfolio's ML work is their output, so they get their own class here: one
// dark band between the hero and the work below, split in two, each half
// linking out to its lab. Sub-projects deliberately stay on the lab sites.
//
// Personal achievement stats (the grant, accelerators benched, talks) belong to
// Alpha and live in the hero; repeating them here would conflate the person
// with the labs. One paragraph per lab, lifted from its own site's description;
// no tagline above it and no scope line below, so each card is name, what it
// does, link.
const labs = [
	{
		name: ["Experimental", "Machines"],
		href: "https://experimentalmachines.org",
		line: "Buys or rents the accelerators, runs the same workloads at datacenter, laptop and phone scale, and publishes every log so the numbers can be checked.",
	},
	{
		name: ["Experimental", "Intelligence"],
		href: "https://experimentalintelligence.org",
		line: "Builds small models from scratch, labels its own data, and publishes the weights, code and training logs so every claim can be rerun.",
	},
];

export function InitiativeSection() {
	const sectionRef = useReveal<HTMLElement>();

	return (
		<section ref={sectionRef} className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
			<div className="animate-on-scroll opacity-0 max-w-6xl mx-auto overflow-hidden rounded-[2rem] bg-ink text-white">
				<div className="px-7 sm:px-12 lg:px-16 pt-12 sm:pt-14">
					<h2 className="font-display text-3xl sm:text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-white text-balance">
						Two research labs I founded
					</h2>
					<p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
						Sibling initiatives with one rule: run the experiment yourself and
						publish the logs, so anyone can check the numbers.
					</p>
				</div>

				<div className="mt-10 grid md:grid-cols-2 border-t border-white/15 divide-y divide-white/15 md:divide-y-0 md:divide-x">
					{labs.map((lab) => (
						<a
							key={lab.href}
							href={lab.href}
							target="_blank"
							rel="noopener noreferrer"
							className="group flex flex-col px-7 sm:px-12 lg:px-16 py-10 sm:py-12 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime"
						>
							<h3 className="font-display text-2xl sm:text-3xl font-bold leading-[1.0] tracking-[-0.03em] text-white">
								{lab.name[0]} <span className="text-lime">{lab.name[1]}</span>
							</h3>
							<p className="mt-4 max-w-md text-base leading-relaxed text-white/70 text-balance">
								{lab.line}
							</p>
							<span className="mt-auto pt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-lime">
								Visit {lab.name.join(" ")}
								<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
							</span>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
