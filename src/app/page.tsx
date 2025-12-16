import { AwardsSection } from "@/components/awards-section";
import { BlogSection } from "@/components/blog-section";
import { CertificationsSection } from "@/components/certifications-section";
// import { ContactSection } from "@/components/contact-section";
import { FeaturedSection } from "@/components/featured-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { Navbar } from "@/components/navbar";
import { ProjectsSection } from "@/components/projects-section";
import { RecommendationsSection } from "@/components/recommendations-section";
import { SpeakingSection } from "@/components/speaking-section";

export default function Home() {
	return (
		<main className="min-h-screen bg-background">
			<Navbar />
			<HeroSection />
			<FeaturedSection />
			<ProjectsSection />
			<SpeakingSection />
			<BlogSection />
			<CertificationsSection />
			<RecommendationsSection />
			<AwardsSection />
			{/* <ContactSection /> */}
			<Footer />
		</main>
	);
}
