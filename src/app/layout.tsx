import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist",
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
			<body className={`${geist.variable} antialiased`}>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
