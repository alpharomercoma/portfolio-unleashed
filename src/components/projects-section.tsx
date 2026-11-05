import Link from "next/link";
import { ChevronDown, Github } from "lucide-react";

import { BarRows, chartRows } from "@/components/charts";
import { SectionHeader } from "@/components/section-header";
import { SiteImage } from "@/components/site-image";
import { assetUrl } from "@/lib/assets";
import type { Project } from "@/lib/collections/schema";
import { cn, firstSentence } from "@/lib/utils";

function ProjectLinks({
	project,
	onDark,
}: {
	project: Project;
	onDark?: boolean;
}) {
	const demoLabel = project.demoLabel || "Live demo";
	const linkClass = cn(
		"inline-flex min-h-8 items-center",
		onDark ? "on-color-link" : "text-link",
	);
	return (
		<ul className="flex flex-wrap items-center gap-x-5 text-sm font-medium">
			{project.demo && (
				<li>
					{project.demo.startsWith("/") ? (
						<Link href={project.demo} className={linkClass}>
							{demoLabel}
						</Link>
					) : (
						<a
							href={project.demo}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`${demoLabel}: ${project.title}`}
							className={linkClass}
						>
							{demoLabel}
						</a>
					)}
				</li>
			)}
			{project.github && (
				<li>
					<a
						href={project.github}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`Code for ${project.title}`}
						className={cn(linkClass, "gap-1.5")}
					>
						<Github className="size-3.5" aria-hidden />
						Code
					</a>
				</li>
			)}
		</ul>
	);
}

/** Name and maker, then the line it opens with. */
function ProjectIntro({
	project,
	large,
	onDark,
}: {
	project: Project;
	large?: boolean;
	onDark?: boolean;
}) {
	// With no line of its own, the name is the heading; never print it twice.
	const heading = project.headline || project.title;
	return (
		<>
			{project.headline && (
				<p
					className={cn(
						"text-sm",
						onDark ? "text-on-deep" : "text-muted-foreground",
					)}
				>
					<span
						className={cn(
							"font-medium",
							onDark ? "text-white" : "text-foreground",
						)}
					>
						{project.title}
					</span>
					{project.org && `, ${project.org}`}
				</p>
			)}
			<h3
				className={cn(
					project.headline && "mt-1",
					large ? "display-md" : "display-sm",
				)}
			>
				{heading}
			</h3>
		</>
	);
}

/** The result the section opens on: what it is, then its number and bars on one scale. */
function ProjectLead({ project }: { project: Project }) {
	const rows = chartRows(project.bars);
	return (
		<article className="surface-ink grid gap-6 rounded-[1.75rem] p-6 [overflow-wrap:anywhere] sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-12">
			<div>
				<ProjectIntro project={project} large onDark />
				{project.description && (
					<p className="mt-2 max-w-lg text-on-deep">
						{firstSentence(project.description)}
					</p>
				)}
				<div className="mt-2">
					<ProjectLinks project={project} onDark />
				</div>
			</div>
			<div>
				<div className="flex flex-wrap items-end gap-x-4 gap-y-1">
					<p className="finding-xl">{project.finding}</p>
					<p className="max-w-xs pb-1 text-sm leading-snug text-on-deep">
						{project.findingNote}
					</p>
				</div>
				{rows.length > 0 && <BarRows rows={rows} className="mt-5" />}
			</div>
		</article>
	);
}

/** A measured project: what it does and looks like, then what it measured. */
function ProjectFeature({
	project,
	flip,
}: {
	project: Project;
	flip: boolean;
}) {
	const rows = chartRows(project.bars);
	const shot = assetUrl(project.shot, "/projects");
	const wide = project.shotKind === "wide";
	return (
		<li className="grid overflow-hidden rounded-[1.75rem] border border-border [overflow-wrap:anywhere] lg:grid-cols-2">
			<div
				className={cn(
					"flex flex-col p-5 sm:p-6",
					shot ? "bg-brand-wash pb-0 sm:pb-0" : "justify-center",
					flip && "lg:order-2",
				)}
			>
				<ProjectIntro project={project} large />
				<p className="mt-1 text-muted-foreground">
					{firstSentence(project.description)}
				</p>
				<div className="mt-1">
					<ProjectLinks project={project} />
				</div>
				{shot && (
					// The top of the screen, running off the bottom of the card.
					<div
						className={cn(
							"relative mt-3 w-full overflow-hidden rounded-t-[1.25rem] border border-b-0 border-border bg-white",
							wide ? "aspect-[5/2]" : "mx-auto aspect-[4/5] max-w-44",
						)}
					>
						<SiteImage
							src={shot}
							alt={project.shotAlt}
							fill
							sizes={wide ? "(min-width: 1024px) 34rem, 100vw" : "11rem"}
							className="object-cover object-top"
						/>
					</div>
				)}
			</div>
			<div className="surface-ink flex flex-col justify-center gap-4 p-5 sm:p-6">
				<div>
					<p className="finding">{project.finding}</p>
					<p className="mt-1.5 max-w-md text-sm leading-snug text-on-deep">
						{project.findingNote}
					</p>
				</div>
				{rows.length > 0 && <BarRows rows={rows} />}
			</div>
		</li>
	);
}

/** A project with no feature: its number if it has one, its name, one line, its links. */
function ProjectTile({ project }: { project: Project }) {
	const line = project.finding
		? project.findingNote
		: project.headline || firstSentence(project.description);
	return (
		<li className="flex flex-col border-t-2 border-brand pt-4 [overflow-wrap:anywhere]">
			{project.finding && (
				<p className="finding mb-2 text-brand-strong">{project.finding}</p>
			)}
			<h3 className="font-medium">{project.title}</h3>
			{line && (
				<p className="mt-1 text-sm leading-snug text-muted-foreground">
					{line}
				</p>
			)}
			<div className="mt-auto pt-1">
				<ProjectLinks project={project} />
			</div>
		</li>
	);
}

/** The rest, out of the way: a row that opens into a short list. */
function OtherProjects({ projects }: { projects: Project[] }) {
	return (
		<details className="group mt-8 border-y border-border [overflow-wrap:anywhere]">
			<summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
				Other projects
				<ChevronDown
					className="size-4 transition-transform group-open:rotate-180"
					aria-hidden
				/>
			</summary>
			<ul>
				{projects.map((project) => (
					<li
						key={project.id}
						className="grid gap-x-6 border-t border-border py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-center"
					>
						<h3 className="font-medium">{project.title}</h3>
						<p className="text-sm leading-snug text-muted-foreground">
							{project.headline || firstSentence(project.description)}
						</p>
						<ProjectLinks project={project} />
					</li>
				))}
			</ul>
		</details>
	);
}

/** Even rows whatever the count: fours, threes, or twos. */
function tileGrid(count: number) {
	return cn(
		"grid gap-x-6 gap-y-8 sm:grid-cols-2",
		count % 4 === 0 && "lg:grid-cols-4",
		count % 3 === 0 && "lg:grid-cols-3",
	);
}

function ProjectGroup({
	id,
	title,
	projects,
	lead,
	children,
}: {
	id: string;
	title: string;
	projects: Project[];
	/** Open on the first measured project at full size. */
	lead?: boolean;
	children?: React.ReactNode;
}) {
	if (projects.length === 0) return null;
	const measured = projects.filter(
		(p) => p.finding && (chartRows(p.bars).length > 0 || p.shot),
	);
	const opener = lead ? measured[0] : undefined;
	const features = measured.filter((p) => p !== opener);
	const others = projects.filter((p) => !measured.includes(p));
	// Tiles with a number share a row, so the ones without don't sit beside them
	// starting a screen's worth of type higher.
	const numbered = others.filter((p) => p.finding);
	const plain = others.filter((p) => !p.finding);
	const plainTiles = (
		<ul className={cn(tileGrid(plain.length), "mt-8")}>
			{plain.map((project) => (
				<ProjectTile key={project.id} project={project} />
			))}
		</ul>
	);
	return (
		<section
			id={id}
			aria-labelledby={`${id}-title`}
			className="site-container section-gap"
		>
			<SectionHeader id={`${id}-title`} title={title}>
				{children}
			</SectionHeader>
			<div className="space-y-4">
				{opener && <ProjectLead project={opener} />}
				{features.length > 0 && (
					<ul className="grid gap-4">
						{features.map((project, i) => (
							<ProjectFeature
								key={project.id}
								project={project}
								flip={i % 2 === 1}
							/>
						))}
					</ul>
				)}
			</div>
			{numbered.length > 0 && (
				<ul className={cn(tileGrid(numbered.length), "mt-8")}>
					{numbered.map((project) => (
						<ProjectTile key={project.id} project={project} />
					))}
				</ul>
			)}
			{plain.length > 0 &&
				(numbered.length > 0 ? <OtherProjects projects={plain} /> : plainTiles)}
		</section>
	);
}

export function ProjectsSection({ projects }: { projects: Project[] }) {
	return (
		<ProjectGroup
			id="projects"
			title="Projects."
			projects={projects.filter((p) => p.category !== "Data")}
			lead
		/>
	);
}

export function DataSection({ projects }: { projects: Project[] }) {
	return (
		<ProjectGroup
			id="data"
			title="Data."
			projects={projects.filter((p) => p.category === "Data")}
		>
			Scrapers and datasets.
		</ProjectGroup>
	);
}
