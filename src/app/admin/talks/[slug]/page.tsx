import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TalkForm } from "@/components/admin/talk-form";
import { env } from "@/env";
import { getTalkForEdit } from "@/lib/talks/store";

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
	const loaded = await getTalkForEdit(slug);
	if (!loaded) notFound();
	const { talk, rev } = loaded;

	return (
		<div className="py-2">
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
				{/* Keyed by revision: after a conflict the form remounts with the
				    latest content instead of pairing stale edits with a new rev. */}
				<TalkForm
					key={rev ?? "unstored"}
					talk={talk}
					rev={rev}
					error={sp.error}
					aiEnabled={Boolean(env.MISTRAL_API_KEY)}
				/>
			</div>
		</div>
	);
}
