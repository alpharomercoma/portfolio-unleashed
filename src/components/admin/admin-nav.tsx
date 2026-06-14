"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string };

export function AdminNav({ items }: { items: NavItem[] }) {
	const pathname = usePathname();
	return (
		<nav className="flex flex-wrap items-center gap-1">
			{items.map((item) => {
				const active =
					item.href === "/admin"
						? pathname === "/admin"
						: pathname.startsWith(item.href);
				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"rounded-full px-3 py-1.5 text-sm transition-colors",
							active
								? "bg-lime text-ink font-medium"
								: "text-muted-foreground hover:text-foreground hover:bg-secondary",
						)}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
