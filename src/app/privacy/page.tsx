import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const DESCRIPTION = "How alpharomer.com and the Alpha app handle your data.";

export const metadata: Metadata = {
	title: "Privacy Policy | Alpha Romer Coma",
	description: DESCRIPTION,
	alternates: { canonical: "/privacy" },
	openGraph: {
		type: "website",
		title: "Privacy Policy | Alpha Romer Coma",
		description: DESCRIPTION,
		url: "/privacy",
		siteName: "Alpha Romer Coma",
		locale: "en_US",
		images: [{ url: "/og.png", alt: "Alpha Romer Coma" }],
	},
};

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mt-10">
			<h2 className="display-md mb-3">{title}</h2>
			<div className="space-y-3 text-muted-foreground leading-relaxed">
				{children}
			</div>
		</section>
	);
}

export default function PrivacyPage() {
	return (
		<main className="min-h-screen bg-background">
			<Navbar />
			<section className="px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-24">
				<div className="max-w-3xl mx-auto">
					<header>
						<h1 className="display-xl">
							Privacy <span className="lime-mark">policy</span>.
						</h1>
						<p className="lede mt-6">{DESCRIPTION}</p>
						<p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
							Last updated: June 15, 2026
						</p>
					</header>

					<Section title="Overview">
						<p>
							This policy covers the website{" "}
							<strong className="text-foreground">alpharomer.com</strong> and
							the <strong className="text-foreground">Alpha</strong> Android
							app. The app is a Trusted Web Activity, a thin wrapper that loads
							this same website, so the practices below apply to both. The site
							is a personal portfolio; it does not sell your data or run
							third-party advertising.
						</p>
					</Section>

					<Section title="Information collected">
						<ul className="list-disc space-y-2 pl-5">
							<li>
								<strong className="text-foreground">Usage analytics.</strong> I
								use privacy-friendly, aggregate analytics (Vercel Analytics and
								Speed Insights) to understand traffic and performance. These do
								not build advertising profiles or sell personal data.
							</li>
							<li>
								<strong className="text-foreground">
									Information you choose to provide.
								</strong>{" "}
								If you email me or book a call, I receive the details you send
								(such as your name, email, and message) and use them only to
								respond.
							</li>
							<li>
								<strong className="text-foreground">
									No visitor accounts.
								</strong>{" "}
								Regular visitors do not sign in. Authentication exists only for
								the single site administrator (me).
							</li>
						</ul>
					</Section>

					<Section title="Cookies, storage, and the service worker">
						<p>
							The site registers a service worker that caches pages and assets
							so it loads quickly and shows an offline page when you have no
							connection. A session cookie is set only when the administrator
							signs in; it is not set for regular visitors.
						</p>
					</Section>

					<Section title="Service providers">
						<p>
							The site relies on a small set of processors to operate: Vercel
							(hosting and analytics), Sanity (content), Upstash (data storage),
							Vercel Blob (media files), and Resend (administrator email
							alerts). Each only receives what is needed to provide its
							function.
						</p>
					</Section>

					<Section title="The Alpha Android app">
						<p>
							The app displays this website inside a secure in-app browser
							(Trusted Web Activity). It does not request device permissions and
							collects no personal data beyond what the website itself does, as
							described above. Google Play may collect standard installation and
							diagnostic information as described in Google&apos;s own policies.
						</p>
					</Section>

					<Section title="Data retention and your rights">
						<p>
							Messages you send are kept only as long as needed to correspond
							with you. You may request access to, correction of, or deletion of
							any personal information you have shared by contacting me.
						</p>
					</Section>

					<Section title="Children's privacy">
						<p>
							This site and app are not directed to children under 13 and do not
							knowingly collect their personal information.
						</p>
					</Section>

					<Section title="Changes">
						<p>
							This policy may be updated from time to time. Material changes
							will be reflected by the &ldquo;last updated&rdquo; date above.
						</p>
					</Section>

					<Section title="Contact">
						<p>
							Questions about this policy? Email{" "}
							<a
								href="mailto:alpharomercoma@proton.me"
								className="text-foreground underline underline-offset-4 hover:opacity-80"
							>
								alpharomercoma@proton.me
							</a>
							.
						</p>
					</Section>
				</div>
			</section>
			<Footer />
		</main>
	);
}
