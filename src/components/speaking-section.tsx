import Link from "next/link";

import { Columns } from "@/components/charts";
import { SectionHeader } from "@/components/section-header";
import { headlineEvent, longDate } from "@/components/speaking/talk-meta";
import { Button } from "@/components/ui/button";
import {
	type Talk,
	computeStats,
	isDelivered,
	sessionsByYear,
} from "@/lib/talks/schema";

export function SpeakingSection({
	talks,
	all,
}: {
	/** The talks to feature. */
	talks: Talk[];
	/** Every published talk, for the totals. */
	all: Talk[];
}) {
	if (talks.length === 0) return null;
	const stats = computeStats(all);
	const byYear = sessionsByYear(all);
	const latestYear = byYear.at(-1)?.year;

	return (
		<section
			id="speaking"
			aria-labelledby="speaking-title"
			className="site-container section-gap"
		>
			<SectionHeader
				id="speaking-title"
				title="Speaking."
				action={
					<Button asChild>
						<Link href="/speaking">All {stats.talks} talks</Link>
					</Button>
				}
			>
				From PyTorch Conference Europe to community stages across the
				Philippines.
			</SectionHeader>

			<div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
				<div className="surface-ink flex flex-col justify-between gap-6 self-start rounded-[1.75rem] p-6 sm:p-8">
					<div>
						<p className="finding">{stats.attendees.toLocaleString("en-US")}</p>
						<p className="mt-2 leading-snug text-on-deep">
							attendees across {stats.sessions} sessions
						</p>
					</div>
					<div>
						<p className="mb-3 text-sm text-on-deep">Sessions by year</p>
						<Columns
							data={byYear.map((y) => ({
								label: y.year,
								value: y.sessions,
								highlight: y.year === latestYear,
							}))}
						/>
					</div>
				</div>

				<ul className="border-b border-border">
					{talks.map((talk) => {
						const event = headlineEvent(talk);
						const upcoming = event ? !isDelivered(event) : false;
						return (
							<li key={talk.slug} className="border-t border-border py-5">
								<p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
									{upcoming && (
										<span className="rounded-full bg-brand px-2.5 py-0.5 font-medium text-white">
											Upcoming
										</span>
									)}
									{event &&
										[event.venue, longDate(event.date)]
											.filter(Boolean)
											.join(", ")}
								</p>
								<p className="display-md mt-2">{event?.eventName}</p>
								<h3 className="mt-1 leading-snug">
									<Link href={`/speaking/${talk.slug}`} className="text-link">
										{talk.title}
									</Link>
								</h3>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
