import { BarRows, chartRows } from "@/components/charts";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import type { ResearchStudy } from "@/lib/collections/schema";
import { cn, firstSentence } from "@/lib/utils";

const RESEARCH_URL = "https://experimentalmachines.org/research/";

/** "9 of 9" drawn literally: one cell per unit, the first N marked. */
function UnitGrid({ finding }: { finding: string }) {
	const m = /^(\d+) of (\d+)$/.exec(finding);
	if (!m) return null;
	const [hit, total] = [Number(m[1]), Number(m[2])];
	if (total < 1 || total > 36 || hit > total) return null;
	return (
		<div aria-hidden className="grid max-w-xs grid-cols-3 gap-1">
			{Array.from({ length: total }, (_, i) => (
				<span
					key={i}
					className={cn("h-4 rounded", i < hit ? "bg-white" : "bg-bar")}
				/>
			))}
		</div>
	);
}

function StudyLink({
	study,
	className,
}: {
	study: ResearchStudy;
	className?: string;
}) {
	return study.href ? (
		<a
			href={study.href}
			target="_blank"
			rel="noopener noreferrer"
			className={cn("text-link", className)}
		>
			{study.title}
		</a>
	) : (
		<span className={className}>{study.title}</span>
	);
}

export function ResearchSection({ studies }: { studies: ResearchStudy[] }) {
	const [lead, ...rest] = studies.slice(0, 4);
	if (!lead) return null;
	const leadRows = chartRows(lead.bars);

	return (
		<section
			aria-labelledby="research-title"
			className="site-container section-gap"
		>
			<SectionHeader
				id="research-title"
				title="Research."
				action={
					<Button asChild>
						<a href={RESEARCH_URL} target="_blank" rel="noopener noreferrer">
							All research
						</a>
					</Button>
				}
			>
				What we measure at Experimental Machines, and on which hardware.
			</SectionHeader>

			<article className="grid overflow-hidden rounded-[1.75rem] border border-border lg:grid-cols-[1.1fr_1fr]">
				<div className="surface-ink flex flex-col gap-5 p-6 sm:p-8">
					<div>
						<p className="finding">{lead.finding}</p>
						<p className="mt-2 max-w-md leading-snug text-on-deep">
							{lead.findingNote}
						</p>
					</div>
					{leadRows.length > 0 ? (
						<BarRows rows={leadRows} className="max-w-md" />
					) : (
						<UnitGrid finding={lead.finding} />
					)}
				</div>
				<div className="flex flex-col justify-center p-6 sm:p-8">
					<p className="text-sm text-muted-foreground">{lead.when}</p>
					<h3 className="display-md mt-2">
						<StudyLink study={lead} />
					</h3>
					<p className="mt-2 text-muted-foreground">
						{firstSentence(lead.summary)}
					</p>
				</div>
			</article>

			{rest.length > 0 && (
				<ul className="mt-4 grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
					{rest.map((study) => {
						const rows = chartRows(study.bars);
						return (
							<li
								key={study.id}
								// Shared rows, so the panels of a row end on one line.
								className="flex flex-col overflow-hidden rounded-[1.75rem] border border-border lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-y-0"
							>
								<div className="surface-ink flex flex-col justify-between gap-5 p-6">
									<div>
										<p className="finding">{study.finding}</p>
										<p className="mt-2 text-sm leading-snug text-on-deep">
											{study.findingNote}
										</p>
									</div>
									{rows.length > 0 && <BarRows rows={rows} />}
								</div>
								<div className="flex flex-col p-6">
									<p className="text-sm text-muted-foreground">{study.when}</p>
									<h3 className="display-sm mt-1">
										<StudyLink study={study} />
									</h3>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
