"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LOGO_BRAND, LOGO_WHITE, Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
	{ label: "Work", href: "/#work" },
	{ label: "Research", href: "/#research" },
	{ label: "Speaking", href: "/speaking" },
	{ label: "Writing", href: "/blog" },
	{ label: "About", href: "/about" },
	{ label: "Gallery", href: "/gallery" },
	{ label: "Resume", href: "/resume" },
];

function NavLinks({ pathname }: { pathname: string }) {
	return (
		<ul className="flex items-center gap-1">
			{navItems.map((item) => {
				const current =
					!item.href.includes("#") && pathname.startsWith(item.href);
				return (
					<li key={item.href} className="shrink-0">
						<Link
							href={item.href}
							aria-current={current ? "page" : undefined}
							className={cn(
								"inline-flex h-10 items-center rounded-full px-3 text-[0.9375rem] font-medium text-white underline-offset-[0.4em] decoration-1 hover:underline",
								current && "underline decoration-2",
							)}
						>
							{item.label}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}

// The same bar on every page, as on the labs' sites: the brand field, the links,
// and one white pill. It sticks only where there is height to spare; on a phone
// its two rows would take an eighth of the screen.
export function Navbar() {
	const pathname = usePathname();

	return (
		<header className="surface-brand z-50 lg:sticky lg:top-0">
			<div className="site-container flex h-16 items-center gap-6">
				<Link
					href="/"
					aria-label="Alpha Romer Coma, home"
					className="inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full font-display text-lg font-semibold tracking-tight"
				>
					<Logo size={28} tile={LOGO_WHITE} mark={LOGO_BRAND} title={null} />
					Alpha
				</Link>

				<nav aria-label="Primary" className="hidden lg:block">
					<NavLinks pathname={pathname} />
				</nav>

				<Button asChild size="default" variant="on-color" className="ml-auto">
					<Link href="/#contact">Get in touch</Link>
				</Button>
			</div>

			{/* Only one of the two navs is ever displayed. */}
			<nav
				aria-label="Main"
				className="nav-scroll overflow-x-auto border-t border-white/25 lg:hidden"
			>
				<div className="site-container py-1">
					<div className="-mx-3 w-max">
						<NavLinks pathname={pathname} />
					</div>
				</div>
			</nav>
		</header>
	);
}
