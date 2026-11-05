import type { Metadata } from "next";
import Link from "next/link";

import { LOGO_BRAND, LOGO_WHITE, Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Offline",
	description: "You appear to be offline.",
	robots: { index: false },
};

export default function OfflinePage() {
	return (
		<main className="surface-brand grid min-h-svh place-items-center px-6">
			<div className="max-w-md">
				<Logo size={56} tile={LOGO_WHITE} mark={LOGO_BRAND} />
				<h1 className="display-xl mt-8">You&apos;re offline.</h1>
				<p className="mt-5 text-lg leading-[1.75] text-on-brand">
					This page isn&apos;t saved on this device. Reconnect, then try again.
				</p>
				<Button asChild size="lg" variant="on-color" className="mt-8">
					<Link href="/">Go to the home page</Link>
				</Button>
			</div>
		</main>
	);
}
