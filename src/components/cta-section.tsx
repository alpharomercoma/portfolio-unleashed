"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { CalendarModal } from "./calendar-modal";

const EMAIL = "alpharomercoma@proton.me";

const routes = [
	{ label: "Email", value: EMAIL, href: `mailto:${EMAIL}` },
	{ label: "Resume", value: "alpharomer.com/resume", href: "/resume" },
	{
		label: "GitHub",
		value: "alpharomercoma",
		href: "https://github.com/alpharomercoma",
	},
	{
		label: "LinkedIn",
		value: "alpharomercoma",
		href: "https://linkedin.com/in/alpharomercoma",
	},
];

export function CtaSection() {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	return (
		<section
			id="contact"
			aria-labelledby="contact-title"
			className="surface-brand py-12 lg:py-16"
		>
			<div className="site-container grid gap-8 lg:grid-cols-2 lg:gap-16">
				<div>
					<h2 id="contact-title" className="display-lg">
						Get in touch.
					</h2>
					<p className="mt-2 text-on-brand">
						For roles, research, and speaking.
					</p>
					<Button
						type="button"
						variant="on-color"
						className="mt-6"
						onClick={() => setIsCalendarOpen(true)}
					>
						Book a call
					</Button>
				</div>
				<ul className="border-b border-white/30">
					{routes.map((r) => (
						<li
							key={r.label}
							className="flex flex-wrap items-center justify-between gap-x-6 border-t border-white/30 py-2.5"
						>
							<span className="text-sm text-on-brand">{r.label}</span>
							{r.href.startsWith("/") ? (
								<Link
									href={r.href}
									className="on-color-link inline-flex min-h-8 items-center font-medium"
								>
									{r.value}
								</Link>
							) : (
								<a
									href={r.href}
									{...(r.href.startsWith("http") && {
										target: "_blank",
										rel: "noopener noreferrer",
									})}
									className="on-color-link inline-flex min-h-8 items-center font-medium [overflow-wrap:anywhere]"
								>
									{r.value}
								</a>
							)}
						</li>
					))}
				</ul>
			</div>
			<CalendarModal
				isOpen={isCalendarOpen}
				onClose={() => setIsCalendarOpen(false)}
			/>
		</section>
	);
}
