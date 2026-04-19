import { BlogSectionView, type BlogCard } from "@/components/blog-section-view";
import { sanityFetch } from "@/sanity/lib/fetch";
import { latestPostsQuery } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/utils";

// Number of latest posts to pull from Sanity. Sanity CDN + the sanityFetch
// ISR helper revalidate this every 60s, so publishing a post on Sanity
// surfaces it here without a rebuild. Newest auto-adds, oldest rolls off.
const LIMIT = 6;

const COLORS = [
	"var(--color-blue)",
	"var(--color-red)",
	"var(--color-yellow)",
	"var(--color-green)",
];

function formatDate(iso: string) {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export async function BlogSection() {
	const posts = await sanityFetch({
		query: latestPostsQuery,
		params: { limit: LIMIT },
	});

	const cards: BlogCard[] = (posts ?? [])
		.filter((p): p is typeof p & { slug: string } => !!p.slug)
		.map((p, i) => {
			const coverImage = p.coverImage
				? (urlForImage(p.coverImage)
						?.width(960)
						.height(600)
						.fit("crop")
						.auto("format")
						.url() ?? null)
				: null;
			return {
				slug: p.slug,
				title: p.title || "Untitled",
				excerpt: p.excerpt ?? "",
				date: formatDate(p.date),
				coverImage,
				coverAlt: p.coverImage?.alt ?? p.title ?? "",
				color: COLORS[i % COLORS.length],
			};
		});

	return <BlogSectionView posts={cards} />;
}
