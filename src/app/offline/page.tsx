import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";

export const metadata: Metadata = {
	title: "Offline",
	description: "You appear to be offline.",
	robots: { index: false },
};

export default function OfflinePage() {
	return (
		<main className="min-h-screen grid place-items-center bg-background px-6 text-center">
			<div className="max-w-md">
				<div className="mx-auto mb-8 w-fit">
					<Logo size={56} />
				</div>
				<h1 className="display-lg">
					You&apos;re <span className="lime-mark">offline</span>.
				</h1>
				<p className="lede mt-6">
					This page isn&apos;t available without a connection. Reconnect and try
					again, the rest of the site will be right here.
				</p>
				<Link
					href="/"
					className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
				>
					Back to home
				</Link>
			</div>
		</main>
	);
}
