import { AboutForm } from "@/components/admin/about-form";
import { getAbout, isAboutStoreConfigured } from "@/lib/about/store";

export default async function AdminAboutPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string; saved?: string }>;
}) {
	const about = await getAbout();
	const { error, saved } = await searchParams;

	return (
		<div>
			<header className="mb-8">
				<h1 className="display-md">About page</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Your personal story, shown at <code>/about</code>.
				</p>
			</header>

			{!isAboutStoreConfigured && (
				<p className="mb-6 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
					Upstash Redis is not configured, so changes will not persist. Showing
					the committed seed content.
				</p>
			)}

			<AboutForm about={about} error={error} saved={Boolean(saved)} />
		</div>
	);
}
