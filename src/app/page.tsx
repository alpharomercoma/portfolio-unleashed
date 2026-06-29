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
import {
	awardSchema,
	certificationSchema,
	projectSchema,
	recommendationSchema,
	selectedWorkSchema,
} from "@/lib/collections/schema";
import { getTypedItems } from "@/lib/collections/store";
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
		getTypedItems("awards", awardSchema),
		getTypedItems("certifications", certificationSchema),
		getTypedItems("recommendations", recommendationSchema),
		getTypedItems("projects", projectSchema),
		getTypedItems("selected-work", selectedWorkSchema),
	]);
	const featured = talks.filter((t) => t.featured);
	const speakingTeaser = (featured.length > 0 ? featured : talks).slice(0, 6);

	return (
		<main className="min-h-screen bg-background">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<Navbar />
			<HeroSection />
			<SelectedWorkSection items={selectedWork} />
			<ProjectsSection projects={projects} />
			<SpeakingSection talks={speakingTeaser} total={talks.length} />
			<BlogSection />
			<RecognitionSection awards={awards} certifications={certifications} />
			<RecommendationsSection recommendations={recommendations} />
			<CtaSection />
			<Footer />
		</main>
	);
}
