"use client";

import { Github, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

const footerLinks = {
	// Mirrors the navbar (plus the two in-page sections worth deep-linking) so
	// the site has one navigation taxonomy, not two.
	explore: [
		{ label: "Work", href: "/#work" },
		{ label: "Projects", href: "/#projects" },
		{ label: "Speaking", href: "/speaking" },
		{ label: "Writing", href: "/blog" },
		{ label: "About", href: "/about" },
		{ label: "Gallery", href: "/gallery" },
		{ label: "Resume", href: "/resume" },
	],
	connect: [
		{ label: "Book a call", href: "/#contact" },
		{
			label: "alpharomercoma@proton.me",
			href: "mailto:alpharomercoma@proton.me",
		},
		{ label: "Recognition", href: "/#recognition" },
	],
	social: [
		{
			icon: Github,
			href: "https://github.com/alpharomercoma",
			label: "GitHub",
		},
		{
			icon: Linkedin,
			href: "https://linkedin.com/in/alpharomercoma",
			label: "LinkedIn",
		},
		{
			icon: Youtube,
			href: "https://youtube.com/@alpharomercoma",
			label: "YouTube",
		},
	],
};

export function Footer() {
	return (
		<footer className="px-4 sm:px-6 pb-8">
			<div className="max-w-6xl mx-auto">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-t border-border">
					<div className="col-span-2">
						<Link
							href="/"
							className="flex items-center gap-2 font-display text-xl font-semibold text-foreground mb-3 tracking-tight w-fit"
						>
							<Logo size={22} title={null} />
							Alpha Romer Coma
						</Link>
						<p className="text-sm text-muted-foreground mb-5 max-w-sm leading-relaxed">
							Machine learning engineer working on multimodality and accelerated
							computing, and teaching it from conference stages to classrooms.
						</p>
						<div className="flex items-center gap-2">
							{footerLinks.social.map((social) => (
								<Link
									key={social.label}
									href={social.href}
									className="p-2.5 bg-secondary border border-border text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors rounded-full"
									target="_blank"
									rel="noopener noreferrer"
									aria-label={social.label}
								>
									<social.icon className="h-4 w-4" />
								</Link>
							))}
						</div>
					</div>

					<div>
						<h4 className="font-semibold text-foreground mb-4 text-sm">
							Explore
						</h4>
						<ul className="space-y-2.5">
							{footerLinks.explore.map((link) => (
								<li key={link.label}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="font-semibold text-foreground mb-4 text-sm">
							Connect
						</h4>
						<ul className="space-y-2.5">
							{footerLinks.connect.map((link) => (
								<li key={link.label}>
									<Link
										href={link.href}
										className="text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="border-t border-border py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
					<p className="text-xs text-muted-foreground">
						© {new Date().getFullYear()} Alpha Romer Coma. All rights reserved.
					</p>
					<div className="flex items-center gap-4">
						<Link
							href="/privacy"
							className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Privacy
						</Link>
						<p className="text-xs text-muted-foreground">
							Built with Next.js & Vercel
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
