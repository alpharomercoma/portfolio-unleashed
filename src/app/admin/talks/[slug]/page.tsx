import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TalkForm } from "@/components/admin/talk-form";
import { getTalk } from "@/lib/talks/store";

export const metadata: Metadata = {
	title: "Edit talk",
	robots: { index: false },
};

export default async function EditTalkPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ error?: string }>;
}) {
	const { slug } = await params;
	const sp = await searchParams;
	const talk = await getTalk(slug);
	if (!talk) notFound();

	return (
		<main className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-12">
			<div className="max-w-2xl mx-auto">
				<Link
					href="/admin"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to talks
				</Link>
				<div className="flex items-center justify-between gap-4 mt-6 mb-8">
					<h1 className="display-md">Edit talk</h1>
					<Link
						href={`/speaking/${talk.slug}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm font-medium text-foreground hover:underline"
					>
						View ↗
					</Link>
				</div>
				<TalkForm talk={talk} error={sp.error} />
			</div>
		</main>
	);
}
