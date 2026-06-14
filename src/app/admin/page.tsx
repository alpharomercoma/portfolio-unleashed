import type { Metadata } from "next";
import Link from "next/link";

import { logout, removeTalk } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { getAllTalks, isStoreConfigured } from "@/lib/talks/store";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
	const talks = await getAllTalks();

	return (
		<main className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-12">
			<div className="max-w-5xl mx-auto">
				<header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
					<div>
						<h1 className="display-md">Talks</h1>
						<p className="text-sm text-muted-foreground mt-1">
							{talks.length} talks ·{" "}
							{talks.reduce((n, t) => n + t.events.length, 0)} events
						</p>
					</div>
					<div className="flex items-center gap-3">
						<Button asChild>
							<Link href="/admin/talks/new">New talk</Link>
						</Button>
						<form action={logout}>
							<Button variant="outline" type="submit">
								Log out
							</Button>
						</form>
					</div>
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
							<div className="min-w-0">
								<Link
									href={`/admin/talks/${t.slug}`}
									className="font-medium text-foreground hover:underline"
								>
									{t.title}
								</Link>
								<div className="text-xs text-muted-foreground mt-0.5">
									{t.category} · {t.type} · {t.events.length} events
									{t.featured ? " · featured" : ""}
									{t.needsReview ? " · needs review" : ""}
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
		</main>
	);
}
