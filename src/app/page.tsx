import type { Metadata } from "next";

import { BlogSection } from "@/components/blog-section";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { Navbar } from "@/components/navbar";
import { ProjectsSection } from "@/components/projects-section";
import { RecognitionSection } from "@/components/recognition-section";
import { RecommendationsSection } from "@/components/recommendations-section";
import { SelectedWorkSection } from "@/components/selected-work-section";
import { SpeakingSection } from "@/components/speaking-section";
import type {
	Award,
	Certification,
	Project,
	Recommendation,
	SelectedWork,
} from "@/lib/collections/schema";
import { getAllItems } from "@/lib/collections/store";
import { getPublishedTalks } from "@/lib/talks/store";
import { SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/seo";

export const metadata: Metadata = {
	alternates: { canonical: "/" },
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Person",
			"@id": `${SITE_URL}/#person`,
			name: SITE_NAME,
			url: SITE_URL,
			jobTitle: "Machine Learning Engineer",
			sameAs: SOCIAL_LINKS,
			knowsAbout: [
				"Machine Learning",
				"Multimodality",
				"Accelerated Computing",
				"PyTorch",
				"Deep Learning",
			],
		},
		{
			"@type": "WebSite",
			"@id": `${SITE_URL}/#website`,
			url: SITE_URL,
			name: SITE_NAME,
			publisher: { "@id": `${SITE_URL}/#person` },
		},
	],
};

export default async function Home() {
	const [
		talks,
		awards,
		certifications,
		recommendations,
		projects,
		selectedWork,
	] = await Promise.all([
		getPublishedTalks(),
		getAllItems("awards"),
		getAllItems("certifications"),
		getAllItems("recommendations"),
		getAllItems("projects"),
		getAllItems("selected-work"),
	]);
	const featured = talks.filter((t) => t.featured);
	const speakingTeaser = (featured.length > 0 ? featured : talks).slice(0, 6);

	return (
		<main className="min-h-screen bg-background">
			<script
				type="application/ld+json"
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<Navbar />
			<HeroSection />
			<SelectedWorkSection items={selectedWork as unknown as SelectedWork[]} />
			<ProjectsSection projects={projects as unknown as Project[]} />
			<SpeakingSection talks={speakingTeaser} total={talks.length} />
			<BlogSection />
			<RecognitionSection
				awards={awards as unknown as Award[]}
				certifications={certifications as unknown as Certification[]}
			/>
			<RecommendationsSection
				recommendations={recommendations as unknown as Recommendation[]}
			/>
			<CtaSection />
			<Footer />
		</main>
	);
}
