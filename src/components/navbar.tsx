"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import Logo from "./logo/logo";
import { socials } from "./Socials";
interface NavLink {
	name: string;
	href: string;
	icon: React.ReactNode;
}
import { FaBars } from "react-icons/fa";
interface NavBarProps {
	navLinks: NavLink[];
}

function NavBar({ navLinks }: NavBarProps) {
	return (
		<header className="fixed flex justify-center top-0 left-0 z-50 w-full shadow-dark backdrop-blur border-b-2">
			<div className="container flex h-16 items-center justify-between px-4 lg:px-6">
				<Link className="flex items-center gap-2" href="#">
					<Logo props={{ width: 32, height: 32 }} />
					<span className="text-lg font-bold">Alpha Romer Coma</span>
				</Link>
				<div className="flex items-center gap-4 md:gap-2">
					<div className="flex items-center gap-2 md:gap-4">
						<Sheet>
							<SheetTrigger asChild>
								<Button className="lg:hidden" size="icon" variant="outline">
									<FaBars className="h-6 w-6" />
									<span className="sr-only">Toggle navigation menu</span>
								</Button>
							</SheetTrigger>
							<SheetContent side="right">
								<div className="flex flex-col justify-between h-full">
									<div className="grid gap-4 p-4">
										{navLinks.map((link) => (
											<Link
												key={link.href}
												href={link.href}
												className="text-sm font-medium hover:underline flex gap-4 items-center"
											>
												{link.icon}
												{link.name}
											</Link>
										))}
									</div>
									<div className="flex gap-4 p-4 flex-col">
										{socials.map((social) => (
											<a
												key={social.name}
												href={social.link}
												target="_blank"
												rel="noopener noreferrer"
												className="text-gray-500 hover:text-gray-700 flex gap-4"
											>
												{social.icon}
												{social.name}
											</a>
										))}
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>
					<nav className="hidden items-center gap-6 lg:flex">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-sm font-medium hover:underline"
							>
								{link.name}
							</Link>
						))}
					</nav>
				</div>
			</div>
		</header>
	);
}

export default NavBar;
