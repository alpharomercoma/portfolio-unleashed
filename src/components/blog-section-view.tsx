"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

export type BlogCard = {
	slug: string;
	title: string;
	excerpt: string;
	date: string; // human-readable, already formatted server-side
	coverImage: string | null;
	coverAlt: string;
	color: string;
};

type Props = {
	posts: BlogCard[];
};

const MAX_LEAD = 3;

export function BlogSectionView({ posts }: Props) {
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

	const lead = posts.slice(0, MAX_LEAD);
	const more = posts.slice(MAX_LEAD);

	return (
		<section ref={sectionRef} id="blog" className="py-20 sm:py-28 px-4 sm:px-6">
			<div className="max-w-6xl mx-auto">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-16">
					<div className="max-w-3xl">
						<p className="animate-on-scroll opacity-0 eyebrow mb-4">Writing</p>
						<h2
							className="animate-on-scroll opacity-0 display-lg mb-4"
							style={{ animationDelay: "100ms" }}
						>
							Long-form on AI, engineering, and career.
						</h2>
						<p
							className="animate-on-scroll opacity-0 lede"
							style={{ animationDelay: "150ms" }}
						>
							Technique breakdowns, research playbooks, and candid notes from my
							path through student, engineer, and researcher.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="animate-on-scroll opacity-0 rounded-full h-10 px-5 text-sm border-gray-200 hover:bg-gray-50 shrink-0"
						style={{ animationDelay: "200ms" }}
						asChild
					>
						<Link href="/blog">
							All posts <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
						</Link>
					</Button>
				</div>

				{lead.length > 0 && (
					<div className="grid md:grid-cols-3 gap-5 mb-10">
						{lead.map((post, index) => (
							<Link
								key={post.slug}
								href={`/blog/${post.slug}`}
								className="animate-on-scroll opacity-0 rounded-3xl overflow-hidden group block bg-white border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)]"
								style={{ animationDelay: `${(index + 1) * 50}ms` }}
							>
								<div
									className="relative aspect-[16/10] overflow-hidden"
									style={{
										backgroundColor: `color-mix(in oklch, ${post.color} 12%, white)`,
									}}
								>
									{post.coverImage ? (
										<Image
											src={post.coverImage}
											alt={post.coverAlt}
											fill
											className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
											sizes="(max-width: 768px) 100vw, 33vw"
										/>
									) : null}
								</div>
								<div className="p-6">
									<h3 className="font-semibold text-foreground text-[17px] leading-snug tracking-tight mb-2.5">
										{post.title}
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
										{post.excerpt}
									</p>
									<div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-gray-100">
										<span>{post.date}</span>
										<span className="inline-flex items-center gap-1 font-medium text-foreground opacity-70 group-hover:opacity-100 transition-opacity">
											Read <ArrowRight className="h-3 w-3" />
										</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}

				{more.length > 0 && (
					<div className="grid md:grid-cols-3 gap-3">
						{more.map((post, index) => (
							<Link
								key={post.slug}
								href={`/blog/${post.slug}`}
								className="animate-on-scroll opacity-0 group flex items-start gap-4 p-5 rounded-2xl bg-gray-50/70 hover:bg-gray-50 transition-colors"
								style={{ animationDelay: `${(index + 4) * 50}ms` }}
							>
								<span
									className="mt-1 h-8 w-8 rounded-lg shrink-0"
									style={{
										backgroundColor: `color-mix(in oklch, ${post.color} 18%, white)`,
									}}
								/>
								<div className="min-w-0 flex-1">
									<h4 className="font-medium text-foreground text-sm leading-snug mb-1 group-hover:opacity-70 transition-opacity line-clamp-2">
										{post.title}
									</h4>
									<div className="text-xs text-muted-foreground">
										{post.date}
									</div>
								</div>
							</Link>
						))}
					</div>
				)}

				{posts.length === 0 && (
					<div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-10 text-center">
						<p className="text-sm text-muted-foreground">
							No published posts yet. Check back soon.
						</p>
					</div>
				)}
			</div>
		</section>
	);
}
