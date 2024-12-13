import Affiliations from "@/components/affiliations";
import Certifications from "@/components/certifications";
import Chatbot from "@/components/chat/Chatbot";
import Footer from "@/components/footer";
import Hero from "@/components/hero";
import HonorsAndAwards from "@/components/awards";
import NavBar from "@/components/navbar";
import Projects from "@/components/projects";
import Recommendations from "@/components/recommendations";
export default function Home() {
	return (
		<>
			<NavBar />
			<Chatbot />
			<Hero />
			<Projects />
			<Certifications />
			<Affiliations />
			<Recommendations />
			<HonorsAndAwards />
			<Footer />
		</>
	);
}
