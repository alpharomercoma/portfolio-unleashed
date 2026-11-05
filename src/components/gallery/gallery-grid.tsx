"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SiteImage } from "@/components/site-image";
import { optimizedImage } from "@/lib/assets";

export type GalleryItem = { id: string; image: string; title: string };

// A grid of gallery photos that opens a near-fullscreen viewer on click. The viewer
// is a native modal dialog: the browser supplies the focus trap, Escape, the inert
// background, and returning focus to the photo that opened it.
export function GalleryGrid({ images }: { images: GalleryItem[] }) {
	const [index, setIndex] = useState<number | null>(null);
	const active = index === null ? null : images[index];
	const dialog = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const d = dialog.current;
		if (!d) return;
		if (index !== null && !d.open) d.showModal();
		if (index === null && d.open) d.close();
	}, [index]);

	const close = useCallback(() => setIndex(null), []);
	const step = useCallback(
		(delta: number) =>
			setIndex((i) =>
				i === null ? i : (i + delta + images.length) % images.length,
			),
		[images.length],
	);

	const iconButton =
		"absolute z-10 inline-flex size-11 items-center justify-center rounded-full bg-white text-ink hover:bg-brand-wash";

	return (
		<>
			{/* An even grid, so the page doesn't reflow as photos load and stays calm.
			    The viewer shows each photo whole; captions are always visible so they
			    work by touch and keyboard, not only on hover. */}
			<ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4">
				{images.map((item, i) => (
					<li key={item.id}>
						<figure>
							<button
								type="button"
								onClick={() => setIndex(i)}
								aria-label={
									item.title ? `Enlarge ${item.title}` : "Enlarge photo"
								}
								className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-secondary"
							>
								<SiteImage
									src={item.image}
									alt=""
									fill
									// The first row is what a visitor sees on arrival.
									priority={i < 3}
									sizes="(min-width: 1312px) 26rem, (min-width: 768px) 33vw, 50vw"
									className="object-cover"
								/>
							</button>
							{item.title && (
								<figcaption className="mt-2 text-sm text-muted-foreground">
									{item.title}
								</figcaption>
							)}
						</figure>
					</li>
				))}
			</ul>

			<dialog
				ref={dialog}
				aria-label={active?.title || "Photo viewer"}
				onClose={close}
				onKeyDown={(e) => {
					if (e.key === "ArrowLeft") step(-1);
					if (e.key === "ArrowRight") step(1);
				}}
				className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 [--focus:#ffffff] backdrop:bg-ink/90"
			>
				{active && (
					<div
						className="flex h-full items-center justify-center p-4 sm:p-8"
						// A click on the empty space around the photo closes the viewer.
						onClick={(e) => {
							if (e.target === e.currentTarget) close();
						}}
					>
						<button
							type="button"
							onClick={close}
							aria-label="Close"
							className={`${iconButton} right-3 top-3`}
						>
							<X className="size-5" aria-hidden />
						</button>

						{images.length > 1 && (
							<>
								<button
									type="button"
									aria-label="Previous photo"
									onClick={() => step(-1)}
									className={`${iconButton} left-2 top-1/2 -translate-y-1/2 sm:left-4`}
								>
									<ChevronLeft className="size-6" aria-hidden />
								</button>
								<button
									type="button"
									aria-label="Next photo"
									onClick={() => step(1)}
									className={`${iconButton} right-2 top-1/2 -translate-y-1/2 sm:right-4`}
								>
									<ChevronRight className="size-6" aria-hidden />
								</button>
							</>
						)}

						<figure className="flex max-h-[90vh] max-w-[95vw] flex-col items-center">
							{/* Its size isn't stored, so it can't be laid out by next/image
							    without cropping. */}
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={optimizedImage(active.image, 1920)}
								alt={active.title || ""}
								className="block h-auto max-h-[82vh] w-auto max-w-[95vw] rounded-lg object-contain"
							/>
							{active.title && (
								<figcaption className="mt-3 text-center text-sm font-medium text-white">
									{active.title}
								</figcaption>
							)}
						</figure>
					</div>
				)}
			</dialog>
		</>
	);
}
