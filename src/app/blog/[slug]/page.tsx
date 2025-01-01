import { defineQuery } from "next-sanity";
import type { Metadata, ResolvingMetadata } from "next";
import { type PortableTextBlock } from "next-sanity";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Avatar from "../avatar";
import CoverImage from "../cover-image";
import DateComponent from "../date";
import MoreStories from "../more-stories";
import PortableText from "../portable-text";

import { sanityFetch } from "@/sanity/lib/fetch";
import { postQuery } from "@/sanity/lib/queries";
import { resolveOpenGraphImage } from "@/sanity/lib/utils";

type Props = {
	params: Promise<{ slug: string }>;
};

const postSlugs = defineQuery(
	`*[_type == "post" && defined(slug.current)]{"slug": slug.current}`,
);

export async function generateStaticParams() {
	return await sanityFetch({
		query: postSlugs,
		perspective: "published",
		stega: false,
	});
}

export async function generateMetadata(
	{ params }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const post = await sanityFetch({
		query: postQuery,
		params,
		stega: false,
	});
	const previousImages = (await parent).openGraph?.images || [];
	const ogImage = resolveOpenGraphImage(post?.coverImage);

	return {
		authors: post?.author?.name ? [{ name: post?.author?.name }] : [],
		title: post?.title,
		description: post?.excerpt,
		openGraph: {
			images: ogImage ? [ogImage, ...previousImages] : previousImages,
		},
	} satisfies Metadata;
}

export default async function PostPage({ params }: Props) {
	const post = await sanityFetch({ query: postQuery, params });

	if (!post?._id) {
		return notFound();
	}

	return (
		<div className="container mx-auto px-5">
			<article>
				<h1 className="mt-24 text-balance mb-12 text-6xl font-bold leading-tight tracking-tighter md:text-7xl md:leading-none lg:text-8xl">
					{post.title}
				</h1>
				<div className="hidden md:mb-12 md:block">
					{post.author && (
						<Avatar name={post.author.name} picture={post.author.picture} />
					)}
				</div>
				<div className="mb-8 sm:mx-0 md:mb-16">
					<CoverImage image={post.coverImage} priority />
				</div>
				<div className="mx-auto max-w-2xl">
					<div className="mb-6 block md:hidden">
						{post.author && (
							<Avatar name={post.author.name} picture={post.author.picture} />
						)}
					</div>
					<div className="mb-6 text-lg">
						<div className="mb-4 text-lg">
							<DateComponent dateString={post.date} />
						</div>
					</div>
				</div>
				{post.content?.length && (
					<PortableText
						className="mx-auto max-w-2xl"
						value={post.content as PortableTextBlock[]}
					/>
				)}
			</article>
			<aside>
				<hr className="border-accent-2 mb-24 mt-28" />
				<h2 className="mb-8 text-6xl font-bold leading-tight tracking-tighter md:text-7xl">
					Recent Stories
				</h2>
				<Suspense>
					<MoreStories skip={post._id} limit={2} />
				</Suspense>
			</aside>
		</div>
	);
}