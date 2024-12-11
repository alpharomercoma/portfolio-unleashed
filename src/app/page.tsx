
import { Affiliations } from "@/components/affiliations";
import { Certifications } from "@/components/certifications";
import Chatbot from "@/components/chat/Chatbot";
import Footer from "@/components/footer";
import HonorsAndAwards from "@/components/honors-and-awards";
import NavBar from "@/components/navbar";
import PortfolioHero from "@/components/portfolio-hero";
import { Projects } from "@/components/projects";
import Recommendations from "@/components/recommendations";
export default function Home() {
  return (
    <>
      <NavBar />
      <Chatbot />
      <PortfolioHero />
      <Projects />
      <Certifications />
      <Affiliations />
      <Recommendations />
      <HonorsAndAwards />
      <Footer />
    </>
  );
}
