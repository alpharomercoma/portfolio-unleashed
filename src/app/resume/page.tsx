import { format } from "date-fns";
import { Download, ExternalLink, History } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { Footer } from "@/components/footer";
import { Markdown } from "@/components/markdown";
import { Navbar } from "@/components/navbar";
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
		<main className="min-h-screen bg-background">
			<Navbar />
			<section className="px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-24">
				<div className="max-w-4xl mx-auto">
					<header>
						<h1 className="display-xl">
							<span className="lime-mark">Resume</span>.
						</h1>
						<p className="lede mt-6">
							One page, versioned in Git, and regenerated whenever something
							changes.
						</p>
						{version && (
							<p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
								Updated {format(new Date(version.publishedAt), "MMMM d, yyyy")}{" "}
								· {version.version}
							</p>
						)}
						<div className="mt-8 flex flex-wrap items-center gap-3">
							<Button asChild size="lg">
								<a href="/resume.pdf" download={`${RESUME_FILENAME}.pdf`}>
									<Download className="h-4 w-4" />
									Download PDF
								</a>
							</Button>
							<Button asChild size="lg" variant="outline">
								<a href="/resume.pdf" target="_blank" rel="noopener">
									<ExternalLink className="h-4 w-4" />
									Open PDF
								</a>
							</Button>
							<Button asChild size="lg" variant="outline">
								<a
									href={RESUME_RELEASES_URL}
									target="_blank"
									rel="noopener noreferrer"
								>
									<History className="h-4 w-4" />
									Version history
								</a>
							</Button>
						</div>
					</header>

					{version ? (
						<a
							href="/resume.pdf"
							target="_blank"
							rel="noopener"
							className="mt-12 block overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
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
						<p className="mt-12 rounded-lg border border-border p-6 text-muted-foreground">
							The resume preview is unavailable right now. The latest PDF is
							always on{" "}
							<a
								href={RESUME_RELEASES_URL}
								className="font-medium text-foreground underline decoration-lime/70 underline-offset-4"
							>
								GitHub
							</a>
							.
						</p>
					)}

					{markdown && (
						<details className="mt-10 rounded-lg border border-border p-6">
							<summary className="cursor-pointer font-medium">
								Text version
							</summary>
							<div className="mt-4">
								<Markdown>{markdown}</Markdown>
							</div>
						</details>
					)}
				</div>
			</section>
			<Footer />
		</main>
	);
}
