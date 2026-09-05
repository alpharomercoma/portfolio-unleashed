"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import type { Award, Certification } from "@/lib/collections/schema";
import { cn } from "@/lib/utils";

// How much shows before "Show all". Three awards is one row of certificate
// images; six is the noisiest patch on the page because every scan has its
// own colours and type. Six credentials is two even rows of three.
const AWARDS_PREVIEW = 3;
const CERTS_PREVIEW = 6;

// Bare file names resolve to the public asset dir; full URLs/paths pass through.
function asset(dir: string, value: string) {
	if (!value) return "";
	return /^(https?:|\/)/.test(value) ? value : `${dir}/${value}`;
}

function formatDate(iso: string) {
	if (!iso) return "";
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function CredentialRow({ cert }: { cert: Certification }) {
	const inner = (
		<>
			<span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary overflow-hidden">
				<Image
					src={asset("/certification/logo", cert.logo)}
					alt={cert.issuer}
					width={28}
					height={28}
					className="size-6 object-contain"
				/>
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-medium text-foreground leading-snug">
					{cert.title}
				</span>
				<span className="block text-xs text-muted-foreground mt-0.5">
					{cert.issuer} · {formatDate(cert.date)}
				</span>
			</span>
			{cert.link && (
				<ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
			)}
		</>
	);
	const className =
		"group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-300";

	// A credential without a verification link is plain text, not a dead link.
	return cert.link ? (
		<Link
			href={cert.link}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				className,
				"hover:-translate-y-0.5 hover:border-foreground/25",
			)}
		>
			{inner}
		</Link>
	) : (
		<div className={className}>{inner}</div>
	);
}

export function RecognitionSection({
	awards,
	certifications,
}: {
	awards: Award[];
	certifications: Certification[];
}) {
	const sectionRef = useReveal<HTMLElement>();
	const [expanded, setExpanded] = useState(false);
	const [awardsExpanded, setAwardsExpanded] = useState(false);
	const listId = useId();
	const awardsId = useId();
	const total = certifications.length;
	const visible = expanded
		? certifications
		: certifications.slice(0, CERTS_PREVIEW);
	const hasMore = total > CERTS_PREVIEW;
	const visibleAwards = awardsExpanded
		? awards
		: awards.slice(0, AWARDS_PREVIEW);
	const moreAwards = awards.length > AWARDS_PREVIEW;

	return (
		<section
			ref={sectionRef}
			id="recognition"
			className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-lime-wash border-t border-border"
		>
			<div className="max-w-6xl mx-auto">
				<div className="animate-on-scroll opacity-0 mb-12 sm:mb-16 max-w-3xl">
					<h2 className="display-lg mb-5">
						Honored as a PH100 mind and the national AI champion.
					</h2>
					<p className="lede">
						Awards across AI research and hackathons, plus {total} industry
						credentials from Google, Microsoft, AWS, GitHub, and more.
					</p>
				</div>

				{/* Awards */}
				<div
					id={awardsId}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
				>
					{visibleAwards.map((award, index) => (
						<article
							key={award.id}
							className="animate-on-scroll opacity-0 flex flex-col rounded-3xl overflow-hidden bg-card border border-border transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
							style={{ animationDelay: `${index * 70}ms` }}
						>
							<div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
								<Image
									src={asset("/awards", award.image)}
									alt={award.title}
									fill
									sizes="(max-width: 640px) 100vw, 33vw"
									className="object-cover"
								/>
							</div>
							<div className="flex flex-col flex-1 p-5 sm:p-6">
								<div className="flex items-center justify-between gap-2 mb-3">
									<span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
										<span
											aria-hidden
											className="size-1.5 rounded-full bg-lime-strong"
										/>
										{award.category}
									</span>
									<span className="font-mono text-xs text-muted-foreground tabular-nums">
										{award.year}
									</span>
								</div>
								<h3 className="font-display text-base font-semibold text-foreground leading-snug tracking-tight mb-1.5">
									{award.title}
								</h3>
								<p className="text-xs font-medium text-muted-foreground mb-2.5">
									{award.organization}
								</p>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{award.context}
								</p>
							</div>
						</article>
					))}
				</div>
				{moreAwards && (
					<div className="mt-6">
						<Button
							type="button"
							variant="outline"
							size="sm"
							aria-expanded={awardsExpanded}
							aria-controls={awardsId}
							onClick={() => setAwardsExpanded((v) => !v)}
						>
							{awardsExpanded
								? "Show fewer awards"
								: `Show all ${awards.length} awards`}
							<ChevronDown
								className={cn(
									"size-3.5 transition-transform",
									awardsExpanded && "rotate-180",
								)}
							/>
						</Button>
					</div>
				)}

				{/* Credentials: sit directly on the lime wash (no card-in-a-card) and
				    expand in place instead of paging through five screens. */}
				<div className="animate-on-scroll opacity-0 mt-16 sm:mt-20">
					<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
						<div>
							<h3 className="font-display text-2xl font-semibold tracking-tight">
								{total} industry credentials
							</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Cloud, ML, and security certifications, newest first.
							</p>
						</div>
						{hasMore && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								aria-expanded={expanded}
								aria-controls={listId}
								onClick={() => setExpanded((v) => !v)}
								className="shrink-0 w-fit"
							>
								{expanded ? "Show fewer" : `Show all ${total}`}
								<ChevronDown
									className={cn(
										"size-3.5 transition-transform",
										expanded && "rotate-180",
									)}
								/>
							</Button>
						)}
					</div>

					<div
						id={listId}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
					>
						{visible.map((cert) => (
							<CredentialRow key={cert.id} cert={cert} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
