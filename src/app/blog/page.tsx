import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import Avatar from "./avatar";
import CoverImage from "./cover-image";
import DateComponent from "./date";
import MoreStories from "./more-stories";

import { PageHeader } from "@/components/page-header";
import { firstSentence } from "@/lib/utils";
import type { HeroQueryResult } from "../../../sanity.types";
import { SITE_NAME } from "@/lib/seo";
import { sanityFetch } from "@/sanity/lib/fetch";
import { heroQuery } from "@/sanity/lib/queries";

const BLOG_DESCRIPTION =
	"Writing on machine learning, accelerated computing, and developer tools.";

export const metadata: Metadata = {
	title: "Writing",
	description: BLOG_DESCRIPTION,
	alternates: { canonical: "/blog" },
	openGraph: {
		type: "website",
		title: `Writing | ${SITE_NAME}`,
		description: BLOG_DESCRIPTION,
		url: "/blog",
		siteName: SITE_NAME,
		locale: "en_US",
		images: [{ url: "/og.png", alt: SITE_NAME }],
	},
	twitter: {
		card: "summary_large_image",
		site: "@alpharomercoma",
		creator: "@alpharomercoma",
		title: `Writing | ${SITE_NAME}`,
		description: BLOG_DESCRIPTION,
		images: ["/og.png"],
	},
};

function HeroPost({
	title,
	slug,
	excerpt,
	coverImage,
	date,
	author,
}: Pick<
	Exclude<HeroQueryResult, null>,
	"title" | "coverImage" | "date" | "excerpt" | "author" | "slug"
>) {
	return (
		<article className="grid overflow-hidden rounded-[1.75rem] border border-border lg:grid-cols-[1.1fr_1fr]">
			<div className="bg-secondary">
				<CoverImage
					image={coverImage}
					priority
					className="lg:h-full lg:object-cover"
				/>
			</div>
			<div className="flex flex-col justify-center p-8 sm:p-10">
				<p className="text-sm text-muted-foreground">
					<DateComponent dateString={date} />
				</p>
				<h2 className="display-md mt-3">
					<Link href={`/blog/${slug}`} className="text-link">
						{title}
					</Link>
				</h2>
				{excerpt && (
					<p className="mt-4 text-muted-foreground">{firstSentence(excerpt)}</p>
				)}
				{author && (
					<div className="mt-5">
						<Avatar name={author.name} picture={author.picture} />
					</div>
				)}
			</div>
		</article>
	);
}

export default async function Page() {
	const heroPost = await sanityFetch({ query: heroQuery });
	return (
		<>
			<PageHeader title="Writing.">
				Notes on machine learning, software, university, and travel.
			</PageHeader>
			<div className="site-container mt-10 pb-16 lg:pb-24">
				{heroPost ? (
					<HeroPost
						title={heroPost.title}
						slug={heroPost.slug}
						coverImage={heroPost.coverImage}
						excerpt={heroPost.excerpt}
						date={heroPost.date}
						author={heroPost.author}
					/>
				) : (
					<p className="text-muted-foreground">No posts are published yet.</p>
				)}
			</div>
			{heroPost?._id && (
				<Suspense>
					<MoreStories
						skip={heroPost._id}
						limit={100}
						title="More posts"
						className="pb-16 lg:pb-24"
					/>
				</Suspense>
			)}
		</>
	);
}
