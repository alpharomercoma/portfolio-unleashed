import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import type { AdminNavItem } from "@/components/admin/admin-sidebar";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

// Ordered to match the public site (see ADMIN_SECTIONS).
const navItems: AdminNavItem[] = [
	{ label: "Overview", href: "/admin" },
	...ADMIN_SECTIONS.map((s) => ({ label: s.label, href: s.href })),
];

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// The login page renders without the admin chrome; everything else is gated
	// by middleware and shows the dashboard shell.
	if (!(await getSession())) return <>{children}</>;

	return <AdminShell navItems={navItems}>{children}</AdminShell>;
}
