import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

import { SITE_URL } from "@/lib/seo";

// The labs' type system: Inter Tight for display, Inter for reading.
const interTight = Inter_Tight({
	subsets: ["latin"],
	variable: "--font-inter-tight",
	display: "swap",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: "Alpha Romer Coma | Machine Learning Engineer",
	applicationName: "Alpha",
	description:
		"Machine learning engineer working with on-device LLMs and AI accelerators.",
	authors: { name: "Alpha Romer Coma", url: SITE_URL },
	category: "Technology",
	classification: "Technology",
	keywords: [
		"Alpha Romer Coma",
		"Portfolio",
		"Technology",
		"Software Engineering",
		"Artificial Intelligence",
		"Machine Learning",
		"Cloud Computing",
		"GitHub",
		"GitHub Campus Expert",
	],
	robots: {
		follow: true,
		index: true,
		googleBot: {
			index: true,
			follow: true,
		},
	},
	publisher: "Alpha Romer Coma",
	twitter: {
		card: "summary_large_image",
		site: "@alpharomercoma",
		creator: "@alpharomercoma",
		title: "Alpha Romer Coma | Machine Learning Engineer",
		description:
			"Machine learning engineer working with on-device LLMs and AI accelerators.",
		images: "/og.png",
	},
	openGraph: {
		description:
			"Machine learning engineer working with on-device LLMs and AI accelerators.",
		title: "Alpha Romer Coma | Machine Learning Engineer",
		type: "website",
		locale: "en_US",
		url: SITE_URL,
		siteName: "Alpha",
		emails: "alpharomercoma@proton.me",
		images: [
			{
				url: "/og.png",
				width: 1200,
				height: 630,
				alt: "Alpha Romer Coma, machine learning engineer",
			},
		],
	},
	referrer: "no-referrer",
	appleWebApp: {
		title: "Alpha",
	},
};

export const viewport: Viewport = {
	themeColor: "#5342e5",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${interTight.variable} ${inter.variable} font-sans antialiased`}
			>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
