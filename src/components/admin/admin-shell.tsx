"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
	type AdminNavItem,
	AdminSidebar,
} from "@/components/admin/admin-sidebar";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "admin-sidebar-collapsed";

export function AdminShell({
	navItems,
	children,
}: {
	navItems: AdminNavItem[];
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [drawerOpen, setDrawerOpen] = useState(false);
	// Start expanded to match SSR; hydrate the persisted choice after mount.
	const [collapsed, setCollapsed] = useState(false);

	const hamburgerRef = useRef<HTMLButtonElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const openedOnce = useRef(false);

	useEffect(() => {
		setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
	}, []);

	const toggleCollapse = () =>
		setCollapsed((v) => {
			const next = !v;
			localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
			return next;
		});

	// Close the drawer on navigation.
	useEffect(() => {
		setDrawerOpen(false);
	}, [pathname]);

	// Escape closes the drawer.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setDrawerOpen(false);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	// Lock body scroll while the drawer is open.
	useEffect(() => {
		if (!drawerOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [drawerOpen]);

	// Focus the close button on open; return focus to the hamburger on close.
	useEffect(() => {
		if (drawerOpen) {
			openedOnce.current = true;
			closeRef.current?.focus();
		} else if (openedOnce.current) {
			hamburgerRef.current?.focus();
		}
	}, [drawerOpen]);

	return (
		<div className="min-h-screen bg-background lg:flex">
			{/* Desktop: persistent, collapsible sidebar */}
			<AdminSidebar
				navItems={navItems}
				pathname={pathname}
				collapsed={collapsed}
				onToggleCollapse={toggleCollapse}
				className={cn(
					"hidden shrink-0 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col",
					"bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
					"transition-[width] duration-200 motion-reduce:transition-none",
					collapsed ? "lg:w-16" : "lg:w-64",
				)}
			/>

			{/* Mobile/tablet: top bar with hamburger */}
			<header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
				<button
					ref={hamburgerRef}
					type="button"
					aria-label="Open navigation"
					aria-expanded={drawerOpen}
					aria-controls="admin-drawer"
					onClick={() => setDrawerOpen(true)}
					className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-secondary"
				>
					<Menu className="size-5" />
				</button>
				<Link
					href="/admin"
					className="flex items-center gap-2 font-display text-sm font-bold tracking-tight"
				>
					<Logo size={18} title={null} />
					<span>
						Alpha<span className="text-lime-strong">/admin</span>
					</span>
				</Link>
			</header>

			{/* Mobile/tablet: off-canvas drawer */}
			{drawerOpen && (
				<div
					className="fixed inset-0 z-40 lg:hidden"
					role="dialog"
					aria-modal="true"
					aria-label="Admin navigation"
				>
					<button
						type="button"
						aria-label="Close navigation"
						onClick={() => setDrawerOpen(false)}
						className="absolute inset-0 bg-ink/60 motion-safe:animate-in motion-safe:fade-in"
					/>
					<AdminSidebar
						id="admin-drawer"
						navItems={navItems}
						pathname={pathname}
						onNavigate={() => setDrawerOpen(false)}
						showClose
						onClose={() => setDrawerOpen(false)}
						closeButtonRef={closeRef}
						className={cn(
							"absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col shadow-xl",
							"bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
							"motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200",
						)}
					/>
				</div>
			)}

			<main className="min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-5xl">{children}</div>
			</main>
		</div>
	);
}
