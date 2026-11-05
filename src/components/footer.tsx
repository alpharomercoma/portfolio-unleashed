import { Github, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

const EMAIL = "alpharomercoma@proton.me";

const links = [
	{ label: "Work", href: "/#work" },
	{ label: "Research", href: "/#research" },
	{ label: "Speaking", href: "/speaking" },
	{ label: "Writing", href: "/blog" },
	{ label: "About", href: "/about" },
	{ label: "Gallery", href: "/gallery" },
	{ label: "Resume", href: "/resume" },
	{ label: "Privacy", href: "/privacy" },
];

const social = [
	{ icon: Github, href: "https://github.com/alpharomercoma", label: "GitHub" },
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
];

export function Footer() {
	return (
		<footer className="border-t border-border">
			<div className="site-container grid gap-8 py-12 lg:grid-cols-[auto_1fr] lg:items-center">
				<Link
					href="/"
					className="inline-flex h-10 w-fit items-center gap-2.5 rounded-full font-display text-xl font-medium tracking-tight"
				>
					<Logo size={28} title={null} />
					Alpha Romer Coma
				</Link>

				<nav aria-label="Footer" className="lg:justify-self-end">
					<ul className="-mx-2 flex flex-wrap gap-x-1 gap-y-1 text-sm">
						{links.map((l) => (
							<li key={l.href}>
								<Link
									href={l.href}
									className="inline-flex h-10 items-center rounded-full px-2 font-medium hover:underline hover:underline-offset-4"
								>
									{l.label}
								</Link>
							</li>
						))}
					</ul>
				</nav>

				<a href={`mailto:${EMAIL}`} className="text-link w-fit text-sm">
					{EMAIL}
				</a>

				<div className="flex items-center gap-4 text-sm text-muted-foreground lg:justify-self-end">
					<ul className="flex items-center gap-1">
						{social.map((s) => (
							<li key={s.label}>
								<a
									href={s.href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={s.label}
									className="inline-flex size-10 items-center justify-center rounded-full text-foreground hover:bg-accent"
								>
									<s.icon className="size-[1.125rem]" aria-hidden />
								</a>
							</li>
						))}
					</ul>
					<span>© {new Date().getFullYear()}</span>
				</div>
			</div>
		</footer>
	);
}
