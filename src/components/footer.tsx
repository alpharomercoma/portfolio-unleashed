"use client";

import { Github, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";

const footerLinks = {
	navigation: [
		{ label: "About", href: "#about" },
		{ label: "Projects", href: "#projects" },
		{ label: "Awards", href: "#awards" },
		{ label: "Speaking", href: "#speaking" },
	],
	resources: [
		{ label: "Certifications", href: "#certifications" },
		{ label: "Blog", href: "#blog" },
		// { label: "Contact", href: "#contact" },
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
		<footer className="px-4 sm:px-6 py-8">
			<div className="max-w-5xl mx-auto">
				<div className="bg-secondary/50 border border-border rounded-2xl p-6 sm:p-8">
					<div className="grid sm:grid-cols-4 gap-6 mb-6">
						<div className="sm:col-span-2">
							<Link
								href="/"
								className="text-lg font-semibold text-foreground mb-2 inline-block"
							>
								<span className="text-[var(--color-blue)]">A</span>
								<span className="text-[var(--color-red)]">l</span>
								<span className="text-[var(--color-yellow)]">p</span>
								<span className="text-[var(--color-green)]">h</span>
								<span className="text-[var(--color-blue)]">a</span>
								<span className="text-foreground"> Romer</span>
							</Link>
							<p className="text-xs text-muted-foreground mb-4 max-w-xs">
								AI/ML Engineer building intelligent systems that solve
								real-world problems.
							</p>
							<div className="flex items-center gap-2">
								{footerLinks.social.map((social) => (
									<Link
										key={social.label}
										href={social.href}
										className="p-2 bg-background text-muted-foreground hover:text-[var(--color-blue)] transition-colors rounded-full border border-border"
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
							<h4 className="font-medium text-foreground mb-3 text-sm">
								Navigation
							</h4>
							<ul className="space-y-2">
								{footerLinks.navigation.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="text-xs text-muted-foreground hover:text-[var(--color-blue)] transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h4 className="font-medium text-foreground mb-3 text-sm">
								Resources
							</h4>
							<ul className="space-y-2">
								{footerLinks.resources.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="text-xs text-muted-foreground hover:text-[var(--color-blue)] transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>

					<div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
						<p className="text-xs text-muted-foreground">
							© {new Date().getFullYear()} Alpha Romer Coma
						</p>
						<p className="text-xs text-muted-foreground">
							Built with Next.js & Vercel
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
