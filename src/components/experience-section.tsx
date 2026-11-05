import { LabCards } from "@/components/lab-cards";
import { RichLine } from "@/components/rich-line";
import { SectionHeader } from "@/components/section-header";
import type { ResumeRole } from "@/lib/resume";

// Two lines a role; /resume has the rest.
const HIGHLIGHTS = 2;
// Told in full under Projects, so preferably not repeated here.
const TOLD_ELSEWHERE =
	/OpenWeights|ExecuServe|18 ExecuTorch|PyTorch ExecuTorch|prefix reuse/i;
// Never here: grants and sponsorships read as achievements the owner doesn't want
// promoted, and "25+ talks" disagrees with the count under Speaking.
const LEFT_OUT = /compute grant|sponsorships|25\+ talks/i;

export function pickHighlights(highlights: string[]): string[] {
	const allowed = highlights.filter((h) => !LEFT_OUT.test(h));
	const fresh = allowed.filter((h) => !TOLD_ELSEWHERE.test(h));
	return (fresh.length > 0 ? fresh : allowed).slice(0, HIGHLIGHTS);
}

/** The role itself still shows if no line is left to show under it. */
function RoleLines({ highlights }: { highlights: string[] }) {
	const lines = pickHighlights(highlights);
	if (lines.length === 0) return null;
	return (
		<ul className="space-y-2 leading-relaxed text-muted-foreground">
			{lines.map((h) => (
				<li key={h}>
					<RichLine text={h} />
				</li>
			))}
		</ul>
	);
}

export function ExperienceSection({ roles }: { roles: ResumeRole[] }) {
	return (
		<section
			id="experience"
			aria-labelledby="experience-title"
			className="site-container section-gap"
		>
			<SectionHeader id="experience-title" title="Experience." />
			<LabCards />
			<ul className="border-b border-border">
				{roles.map((r) => (
					<li
						key={`${r.organization}-${r.role}`}
						className="grid gap-x-12 gap-y-4 border-t border-border py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
					>
						<div>
							<h3 className="display-md">
								{r.url ? (
									<a
										href={r.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-link"
									>
										{r.organization}
									</a>
								) : (
									r.organization
								)}
							</h3>
							<p className="mt-2 font-medium">{r.role}</p>
							<p className="mt-0.5 text-sm text-muted-foreground">{r.dates}</p>
						</div>
						<RoleLines highlights={r.highlights} />
					</li>
				))}
			</ul>
		</section>
	);
}
