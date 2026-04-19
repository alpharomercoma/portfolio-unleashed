"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const navItems = [
	{ label: "About", href: "#about" },
	{ label: "Projects", href: "#projects" },
	{ label: "Speaking", href: "#speaking" },
	{ label: "Writing", href: "#blog" },
	{ label: "Awards", href: "#awards" },
];

export function Navbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isVisible, setIsVisible] = useState(true);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const lastScrollY = useRef(0);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
				setIsVisible(false);
				setIsMobileMenuOpen(false);
			} else {
				setIsVisible(true);
			}

			setIsScrolled(currentScrollY > 50);
			lastScrollY.current = currentScrollY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<nav
			className={cn(
				"fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
				isScrolled
					? "w-[92%] max-w-3xl lg:max-w-4xl bg-background/90 backdrop-blur-lg shadow-lg border border-border"
					: "w-[92%] max-w-3xl lg:max-w-5xl bg-background/70 backdrop-blur-md border border-border/50",
				isVisible
					? "translate-y-0 opacity-100"
					: "-translate-y-[150%] opacity-0",
			)}
			style={{ borderRadius: "9999px" }}
		>
			<div className="px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 flex items-center justify-between gap-4">
				<Link
					href="/"
					className="text-lg lg:text-xl font-semibold text-foreground hover:opacity-80 transition-opacity shrink-0"
					aria-label="Alpha Romer Coma, home"
				>
					<span className="text-[var(--color-blue)]">A</span>
					<span className="text-[var(--color-red)]">l</span>
					<span className="text-[var(--color-yellow)]">p</span>
					<span className="text-[var(--color-green)]">h</span>
					<span className="text-[var(--color-blue)]">a</span>
				</Link>

				<div className="hidden lg:flex items-center gap-1">
					{navItems.map((item) => (
						<Link
							key={item.label}
							href={item.href}
							className="px-3 xl:px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full"
						>
							{item.label}
						</Link>
					))}
				</div>

				<div className="hidden lg:flex items-center shrink-0">
					<Button
						asChild
						size="sm"
						className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-10 px-5"
					>
						<Link href="/blog">
							Blog
							<ArrowUpRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</div>

				<Button
					variant="ghost"
					size="icon"
					className="lg:hidden h-10 w-10 relative bg-transparent text-foreground hover:bg-gray-100"
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					aria-label="Toggle menu"
					aria-expanded={isMobileMenuOpen}
				>
					<Menu
						className={cn(
							"h-5 w-5 absolute transition-all duration-300",
							isMobileMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
						)}
					/>
					<X
						className={cn(
							"h-5 w-5 absolute transition-all duration-300",
							isMobileMenuOpen
								? "rotate-0 opacity-100"
								: "-rotate-90 opacity-0",
						)}
					/>
				</Button>
			</div>

			<div
				className={cn(
					"lg:hidden absolute top-full left-0 right-0 mt-3 bg-background/95 backdrop-blur-lg border border-border rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ease-out",
					isMobileMenuOpen
						? "opacity-100 translate-y-0 max-h-[500px] p-4"
						: "opacity-0 -translate-y-2 max-h-0 p-0 pointer-events-none",
				)}
			>
				<div className="flex flex-col gap-1.5">
					{navItems.map((item, index) => (
						<Link
							key={item.label}
							href={item.href}
							className={cn(
								"px-4 py-3 text-base text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-200",
								isMobileMenuOpen
									? "translate-x-0 opacity-100"
									: "-translate-x-4 opacity-0",
							)}
							style={{
								transitionDelay: isMobileMenuOpen ? `${index * 50}ms` : "0ms",
							}}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							{item.label}
						</Link>
					))}
					<Button
						asChild
						size="lg"
						className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-12 px-6 w-full mt-2"
					>
						<Link href="/blog" onClick={() => setIsMobileMenuOpen(false)}>
							Blog
							<ArrowUpRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</nav>
	);
}
