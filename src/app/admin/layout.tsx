import type { Metadata } from "next";
import Link from "next/link";

import { logout } from "@/app/admin/actions";
import { AdminNav, type NavItem } from "@/components/admin/admin-nav";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

// Ordered to match the public site (see ADMIN_SECTIONS).
const navItems: NavItem[] = [
	{ label: "Overview", href: "/admin" },
	...ADMIN_SECTIONS.map((s) => ({ label: s.label, href: s.href })),
];

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// The login page renders without the admin chrome; everything else is gated
	// by middleware and shows the nav.
	if (!(await getSession())) return <>{children}</>;

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
				<div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3">
					<div className="flex items-center gap-4 min-w-0">
						<Link
							href="/admin"
							className="flex items-center gap-2 font-display text-sm font-bold tracking-tight shrink-0"
						>
							<Logo size={18} title={null} />
							<span>
								Alpha<span className="text-lime-strong">/admin</span>
							</span>
						</Link>
						<AdminNav items={navItems} />
					</div>
					<form action={logout} className="shrink-0">
						<Button variant="outline" size="sm" type="submit">
							Log out
						</Button>
					</form>
				</div>
			</header>
			<main className="px-4 sm:px-6 lg:px-8 py-10">
				<div className="max-w-5xl mx-auto">{children}</div>
			</main>
		</div>
	);
}
