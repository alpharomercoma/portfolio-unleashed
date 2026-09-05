"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CalendarModal } from "./calendar-modal";

const EMAIL = "alpharomercoma@proton.me";

export function CtaSection() {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	return (
		<section
			id="contact"
			className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28"
		>
			<div className="max-w-6xl mx-auto">
				<div className="relative overflow-hidden rounded-[2rem] bg-lime text-ink px-6 sm:px-12 lg:px-16 py-14 sm:py-20">
					<div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16 lg:items-start">
						<div>
							{/* The heading names the three reasons someone is here, so the
							    right visitor recognises themselves instead of reading a
							    generic invitation. */}
							<h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[0.98] tracking-[-0.035em] text-ink text-balance">
								Hiring, collaborating, or looking for a speaker?
							</h2>
						</div>
						<div className="w-full">
							<p className="text-ink/80 leading-relaxed mb-6 max-w-sm">
								I&apos;m open to full-time ML roles, research collaborations,
								and speaking invitations, especially in multimodal AI and
								accelerated computing.
							</p>
							<div className="flex flex-col gap-3 max-w-sm">
								<Button
									size="lg"
									className="w-full bg-ink text-lime hover:bg-ink/90"
									onClick={() => setIsCalendarOpen(true)}
								>
									Book a call
									<ArrowRight className="h-4 w-4" />
								</Button>
								<Button
									asChild
									size="lg"
									variant="outline"
									className="w-full border-ink/30 text-ink hover:bg-ink hover:text-lime hover:border-ink"
								>
									<Link href={`mailto:${EMAIL}`}>
										<Mail className="h-4 w-4" />
										Send an email
									</Link>
								</Button>
							</div>
						</div>
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
