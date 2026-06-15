"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryItem = { id: string; image: string; title: string };

// Masonry of gallery images that opens an animated, near-fullscreen lightbox on
// click. The lightbox follows accessible-modal guidance: Escape / backdrop / a
// 44px close button to dismiss, a focus trap while open, focus restored to the
// clicked thumbnail on close, body-scroll lock, and reduced-motion support.
export function GalleryGrid({ images }: { images: GalleryItem[] }) {
	const [index, setIndex] = useState<number | null>(null);
	const open = index !== null;
	const active = open ? images[index] : null;

	const triggers = useRef<(HTMLButtonElement | null)[]>([]);
	const closeBtn = useRef<HTMLButtonElement>(null);
	const overlay = useRef<HTMLDivElement>(null);
	const restoreTo = useRef<number | null>(null);
	const reduce = useReducedMotion();

	const close = useCallback(() => setIndex(null), []);
	const step = useCallback(
		(delta: number) =>
			setIndex((i) =>
				i === null ? i : (i + delta + images.length) % images.length,
			),
		[images.length],
	);

	// Escape closes; arrow keys navigate.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
			else if (e.key === "ArrowLeft") step(-1);
			else if (e.key === "ArrowRight") step(1);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, close, step]);

	// Lock body scroll while open.
	useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open]);

	// Move focus into the dialog on open; restore it to the thumbnail on close.
	useEffect(() => {
		if (open) {
			restoreTo.current = index;
			closeBtn.current?.focus();
		} else if (restoreTo.current !== null) {
			triggers.current[restoreTo.current]?.focus();
			restoreTo.current = null;
		}
	}, [open, index]);

	// Keep Tab focus within the lightbox.
	const trapTab = (e: React.KeyboardEvent) => {
		if (e.key !== "Tab") return;
		const focusable = overlay.current?.querySelectorAll<HTMLElement>(
			"button:not([disabled])",
		);
		if (!focusable || focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	};

	return (
		<>
			{/* Tighter, uniform gap so the masonry reads as one surface. */}
			<div className="gap-3 [column-fill:balance] columns-2 md:columns-3 lg:columns-4">
				{images.map((item, i) => (
					<figure key={item.id} className="mb-3 break-inside-avoid">
						<button
							type="button"
							ref={(el) => {
								triggers.current[i] = el;
							}}
							onClick={() => setIndex(i)}
							aria-label={item.title ? `View ${item.title}` : "View image"}
							className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
						>
							{/* Plain img keeps the natural aspect ratio (no cropping). */}
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={item.image}
								alt={item.title || ""}
								loading="lazy"
								decoding="async"
								className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.04]"
							/>
							{item.title && (
								<span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-ink/85 via-ink/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
									<span className="flex items-center gap-2 p-4 text-sm font-medium text-background">
										<span
											aria-hidden
											className="size-1.5 shrink-0 rounded-full bg-lime"
										/>
										{item.title}
									</span>
								</span>
							)}
						</button>
					</figure>
				))}
			</div>

			<AnimatePresence>
				{open && active && (
					<motion.div
						ref={overlay}
						className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
						role="dialog"
						aria-modal="true"
						aria-label={active.title || "Image viewer"}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={close}
						onKeyDown={trapTab}
					>
						{/* Dimmed, blurred backdrop. */}
						<div
							aria-hidden
							className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
						/>

						<button
							ref={closeBtn}
							type="button"
							onClick={close}
							aria-label="Close"
							className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition-colors hover:bg-background/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/70"
						>
							<X className="size-5" />
						</button>

						{images.length > 1 && (
							<>
								<button
									type="button"
									aria-label="Previous image"
									onClick={(e) => {
										e.stopPropagation();
										step(-1);
									}}
									className="absolute left-2 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition-colors hover:bg-background/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/70 sm:left-4"
								>
									<ChevronLeft className="size-6" />
								</button>
								<button
									type="button"
									aria-label="Next image"
									onClick={(e) => {
										e.stopPropagation();
										step(1);
									}}
									className="absolute right-2 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition-colors hover:bg-background/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/70 sm:right-4"
								>
									<ChevronRight className="size-6" />
								</button>
							</>
						)}

						{/* The image itself re-animates on navigation (keyed by id). */}
						<motion.figure
							key={active.id}
							className="relative z-[1] flex max-h-[90vh] max-w-[95vw] flex-col items-center"
							initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
							animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
							transition={{ duration: 0.22, ease: "easeOut" }}
							onClick={(e) => e.stopPropagation()}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={active.image}
								alt={active.title || ""}
								className="block h-auto max-h-[82vh] w-auto max-w-[95vw] rounded-lg object-contain shadow-2xl"
							/>
							{active.title && (
								<figcaption className="mt-3 max-w-[95vw] text-center text-sm font-medium text-background/90">
									{active.title}
								</figcaption>
							)}
						</motion.figure>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
