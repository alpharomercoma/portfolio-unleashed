"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CalendarModal } from "./calendar-modal";

export function CtaSection() {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	return (
		<section
			id="contact"
			className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28"
		>
			<div className="max-w-6xl mx-auto">
				<div className="dark relative overflow-hidden rounded-[2rem] bg-background text-foreground border border-border px-6 py-16 sm:py-20 lg:py-24 text-center">
					<span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
						<span className="relative flex size-2">
							<span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-70 animate-ping" />
							<span className="relative inline-flex size-2 rounded-full bg-lime" />
						</span>
						Open to ML roles &amp; collaborations
					</span>
					<h2 className="display-lg mb-5">
						Let&apos;s build something together.
					</h2>
					<p className="lede max-w-2xl mx-auto mb-9">
						Full-time ML roles, research collaborations, and speaking
						invitations, especially multimodal AI and accelerated computing.
						Book a call or send a note; I read every one.
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-3">
						<Button size="lg" onClick={() => setIsCalendarOpen(true)}>
							Book a call
							<ArrowRight className="h-4 w-4" />
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="mailto:alpharomercoma@proton.me">
								<Mail className="h-4 w-4" />
								alpharomercoma@proton.me
							</Link>
						</Button>
					</div>
				</div>
			</div>
			<CalendarModal
				isOpen={isCalendarOpen}
				onClose={() => setIsCalendarOpen(false)}
			/>
		</section>
	);
}
