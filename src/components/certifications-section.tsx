import { ArrowUpRight } from "lucide-react";

import { ShowMore } from "@/components/show-more";
import { SiteImage } from "@/components/site-image";
import { SectionHeader } from "@/components/section-header";
import { assetUrl } from "@/lib/assets";
import type { Certification } from "@/lib/collections/schema";

// The credentials that speak to the job lead. The rest are one click away, so this
// is evidence for the role and not a wall of badges.
const LEADS = /machine learning|pytorch|azure ai engineer/i;

function monthYear(iso: string): string {
	const d = new Date(iso);
	return Number.isNaN(d.getTime())
		? ""
		: d.toLocaleDateString("en-GB", {
				month: "long",
				year: "numeric",
				timeZone: "UTC",
			});
}

function CertTitle({ cert }: { cert: Certification }) {
	return cert.link ? (
		<a
			href={cert.link}
			target="_blank"
			rel="noopener noreferrer"
			className="text-link inline-flex items-start gap-1"
		>
			{cert.title}
			<ArrowUpRight className="mt-1 size-3.5 shrink-0" aria-hidden />
		</a>
	) : (
		cert.title
	);
}

function byline(cert: Certification): string {
	return [cert.issuer, monthYear(cert.date)].filter(Boolean).join(", ");
}

export function CertificationsSection({
	certifications,
}: {
	certifications: Certification[];
}) {
	const matched = certifications.filter((c) => LEADS.test(c.title));
	// With none of the leads to show, the top row still shows something.
	const leads = matched.length > 0 ? matched : certifications.slice(0, 4);
	const others = certifications.filter((c) => !leads.includes(c));
	if (certifications.length === 0) return null;

	return (
		<section
			id="certifications"
			aria-labelledby="certifications-title"
			className="site-container section-gap"
		>
			<SectionHeader id="certifications-title" title="Certifications." />

			<ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
				{leads.map((c) => (
					<li key={c.id} className="border-t-2 border-brand pt-5">
						{c.logo && (
							<SiteImage
								src={assetUrl(c.logo, "/certification/logo")}
								alt=""
								width={128}
								height={40}
								className="mb-4 h-9 w-32 object-contain object-left grayscale"
							/>
						)}
						<h3 className="font-display text-lg leading-snug tracking-[-0.01em]">
							<CertTitle cert={c} />
						</h3>
						<p className="mt-1.5 text-sm text-muted-foreground">{byline(c)}</p>
					</li>
				))}
			</ul>

			{others.length > 0 && (
				<ShowMore count={others.length}>
					<ul className="mt-6 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
						{others.map((c) => (
							<li key={c.id} className="border-t border-border py-3 text-sm">
								<span className="font-medium">
									<CertTitle cert={c} />
								</span>
								<span className="mt-0.5 block text-muted-foreground">
									{byline(c)}
								</span>
							</li>
						))}
					</ul>
				</ShowMore>
			)}
		</section>
	);
}
