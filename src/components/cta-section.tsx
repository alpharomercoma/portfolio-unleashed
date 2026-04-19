"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CalendarModal } from "./calendar-modal";

export function CtaSection() {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	return (
		<section className="px-4 sm:px-6 py-20 sm:py-28">
			<div className="max-w-4xl mx-auto text-center">
				<p className="eyebrow mb-4">Get in touch</p>
				<h2 className="display-lg mb-5">Hiring an ML engineer?</h2>
				<p className="lede max-w-2xl mx-auto mb-8">
					Open to full-time ML roles, research collaborations, and speaking
					invitations. Multimodal AI and accelerated computing are my bread and
					butter. Book a call or send an email below.
				</p>
				<div className="flex flex-col sm:flex-row justify-center gap-3">
					<Button
						size="lg"
						className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-12 px-6"
						onClick={() => setIsCalendarOpen(true)}
					>
						Book a call <ArrowRight className="ml-1.5 h-4 w-4" />
					</Button>
					<Button
						asChild
						size="lg"
						variant="outline"
						className="rounded-full h-12 px-6 border-gray-200 hover:bg-gray-50"
					>
						<Link href="mailto:alpharomercoma@proton.me">
							<Mail className="h-4 w-4" /> alpharomercoma@proton.me
						</Link>
					</Button>
				</div>
			</div>
			<CalendarModal
				isOpen={isCalendarOpen}
				onClose={() => setIsCalendarOpen(false)}
			/>
		</section>
	);
}
