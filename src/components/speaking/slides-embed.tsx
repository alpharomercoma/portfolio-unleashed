"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

// The embedded deck loads only when asked for. It's a heavy third-party page that
// sets its own cookies, and most visitors read the talk without opening it.
export function SlidesEmbed({ src, title }: { src: string; title: string }) {
	const [show, setShow] = useState(false);

	if (!show) {
		return (
			<Button
				type="button"
				variant="outline"
				size="lg"
				className="mt-4"
				onClick={() => setShow(true)}
			>
				Show the slides here
			</Button>
		);
	}

	return (
		<div className="relative mt-4 aspect-video overflow-hidden rounded-[1.75rem] border border-border bg-secondary">
			<iframe
				src={src}
				title={title}
				allowFullScreen
				className="absolute inset-0 h-full w-full"
			/>
		</div>
	);
}
