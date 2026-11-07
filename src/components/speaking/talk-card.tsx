import Link from "next/link";

import { SiteImage } from "@/components/site-image";
import { lastGiven } from "@/components/speaking/talk-meta";
import type { Talk } from "@/lib/talks/schema";
import { cn } from "@/lib/utils";

/** One catalogue entry: its cover, where and when it was given, and its title. */
export function TalkRow({ talk }: { talk: Talk }) {
	const cover = Boolean(talk.showcaseImage);
	return (
		<article
			className={cn(
				"grid items-center gap-4 py-6",
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
				<h3 className="display-sm mt-1.5">
					<Link href={`/speaking/${talk.slug}`} className="text-link">
						{talk.title}
					</Link>
				</h3>
			</div>
		</article>
	);
}
