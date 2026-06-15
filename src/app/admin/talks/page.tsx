import Link from "next/link";

import { removeTalk } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { getAllTalks, isStoreConfigured } from "@/lib/talks/store";

export default async function AdminTalksPage() {
	const talks = await getAllTalks();

	return (
		<div>
			<header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="display-md">Talks</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{talks.length} talks ·{" "}
						{talks.reduce((n, t) => n + t.events.length, 0)} events
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/talks/new">New talk</Link>
				</Button>
			</header>

			{!isStoreConfigured && (
				<p className="mb-6 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
					Upstash Redis is not configured, so changes will not persist. Set
					<code className="mx-1">UPSTASH_REDIS_REST_URL</code> and
					<code className="mx-1">UPSTASH_REDIS_REST_TOKEN</code>. Showing the
					committed seed data.
				</p>
			)}

			<ul className="divide-y divide-border border-y border-border">
				{talks.map((t) => (
					<li
						key={t.slug}
						className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4"
					>
						<div className="flex items-center gap-3 min-w-0">
							{t.showcaseImage && (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={t.showcaseImage}
									alt=""
									loading="lazy"
									className="size-10 shrink-0 rounded-md border border-border bg-secondary object-cover"
								/>
							)}
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<Link
										href={`/admin/talks/${t.slug}`}
										className="font-medium text-foreground hover:underline"
									>
										{t.title}
									</Link>
									{t.status === "draft" && (
										<span className="inline-flex shrink-0 items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
											Draft
										</span>
									)}
								</div>
								<div className="text-xs text-muted-foreground mt-0.5">
									{[t.category, t.type, t.level, `${t.events.length} events`]
										.filter(Boolean)
										.join(" · ")}
									{t.featured ? " · featured" : ""}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<Button asChild variant="outline" size="sm">
								<Link href={`/admin/talks/${t.slug}`}>Edit</Link>
							</Button>
							<form action={removeTalk}>
								<input type="hidden" name="slug" value={t.slug} />
								<Button variant="outline" size="sm" type="submit">
									Delete
								</Button>
							</form>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
