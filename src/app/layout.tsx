import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import {
	Geist_Mono,
	Hanken_Grotesk,
	Schibsted_Grotesk,
} from "next/font/google";
import "./globals.css";

// Display: a geometric grotesque with editorial character for headlines.
const schibsted = Schibsted_Grotesk({
	subsets: ["latin"],
	variable: "--font-schibsted",
	display: "swap",
});

// Body / UI: a clean humanist grotesque tuned for reading.
const hanken = Hanken_Grotesk({
	subsets: ["latin"],
	variable: "--font-hanken",
	display: "swap",
});

// Mono: used for the stats / code "engineering" motif.
const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Alpha Romer Coma | Portfolio",
	applicationName: "Alpha",
	description: "",
	authors: { name: "Alpha Romer Coma", url: "https://alpharomer.vercel.app" },
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
		images: "/cover.png",
	},
	openGraph: {
		description:
			"Building the change of tomorrow | I am Alpha, striving to transcend AI to sentience. Welcome to my portfolio.",
		title: "Alpha Romer Coma | Portfolio",
		type: "website",
		locale: "en_US",
		url: "https://alpharomer.vercel.app",
		siteName: "Alpha",
		emails: "alpharomercoma@proton.me",
		images: "/cover.png",
	},
	referrer: "no-referrer",
	appleWebApp: {
		title: "Alpha",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${schibsted.variable} ${hanken.variable} ${geistMono.variable} font-sans antialiased`}
			>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
