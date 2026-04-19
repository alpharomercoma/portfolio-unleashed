"use client";

import { ArrowUpRight, Cpu, Layers, Users } from "lucide-react";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { useEffect, useRef } from "react";

type ValueProp = {
	label: string;
	title: string;
	body: string;
	linkLabel: string;
	linkHref: string;
	color: string;
	Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const valueProps: ValueProp[] = [
	{
		label: "Multimodality",
		title: "Vision-language models, shipped",
		body: "MicroMARC thesis is a 92% accurate VLM (Visual-Qwen) for detecting cognitively-degrading short-form video, fine-tuned on a 6,000-row multimodal dataset under a $376,000 Google Cloud compute grant.",
		linkLabel: "Read the thesis",
		linkHref: "https://micromarc.vercel.app",
		color: "var(--color-blue)",
		Icon: Layers,
	},
	{
		label: "Accelerated Computing",
		title: "PyTorch across H100, TPU, and Trainium",
		body: "Benchmark study across 1 H100 on RunPod, 8 H100 on Nebius, TPU v6e-8, and Trainium1 32xlarge, training image recognition and text generation models on each. Presented at PyTorch Conference Europe 2026.",
		linkLabel: "View the deck",
		linkHref:
			"https://docs.google.com/presentation/d/1sEqxCAIanj4RxWn3quSA1JZQFzoUjaiRmUxyBjahKmc/edit",
		color: "var(--color-red)",
		Icon: Cpu,
	},
	{
		label: "Community",
		title: "Teaching the craft, in public",
		body: "AWS Community Builder (AI Engineering), GitHub Campus Expert, Tavily Campus Ambassador, FreeCodeCamp Author. 25+ talks across PyTorch Conference Europe, Microsoft, Google, and AWS community stages.",
		linkLabel: "Browse talks",
		linkHref: "#speaking",
		color: "var(--color-green)",
		Icon: Users,
	},
];

export function ValuePropsSection() {
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
			className="py-20 sm:py-28 px-4 sm:px-6 border-t border-gray-100"
		>
			<div className="max-w-6xl mx-auto">
				<div className="grid md:grid-cols-3 gap-5">
					{valueProps.map((vp, idx) => {
						const Icon = vp.Icon;
						return (
							<div
								key={vp.title}
								className="animate-on-scroll opacity-0 group relative flex flex-col p-7 sm:p-8 rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-1"
								style={{
									animationDelay: `${idx * 80}ms`,
									backgroundColor: `color-mix(in oklch, ${vp.color} 8%, white)`,
								}}
							>
								<div className="flex items-center justify-between mb-6">
									<div
										className="flex items-center justify-center h-10 w-10 rounded-xl"
										style={{
											backgroundColor: `color-mix(in oklch, ${vp.color} 18%, white)`,
											color: vp.color,
										}}
									>
										<Icon className="h-5 w-5" />
									</div>
									<span
										className="font-mono text-xs font-semibold tabular-nums tracking-wider"
										style={{ color: vp.color }}
									>
										{String(idx + 1).padStart(2, "0")}
									</span>
								</div>

								<span
									className="text-[11px] font-semibold tracking-[0.14em] uppercase mb-2"
									style={{ color: vp.color }}
								>
									{vp.label}
								</span>
								<h3 className="text-xl sm:text-[22px] font-semibold text-foreground tracking-tight leading-snug mb-3">
									{vp.title}
								</h3>
								<p className="text-[15px] text-muted-foreground leading-relaxed mb-6 flex-1">
									{vp.body}
								</p>
								<Link
									href={vp.linkHref}
									target={vp.linkHref.startsWith("#") ? undefined : "_blank"}
									rel={
										vp.linkHref.startsWith("#")
											? undefined
											: "noopener noreferrer"
									}
									className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-70 transition-opacity w-fit"
									style={{ color: vp.color }}
								>
									{vp.linkLabel}
									<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
								</Link>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
