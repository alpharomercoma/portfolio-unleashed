"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
	return (
		<main className="surface-brand grid min-h-svh place-items-center px-6">
			<div className="max-w-md">
				<h1 className="display-xl">This page didn&apos;t load.</h1>
				<p className="mt-5 text-lg leading-[1.75] text-on-brand">
					Something went wrong on the server. Try again, or come back in a few
					minutes.
				</p>
				<Button
					type="button"
					size="lg"
					variant="on-color"
					className="mt-8"
					onClick={reset}
				>
					Try again
				</Button>
			</div>
		</main>
	);
}
