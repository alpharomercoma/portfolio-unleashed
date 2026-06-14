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
import { getAllTalks } from "@/lib/talks/store";

export default async function Home() {
	const [
		talks,
		awards,
		certifications,
		recommendations,
		projects,
		selectedWork,
	] = await Promise.all([
		getAllTalks(),
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
