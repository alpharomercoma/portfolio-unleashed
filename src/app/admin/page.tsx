import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ADMIN_SECTIONS } from "@/lib/admin-sections";
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
	// Cards in the same order as the public site (see ADMIN_SECTIONS).
	const sections: SectionCard[] = await Promise.all(
		ADMIN_SECTIONS.map(async (s) => ({
			label: s.label,
			href: s.href,
			unit: s.unit,
			description: s.description,
			count:
				s.kind === "talks"
					? (await getAllTalks()).length
					: s.kind === "collection"
						? (await getAllItems(s.key)).length
						: undefined,
		})),
	);

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
