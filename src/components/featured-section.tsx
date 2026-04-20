"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const featuredPosts = [
	{
		id: 1,
		title: "De-mystifying PyTorch for ASICs at PyTorch Conference Europe 2026",
		description:
			"Benchmark study across 1x H100 (RunPod), 8x H100 (Nebius), TPU v6e-8, and Trainium1 32xlarge, training image recognition and text generation models on each platform. Delivered at Station F, Paris for the Linux Foundation.",
		image: "pytorch-conf-europe.png",
		category: "Accelerated Computing",
		color: "var(--color-red)",
		href: "https://docs.google.com/presentation/d/1sEqxCAIanj4RxWn3quSA1JZQFzoUjaiRmUxyBjahKmc/edit",
	},
	{
		id: 2,
		title: "Crafting the Winning Prompt of NAIPDC PH 2025",
		description:
			"Technique breakdown of Kasanayan Navigator: model selection, chain-of-thought structure, XML scaffolding, and the guardrails that won the National AI Prompt Design Challenge PH.",
		image: "naipdc.jpg",
		category: "Prompt Engineering",
		color: "var(--color-blue)",
		href: "https://alpharomer.com/blog/crafting-the-winning-prompt-of-national-ai-prompt-design-challenge",
	},
	{
		id: 3,
		title: "AWS re:Invent 2025: All Builders Welcome Grant",
		description:
			"Selected for AWS&rsquo;s All Builders Welcome grant, which covered conference pass, travel, and lodging for re:Invent 2025 in Las Vegas.",
		image: "reinvent25.png",
		category: "Grant & Travel",
		color: "var(--color-yellow)",
		href: "https://www.linkedin.com/posts/alpharomercoma_what-an-exceptional-q4-so-far-1-conference-activity-7403666560558522368-1Vl3",
	},
	{
		id: 4,
		title: "GitHub Universe '25 Recap at az:Repo Microsoft PH",
		description:
			"Key launches from Universe &apos;25: agentic Copilot, GPT-powered code review, and the GitHub Models platform. Unpacked for the Microsoft Azure Community in Manila.",
		image: "azrepo.jpg",
		category: "Developer Tools",
		color: "var(--color-green)",
		href: "https://docs.google.com/presentation/d/1V4pM8MyWvL7RDXvM-_AKTCWY1SrnylaAmJcO-tjsS94/edit?usp=sharing",
	},
];

export function FeaturedSection() {
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

	const lead = featuredPosts[0];
	const rest = featuredPosts.slice(1);

	return (
		<section
			ref={sectionRef}
			id="featured"
			className="py-20 sm:py-28 px-4 sm:px-6"
		>
			<div className="max-w-6xl mx-auto">
				<div className="animate-on-scroll opacity-0 mb-12 sm:mb-16 max-w-3xl">
					<p className="eyebrow mb-4">Featured work</p>
					<h2 className="display-lg mb-4">
						Recent highlights from research, shipping, and talks.
					</h2>
					<p className="lede">
						A few recent pieces that capture how the research, engineering, and
						community sides fit together.
					</p>
				</div>

				{/* Lead announcement card (Nebius style) */}
				<Link
					href={lead.href}
					className="animate-on-scroll opacity-0 group relative block rounded-3xl overflow-hidden mb-6"
					style={{
						animationDelay: "100ms",
						backgroundColor: `color-mix(in oklch, ${lead.color} 12%, white)`,
					}}
				>
					<div className="grid md:grid-cols-5 gap-0 items-stretch">
						<div className="md:col-span-3 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
							<span
								className="inline-flex items-center rounded-full text-xs font-medium px-3 py-1 mb-5 w-fit"
								style={{
									backgroundColor: `color-mix(in oklch, ${lead.color} 20%, white)`,
									color: lead.color,
								}}
							>
								{lead.category}
							</span>
							<h3 className="text-2xl sm:text-3xl font-semibold text-foreground leading-snug mb-4 max-w-xl">
								{lead.title}
							</h3>
							<p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xl">
								{lead.description}
							</p>
							<span className="inline-flex items-center gap-2 text-sm font-medium rounded-full bg-foreground text-background px-5 py-2.5 w-fit transition-transform group-hover:translate-x-1">
								Read the breakdown
								<ArrowRight className="h-4 w-4" />
							</span>
						</div>
						<div className="md:col-span-2 relative min-h-[240px] md:min-h-full">
							<Image
								src={"/featured/" + lead.image}
								alt={lead.title}
								fill
								className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
							/>
						</div>
					</div>
				</Link>

				{/* Secondary feature cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
					{rest.map((post, index) => (
						<Link
							key={post.id}
							href={post.href}
							className="animate-on-scroll opacity-0 group relative rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-1"
							style={{
								animationDelay: `${(index + 2) * 100}ms`,
								backgroundColor: `color-mix(in oklch, ${post.color} 10%, white)`,
							}}
						>
							<div className="relative aspect-[4/3] overflow-hidden">
								<Image
									src={"/featured/" + post.image}
									alt={post.title}
									fill
									className="object-cover transition-transform duration-500 group-hover:scale-105"
								/>
							</div>
							<div className="p-5 sm:p-6">
								<span
									className="inline-flex items-center rounded-full text-[11px] font-medium px-2.5 py-1 mb-3"
									style={{
										backgroundColor: `color-mix(in oklch, ${post.color} 22%, white)`,
										color: post.color,
									}}
								>
									{post.category}
								</span>
								<h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug mb-3 line-clamp-2">
									{post.title}
								</h3>
								<span
									className="inline-flex items-center text-sm font-medium"
									style={{ color: post.color }}
								>
									Read more
									<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</span>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
