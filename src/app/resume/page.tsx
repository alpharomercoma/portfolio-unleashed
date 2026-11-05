import { format } from "date-fns";
import { Download } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
	getResumeMarkdown,
	getResumeVersion,
	RESUME_FILENAME,
	RESUME_RELEASES_URL,
} from "@/lib/resume";

// ISR: pick up a new resume release within the hour, no redeploy needed.
export const revalidate = 3600;

const DESCRIPTION =
	"Alpha Romer Coma's one-page resume: machine learning engineer working on accelerated computing, edge AI, and data pipelines.";

export const metadata: Metadata = {
	title: "Resume | Alpha Romer Coma",
	description: DESCRIPTION,
	alternates: { canonical: "/resume" },
	openGraph: {
		type: "website",
		title: "Resume | Alpha Romer Coma",
		description: DESCRIPTION,
		url: "/resume",
		siteName: "Alpha Romer Coma",
		locale: "en_US",
		images: [{ url: "/og.png", alt: "Alpha Romer Coma" }],
	},
};

export default async function ResumePage() {
	const [version, markdown] = await Promise.all([
		getResumeVersion(),
		getResumeMarkdown(),
	]);

	return (
		<SiteShell>
			<PageHeader
				title="Resume."
				meta={
					version && (
						<>
							Updated {format(new Date(version.publishedAt), "d MMMM yyyy")},
							version {version.version}
						</>
					)
				}
			>
				One page, versioned in Git, and regenerated whenever something changes.
			</PageHeader>

			<div className="site-container mt-8 pb-16 lg:pb-24">
				<div className="flex flex-wrap items-center gap-3">
					<Button asChild size="lg">
						<a href="/resume.pdf" download={`${RESUME_FILENAME}.pdf`}>
							<Download aria-hidden />
							Download PDF
						</a>
					</Button>
					<Button asChild size="lg" variant="outline">
						<a href="/resume.pdf" target="_blank" rel="noopener">
							Open PDF
						</a>
					</Button>
					<Button asChild size="lg" variant="outline">
						<a
							href={RESUME_RELEASES_URL}
							target="_blank"
							rel="noopener noreferrer"
						>
							Version history
						</a>
					</Button>
				</div>

				{version ? (
					<a
						href="/resume.pdf"
						target="_blank"
						rel="noopener"
						aria-label="Open the resume PDF"
						className="mt-10 block max-w-4xl overflow-hidden rounded-[1.25rem] border border-border bg-white"
					>
						{/* Unoptimized: the PNG is already sized for the page, and the
						    version query busts caches whenever a new release lands. */}
						<Image
							src={`/resume.png?v=${version.version}`}
							alt="Alpha Romer Coma's resume. A text version follows below."
							width={1191}
							height={1684}
							unoptimized
							priority
							className="h-auto w-full"
						/>
					</a>
				) : (
					<p className="mt-10 max-w-2xl text-muted-foreground">
						The resume preview is unavailable right now. The latest PDF is
						always on{" "}
						<a href={RESUME_RELEASES_URL} className="text-link">
							GitHub
						</a>
						.
					</p>
				)}

				{markdown && (
					<details className="mt-10 max-w-4xl rounded-[1.25rem] border border-border p-6">
						<summary className="cursor-pointer font-medium">
							Text version
						</summary>
						<div className="mt-4">
							<Markdown>{markdown}</Markdown>
						</div>
					</details>
				)}
			</div>
		</SiteShell>
	);
}
