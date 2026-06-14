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
import { getAllTalks } from "@/lib/talks/store";

export default async function Home() {
	const talks = await getAllTalks();
	const featured = talks.filter((t) => t.featured);
	const speakingTeaser = (featured.length > 0 ? featured : talks).slice(0, 6);

	return (
		<main className="min-h-screen bg-background">
			<Navbar />
			<HeroSection />
			<SelectedWorkSection />
			<ProjectsSection />
			<SpeakingSection talks={speakingTeaser} total={talks.length} />
			<BlogSection />
			<RecognitionSection />
			<RecommendationsSection />
			<CtaSection />
			<Footer />
		</main>
	);
}
