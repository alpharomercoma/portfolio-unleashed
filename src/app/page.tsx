
// import HeroSection from "@/components/hero-section";
import { AffiliationSection } from "@/components/affiliations-section";
import { CertificationSection } from "@/components/certification-section";
import Chatbot from "@/components/Chatbot";
import Footer from "@/components/Footer";
import HonorsAndAwardsGrid from "@/components/honors-and-awards-grid";
import NavBar from "@/components/navbar";
import PortfolioHero from "@/components/portfolio-hero";
import { ProjectsSection } from "@/components/projects-section";
import Recommendations from "@/components/recommendations-section";
export default function Home() {
  return (
    <>
      <NavBar />
      <Chatbot />
      <PortfolioHero />
      <ProjectsSection />
      <CertificationSection />
      <AffiliationSection />
      <Recommendations />
      <HonorsAndAwardsGrid />
      <Footer />
    </>
  );
}
