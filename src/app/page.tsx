
// import HeroSection from "@/components/hero-section";
import PortfolioHero from "@/components/portfolio-hero";
import { AffiliationSection } from "@/components/affiliations-section";
import { CertificationSection } from "@/components/certification-section";
import { ProjectsSection } from "@/components/projects-section";
import Recommendations from "@/components/recommendations-section";
import HonorsAndAwardsGrid from "@/components/honors-and-awards-grid";
import NavBar from "@/components/navbar";
import Footer from "@/components/Footer";
export default function Home() {
  return (
    <>
      <NavBar />
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
