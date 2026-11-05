"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";

import {
	type AdminNavItem,
	AdminSidebar,
} from "@/components/admin/admin-sidebar";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "admin-sidebar-collapsed";
// Same-tab toggles dispatch this event; other tabs arrive via `storage`.
const COLLAPSE_EVENT = "admin-sidebar-collapsed-change";

function subscribeCollapsed(onChange: () => void) {
	window.addEventListener("storage", onChange);
	window.addEventListener(COLLAPSE_EVENT, onChange);
	return () => {
		window.removeEventListener("storage", onChange);
		window.removeEventListener(COLLAPSE_EVENT, onChange);
	};
}

export function AdminShell({
	navItems,
	children,
}: {
	navItems: AdminNavItem[];
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [drawerOpen, setDrawerOpen] = useState(false);
	// Persisted sidebar state, read SSR-safely: `false` on the server (matching
	// the first client render), the stored value thereafter. Using an external
	// store avoids a hydration mismatch and a setState-in-effect.
	const collapsed = useSyncExternalStore(
		subscribeCollapsed,
		() => localStorage.getItem(COLLAPSE_KEY) === "1",
		() => false,
	);

	const hamburgerRef = useRef<HTMLButtonElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const openedOnce = useRef(false);

	const toggleCollapse = useCallback(() => {
		const next = localStorage.getItem(COLLAPSE_KEY) !== "1";
		localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
		window.dispatchEvent(new Event(COLLAPSE_EVENT));
	}, []);

	// The drawer closes from each nav link's `onNavigate`, so no route-change
	// effect is needed.

	// Escape closes the drawer.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setDrawerOpen(false);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	// Past the breakpoint the drawer is hidden by CSS, but a hidden modal dialog
	// still blocks the page, so close it for real.
	useEffect(() => {
		const desktop = window.matchMedia("(min-width: 64rem)");
		const onChange = () => {
			if (desktop.matches) setDrawerOpen(false);
		};
		desktop.addEventListener("change", onChange);
		return () => desktop.removeEventListener("change", onChange);
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
						Alpha<span className="text-brand-strong">/admin</span>
					</span>
				</Link>
			</header>

			{/* Mobile/tablet: off-canvas drawer */}
			{drawerOpen && (
				// A native modal dialog, so focus can't leave it and the page behind is
				// inert. The ref opens it as soon as it mounts.
				<dialog
					ref={(d) => {
						if (d && !d.open) d.showModal();
					}}
					aria-label="Admin navigation"
					onClose={() => setDrawerOpen(false)}
					className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-foreground [--focus:var(--brand-strong)] lg:hidden"
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
				</dialog>
			)}

			<main className="min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-5xl">{children}</div>
			</main>
		</div>
	);
}
