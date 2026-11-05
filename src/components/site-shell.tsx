import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

// The frame of every public page: one skip link, one header, one main, one
// footer, so landmarks and the keyboard path are the same everywhere.
export function SiteShell({ children }: { children: React.ReactNode }) {
	return (
		<>
			<a href="#main" className="skip-link">
				Skip to content
			</a>
			<Navbar />
			<main id="main" tabIndex={-1} className="outline-none">
				{children}
			</main>
			<Footer />
		</>
	);
}
