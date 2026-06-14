"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string };

export function AdminNav({ items }: { items: NavItem[] }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	// Close the mobile menu on navigation and on Escape.
	useEffect(() => {
		setOpen(false);
	}, [pathname]);
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	const isActive = (href: string) =>
		href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

	const linkCls = (href: string, base: string) =>
		cn(
			base,
			"transition-colors",
			isActive(href)
				? "bg-lime text-ink font-medium"
				: "text-muted-foreground hover:text-foreground hover:bg-secondary",
		);

	return (
		<>
			{/* Desktop: inline pills */}
			<nav className="hidden lg:flex items-center gap-1">
				{items.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={linkCls(item.href, "rounded-full px-3 py-1.5 text-sm")}
					>
						{item.label}
					</Link>
				))}
			</nav>

			{/* Mobile: hamburger toggle + dropdown */}
			<div className="lg:hidden">
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					aria-label="Toggle navigation menu"
					aria-expanded={open}
					className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-secondary"
				>
					{open ? <X className="size-5" /> : <Menu className="size-5" />}
				</button>

				{open && (
					<nav className="absolute left-0 right-0 top-full z-50 border-b border-border bg-background shadow-lg">
						<div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 px-4 sm:px-6 lg:px-8 py-3">
							{items.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									onClick={() => setOpen(false)}
									className={linkCls(item.href, "rounded-lg px-3 py-2 text-sm")}
								>
									{item.label}
								</Link>
							))}
						</div>
					</nav>
				)}
			</div>
		</>
	);
}
