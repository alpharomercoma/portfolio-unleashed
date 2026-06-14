import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { COLLECTIONS } from "@/lib/collections/registry";
import { getAllItems } from "@/lib/collections/store";
import { getAllTalks } from "@/lib/talks/store";

type SectionCard = {
	label: string;
	href: string;
	count?: number;
	unit: string;
	description: string;
};

export default async function AdminHub() {
	const talks = await getAllTalks();

	const collectionCards: SectionCard[] = await Promise.all(
		Object.values(COLLECTIONS).map(async (c) => ({
			label: c.labelPlural,
			href: `/admin/${c.key}`,
			count: (await getAllItems(c.key)).length,
			unit: c.labelPlural.toLowerCase(),
			description: c.description,
		})),
	);

	const sections: SectionCard[] = [
		{
			label: "Talks",
			href: "/admin/talks",
			count: talks.length,
			unit: "talks",
			description:
				"Talks, workshops, keynotes, and podcasts with their events.",
		},
		...collectionCards,
		{
			label: "About",
			href: "/admin/about",
			unit: "about page",
			description: "Your personal story, written in markdown with images.",
		},
	];

	return (
		<div>
			<header className="mb-8">
				<h1 className="display-md">Overview</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Manage the content that powers the public site. Changes publish on
					save.
				</p>
			</header>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{sections.map((s) => (
					<Link
						key={s.href}
						href={s.href}
						className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-lime/70"
					>
						<div className="flex items-baseline justify-between gap-3">
							<h2 className="font-display text-lg font-semibold tracking-tight">
								{s.label}
							</h2>
							{s.count !== undefined && (
								<span className="font-mono text-2xl font-bold tabular-nums text-foreground">
									{s.count}
								</span>
							)}
						</div>
						<p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
							{s.description}
						</p>
						<span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
							Manage {s.unit}
							<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
						</span>
					</Link>
				))}
			</div>
		</div>
	);
}
