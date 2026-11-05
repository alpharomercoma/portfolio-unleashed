import Link from "next/link";

import { SiteImage } from "@/components/site-image";
import { lastGiven } from "@/components/speaking/talk-meta";
import type { Talk } from "@/lib/talks/schema";
import { cn } from "@/lib/utils";

/** A talk as one row: cover, where it was given, title, and, if there's room, tagline. */
export function TalkRow({
	talk,
	headingLevel: Heading = "h3",
	showTagline = false,
	showCover = true,
}: {
	talk: Talk;
	headingLevel?: "h2" | "h3";
	showTagline?: boolean;
	showCover?: boolean;
}) {
	const cover = showCover && Boolean(talk.showcaseImage);
	return (
		<article
			className={cn(
				"grid items-center gap-4 py-7",
				cover && "sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-7",
			)}
		>
			{cover && (
				<div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-secondary">
					<SiteImage
						src={talk.showcaseImage}
						alt=""
						fill
						sizes="(min-width: 640px) 13rem, 100vw"
						className="object-cover"
					/>
				</div>
			)}
			<div className="min-w-0">
				<p className="text-sm text-muted-foreground">{lastGiven(talk)}</p>
				<Heading className="display-sm mt-1.5">
					<Link href={`/speaking/${talk.slug}`} className="text-link">
						{talk.title}
					</Link>
				</Heading>
				{showTagline && talk.tagline && (
					<p className="mt-2 text-muted-foreground">{talk.tagline}</p>
				)}
			</div>
		</article>
	);
}
