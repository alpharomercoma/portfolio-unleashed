import Image from "next/image";
import Link from "next/link";

import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";

export type BlogCard = {
	slug: string;
	title: string;
	excerpt: string;
	date: string; // human-readable, already formatted server-side
	coverImage: string | null;
	coverAlt: string;
};

export function BlogSectionView({ posts }: { posts: BlogCard[] }) {
	return (
		<section
			id="blog"
			aria-labelledby="blog-title"
			className="site-container section-gap pb-16 lg:pb-24"
		>
			<SectionHeader
				id="blog-title"
				title="Writing."
				action={
					<Button asChild>
						<Link href="/blog">All posts</Link>
					</Button>
				}
			>
				Notes on machine learning, software, university, and travel.
			</SectionHeader>

			<ul className="grid gap-8 md:grid-cols-3 md:gap-6">
				{posts.map((post) => (
					<li key={post.slug} className="flex flex-col">
						<div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-secondary">
							{post.coverImage && (
								<Image
									src={post.coverImage}
									alt=""
									fill
									sizes="(min-width: 768px) 26rem, 100vw"
									className="object-cover"
								/>
							)}
						</div>
						<p className="mt-4 text-sm text-muted-foreground">{post.date}</p>
						<h3 className="display-sm mt-1.5">
							<Link href={`/blog/${post.slug}`} className="text-link">
								{post.title}
							</Link>
						</h3>
					</li>
				))}
			</ul>
		</section>
	);
}
