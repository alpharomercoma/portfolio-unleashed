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

export default function Home() {
	return (
		<main className="min-h-screen bg-background">
			<Navbar />
			<HeroSection />
			<SelectedWorkSection />
			<ProjectsSection />
			<SpeakingSection />
			<BlogSection />
			<RecognitionSection />
			<RecommendationsSection />
			<CtaSection />
			<Footer />
		</main>
	);
}
