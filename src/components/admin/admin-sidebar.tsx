"use client";

import {
	BadgeCheck,
	Circle,
	FolderKanban,
	Images,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Mic,
	PanelLeftClose,
	PanelLeftOpen,
	Quote,
	Star,
	Trophy,
	User,
	X,
} from "lucide-react";
import Link from "next/link";

import { logout } from "@/app/admin/auth-actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminNavItem = { label: string; href: string };

// Icons are mapped by href here so admin-sections.ts stays free of the UI lib.
const ICONS: Record<string, LucideIcon> = {
	"/admin": LayoutDashboard,
	"/admin/selected-work": Star,
	"/admin/projects": FolderKanban,
	"/admin/talks": Mic,
	"/admin/awards": Trophy,
	"/admin/certifications": BadgeCheck,
	"/admin/recommendations": Quote,
	"/admin/about": User,
	"/admin/gallery": Images,
};
const iconFor = (href: string) => ICONS[href] ?? Circle;

export function AdminSidebar({
	id,
	className,
	navItems,
	pathname,
	collapsed = false,
	onToggleCollapse,
	onNavigate,
	showClose = false,
	onClose,
	closeButtonRef,
}: {
	id?: string;
	className?: string;
	navItems: AdminNavItem[];
	pathname: string;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
	onNavigate?: () => void;
	showClose?: boolean;
	onClose?: () => void;
	closeButtonRef?: React.Ref<HTMLButtonElement>;
}) {
	const isActive = (href: string) =>
		href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

	return (
		<aside id={id} className={className} aria-label="Admin sidebar">
			{/* Brand + collapse / close control */}
			<div
				className={cn(
					"border-b border-sidebar-border",
					collapsed
						? "flex flex-col items-center gap-2 px-2 py-4"
						: "flex items-center justify-between gap-2 px-4 py-4",
				)}
			>
				<Link
					href="/admin"
					onClick={onNavigate}
					aria-label="Admin home"
					className="flex items-center gap-2 font-display text-sm font-bold tracking-tight"
				>
					<Logo size={20} title={null} />
					{!collapsed && (
						<span>
							Alpha<span className="text-lime-strong">/admin</span>
						</span>
					)}
				</Link>

				{onToggleCollapse && (
					<button
						type="button"
						onClick={onToggleCollapse}
						aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
						aria-expanded={!collapsed}
						className="inline-flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60"
					>
						{collapsed ? (
							<PanelLeftOpen className="size-4" />
						) : (
							<PanelLeftClose className="size-4" />
						)}
					</button>
				)}

				{showClose && (
					<button
						type="button"
						ref={closeButtonRef}
						onClick={onClose}
						aria-label="Close navigation"
						className="inline-flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60"
					>
						<X className="size-5" />
					</button>
				)}
			</div>

			{/* Sections */}
			<nav
				aria-label="Admin sections"
				className="flex-1 overflow-y-auto px-2 py-3 space-y-1"
			>
				{navItems.map((item) => {
					const Icon = iconFor(item.href);
					const active = isActive(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onNavigate}
							aria-current={active ? "page" : undefined}
							title={collapsed ? item.label : undefined}
							className={cn(
								"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
								active
									? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
									: "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
								collapsed && "justify-center px-0",
							)}
						>
							<Icon className="size-4 shrink-0" />
							{!collapsed && <span className="truncate">{item.label}</span>}
						</Link>
					);
				})}
			</nav>

			{/* Log out pinned to the bottom */}
			<div className="mt-auto border-t border-sidebar-border p-3">
				<form action={logout}>
					<Button
						variant="outline"
						size="sm"
						type="submit"
						aria-label="Log out"
						className={cn("w-full", collapsed && "px-0")}
					>
						<LogOut className="size-4" />
						{!collapsed && "Log out"}
					</Button>
				</form>
			</div>
		</aside>
	);
}
