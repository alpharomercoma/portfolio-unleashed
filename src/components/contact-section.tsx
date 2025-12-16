"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Calendar,
	CheckCircle,
	Linkedin,
	MessageSquare,
	Send,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export function ContactSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("animate-fade-up");
					}
				});
			},
			{ threshold: 0.1 },
		);

		const elements = sectionRef.current?.querySelectorAll(".animate-on-scroll");
		elements?.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitted(true);
		setTimeout(() => setIsSubmitted(false), 3000);
	};

	return (
		<section ref={sectionRef} id="contact" className="py-12 px-4 sm:px-6">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-8">
					<h2
						className="animate-on-scroll opacity-0 text-2xl sm:text-3xl font-bold text-foreground mb-2"
						style={{ animationDelay: "100ms" }}
					>
						Get in Touch
					</h2>
					<p
						className="animate-on-scroll opacity-0 text-sm text-muted-foreground"
						style={{ animationDelay: "200ms" }}
					>
						Have a project in mind? Let&apos;s talk.
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
					<div
						className="animate-on-scroll opacity-0 p-4 sm:p-6 bg-secondary/50 rounded-xl border border-border"
						style={{ animationDelay: "300ms" }}
					>
						<div className="flex items-center gap-2 mb-4">
							<MessageSquare className="h-4 w-4 text-[var(--color-blue)]" />
							<h3 className="font-semibold text-foreground text-sm">
								Send a Message
							</h3>
						</div>

						{isSubmitted ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<CheckCircle className="h-8 w-8 text-[var(--color-green)] mb-2" />
								<p className="font-medium text-foreground text-sm">
									Message Sent!
								</p>
								<p className="text-xs text-muted-foreground">
									I'll get back to you soon.
								</p>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label htmlFor="name" className="text-xs text-foreground">
											Name
										</Label>
										<Input
											id="name"
											placeholder="Your name"
											className="bg-background border-border h-9 text-sm"
											required
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="email" className="text-xs text-foreground">
											Email
										</Label>
										<Input
											id="email"
											type="email"
											placeholder="your@email.com"
											className="bg-background border-border h-9 text-sm"
											required
										/>
									</div>
								</div>
								<div className="space-y-1">
									<Label htmlFor="subject" className="text-xs text-foreground">
										Subject
									</Label>
									<Input
										id="subject"
										placeholder="What's this about?"
										className="bg-background border-border h-9 text-sm"
										required
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="message" className="text-xs text-foreground">
										Message
									</Label>
									<Textarea
										id="message"
										placeholder="Your message..."
										className="bg-background border-border min-h-24 text-sm"
										required
									/>
								</div>
								<Button
									type="submit"
									className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 h-9 text-sm"
								>
									<Send className="mr-2 h-3 w-3" /> Send Message
								</Button>
							</form>
						)}
					</div>

					<div
						className="animate-on-scroll opacity-0 p-4 sm:p-6 bg-secondary/50 rounded-xl border border-border flex flex-col"
						style={{ animationDelay: "400ms" }}
					>
						<div className="flex items-center gap-2 mb-4">
							<Calendar className="h-4 w-4 text-[var(--color-green)]" />
							<h3 className="font-semibold text-foreground text-sm">
								Schedule a Meeting
							</h3>
						</div>
						<p className="text-xs text-muted-foreground mb-4">
							Book a 30-minute call to discuss potential collaborations,
							consulting, or just to chat about AI/ML.
						</p>
						<Button
							className="w-full rounded-full bg-[var(--color-green)] text-white hover:bg-[var(--color-green)]/90 h-9 text-sm mb-4"
							asChild
						>
							<Link
								href="https://calendar.google.com"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Calendar className="mr-2 h-3 w-3" /> Book on Google Calendar
							</Link>
						</Button>

						<div className="mt-auto pt-4 border-t border-border">
							<div className="flex items-center gap-2 mb-2">
								<Linkedin className="h-4 w-4 text-[var(--color-blue)]" />
								<h4 className="font-medium text-foreground text-xs">
									Fastest Way to Reach Me
								</h4>
							</div>
							<p className="text-xs text-muted-foreground mb-3">
								For a quicker response, connect with me directly on LinkedIn.
							</p>
							<Button
								variant="outline"
								className="w-full rounded-full border-[var(--color-blue)] text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 h-9 text-sm bg-transparent"
								asChild
							>
								<Link
									href="https://linkedin.com/in/alpha"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Linkedin className="mr-2 h-3 w-3" /> Connect on LinkedIn
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
