"use client";

import { Github, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";

const footerLinks = {
	explore: [
		{ label: "About", href: "#about" },
		{ label: "Featured", href: "#featured" },
		{ label: "Projects", href: "#projects" },
		{ label: "Speaking", href: "#speaking" },
	],
	resources: [
		{ label: "Blog", href: "#blog" },
		{ label: "Certifications", href: "#certifications" },
		{ label: "Recommendations", href: "#recommendations" },
		{ label: "Awards", href: "#awards" },
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
			href: "http://youtube.com/@alpharomercoma",
			label: "YouTube",
		},
	],
};

export function Footer() {
	return (
		<footer className="px-4 sm:px-6 pb-8">
			<div className="max-w-6xl mx-auto">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-t border-gray-200">
					<div className="col-span-2">
						<Link
							href="/"
							className="text-xl font-semibold text-foreground inline-block mb-3"
						>
							<span className="text-[var(--color-blue)]">A</span>
							<span className="text-[var(--color-red)]">l</span>
							<span className="text-[var(--color-yellow)]">p</span>
							<span className="text-[var(--color-green)]">h</span>
							<span className="text-[var(--color-blue)]">a</span>
							<span className="text-foreground"> Romer Coma</span>
						</Link>
						<p className="text-sm text-muted-foreground mb-5 max-w-sm leading-relaxed">
							AI/ML Engineer building intelligent systems that scale.
							Researching multimodal AI with a $376,000 Google Cloud compute
							grant.
						</p>
						<div className="flex items-center gap-2">
							{footerLinks.social.map((social) => (
								<Link
									key={social.label}
									href={social.href}
									className="p-2.5 bg-gray-100 text-muted-foreground hover:bg-foreground hover:text-background transition-colors rounded-full"
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
							Resources
						</h4>
						<ul className="space-y-2.5">
							{footerLinks.resources.map((link) => (
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
				</div>

				<div className="border-t border-gray-200 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
					<p className="text-xs text-muted-foreground">
						© {new Date().getFullYear()} Alpha Romer Coma. All rights reserved.
					</p>
					<p className="text-xs text-muted-foreground">
						Built with Next.js & Vercel
					</p>
				</div>
			</div>
		</footer>
	);
}
