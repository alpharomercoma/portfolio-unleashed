import type { Metadata } from "next";
import Link from "next/link";

import { logout } from "@/app/admin/actions";
import { AdminNav, type NavItem } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { COLLECTIONS } from "@/lib/collections/registry";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const navItems: NavItem[] = [
	{ label: "Overview", href: "/admin" },
	{ label: "Talks", href: "/admin/talks" },
	...Object.values(COLLECTIONS).map((c) => ({
		label: c.labelPlural,
		href: `/admin/${c.key}`,
	})),
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
							className="font-display text-sm font-bold tracking-tight shrink-0"
						>
							Alpha<span className="text-lime-strong">/admin</span>
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
