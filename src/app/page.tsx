import type { Metadata } from "next";

import { BlogSection } from "@/components/blog-section";
import { CertificationsSection } from "@/components/certifications-section";
import { CtaSection } from "@/components/cta-section";
import { ExperienceSection } from "@/components/experience-section";
import { HeroSection } from "@/components/hero-section";
import { DataSection, ProjectsSection } from "@/components/projects-section";
import { RecommendationsSection } from "@/components/recommendations-section";
import { ResearchSection } from "@/components/research-section";
import { SiteShell } from "@/components/site-shell";
import { SpeakingSection } from "@/components/speaking-section";
import {
	certificationSchema,
	projectSchema,
	recommendationSchema,
	researchStudySchema,
} from "@/lib/collections/schema";
import { getTypedItems } from "@/lib/collections/store";
import { getResumeProfile } from "@/lib/resume";
import { sortTalksByRecency } from "@/lib/talks/schema";
import { getPublishedTalks } from "@/lib/talks/store";
import { SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/seo";

// Re-rendered daily, so a talk counts as delivered once its date passes.
export const revalidate = 86400;

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
	const [talks, recommendations, projects, research, certifications, profile] =
		await Promise.all([
			getPublishedTalks(),
			getTypedItems("recommendations", recommendationSchema),
			getTypedItems("projects", projectSchema),
			getTypedItems("research", researchStudySchema),
			getTypedItems("certifications", certificationSchema),
			getResumeProfile(),
		]);
	const featured = talks.filter((t) => t.featured);
	// The full catalogue lives on /speaking.
	const speakingTeaser = sortTalksByRecency(
		featured.length > 0 ? featured : talks,
	).slice(0, 3);

	return (
		<SiteShell>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<HeroSection />
			{/* On wrappers, so the nav's links still land if a collection is empty. */}
			<div id="work">
				<ProjectsSection projects={projects} />
			</div>
			<div id="research">
				<ResearchSection studies={research} />
			</div>
			<SpeakingSection talks={speakingTeaser} all={talks} />
			<ExperienceSection roles={profile.roles} />
			<CertificationsSection certifications={certifications} />
			<RecommendationsSection recommendations={recommendations} />
			<DataSection projects={projects} />
			<BlogSection />
			<CtaSection />
		</SiteShell>
	);
}
