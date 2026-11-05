import Link from "next/link";

import CoverImage from "./cover-image";
import DateComponent from "./date";

import { sanityFetch } from "@/sanity/lib/fetch";
import { moreStoriesQuery } from "@/sanity/lib/queries";

export default async function MoreStories({
	skip,
	limit,
	title,
	columns = 3,
	className,
}: {
	skip: string;
	limit: number;
	title: string;
	columns?: 2 | 3;
	className?: string;
}) {
	const data = await sanityFetch({
		query: moreStoriesQuery,
		params: { skip, limit },
	});
	// Nothing else to read, so no heading promising more.
	if (!data?.length) return null;

	return (
		<aside className={className}>
			<div className="site-container">
				<h2 className="display-md">{title}</h2>
				<ul
					className={`mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}
				>
					{/* eslint-disable @typescript-eslint/no-explicit-any */}
					{data?.map((post: any) => {
						const { _id, title, slug, coverImage } = post;
						return (
							<li key={_id}>
								<article>
									<div className="overflow-hidden rounded-2xl border border-border bg-secondary">
										<CoverImage image={coverImage} priority={false} />
									</div>
									<p className="mt-4 text-sm text-muted-foreground">
										<DateComponent dateString={post.date} />
									</p>
									<h3 className="display-sm mt-1.5">
										<Link href={`/blog/${slug}`} className="text-link">
											{title}
										</Link>
									</h3>
								</article>
							</li>
						);
					})}
				</ul>
			</div>
		</aside>
	);
}
