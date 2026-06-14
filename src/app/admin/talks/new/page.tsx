import type { Metadata } from "next";
import Link from "next/link";

import { TalkForm } from "@/components/admin/talk-form";

export const metadata: Metadata = {
	title: "New talk",
	robots: { index: false },
};

export default async function NewTalkPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const sp = await searchParams;
	return (
		<main className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-12">
			<div className="max-w-2xl mx-auto">
				<Link
					href="/admin"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to talks
				</Link>
				<h1 className="display-md mt-6 mb-8">New talk</h1>
				<TalkForm error={sp.error} />
			</div>
		</main>
	);
}
