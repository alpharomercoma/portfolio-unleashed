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

import { SITE_NAME, SITE_URL } from "@/lib/seo";
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
	return (
		(await sanityFetch({
			query: postSlugs,
			perspective: "published",
			stega: false,
		})) ?? []
	);
}

export async function generateMetadata(
	{ params }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const { slug } = await params;
	const post = await sanityFetch({
		query: postQuery,
		params,
		stega: false,
	});
	if (!post?._id) return { title: "Post not found", robots: { index: false } };

	const previousImages = (await parent).openGraph?.images || [];
	const ogImage = resolveOpenGraphImage(post?.coverImage);
	const path = `/blog/${slug}`;
	const published = post.date ? new Date(post.date).toISOString() : undefined;

	return {
		title: post.title ?? undefined,
		description: post.excerpt ?? undefined,
		authors: post?.author?.name ? [{ name: post.author.name }] : [],
		alternates: { canonical: path },
		openGraph: {
			type: "article",
			title: post.title ?? undefined,
			description: post.excerpt ?? undefined,
			url: path,
			siteName: SITE_NAME,
			images: ogImage ? [ogImage, ...previousImages] : previousImages,
			...(published ? { publishedTime: published } : {}),
		},
		twitter: {
			card: "summary_large_image",
			site: "@alpharomercoma",
			creator: "@alpharomercoma",
			title: post.title ?? undefined,
			description: post.excerpt ?? undefined,
			images: ogImage ? [ogImage.url] : undefined,
		},
	} satisfies Metadata;
}

export default async function PostPage({ params }: Props) {
	const { slug } = await params;
	const post = await sanityFetch({ query: postQuery, params });

	if (!post?._id) {
		return notFound();
	}

	const ogImage = resolveOpenGraphImage(post.coverImage);
	const url = `${SITE_URL}/blog/${slug}`;
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.excerpt ?? undefined,
		image: ogImage?.url,
		url,
		mainEntityOfPage: url,
		...(post.date ? { datePublished: post.date, dateModified: post.date } : {}),
		author: {
			"@type": "Person",
			name: post.author?.name ?? SITE_NAME,
			url: SITE_URL,
		},
	};

	return (
		<div className="container mx-auto px-5">
			<script
				type="application/ld+json"
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
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
