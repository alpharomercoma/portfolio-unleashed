import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionForm } from "@/components/admin/collection-form";
import { getCollection } from "@/lib/collections/registry";
import { getItemForEdit } from "@/lib/collections/store";

export default async function EditCollectionItemPage({
	params,
	searchParams,
}: {
	params: Promise<{ collection: string; id: string }>;
	searchParams: Promise<{ error?: string }>;
}) {
	const { collection, id } = await params;
	const cfg = getCollection(collection);
	if (!cfg) notFound();

	const loaded = await getItemForEdit(collection, id);
	if (!loaded) notFound();
	const { item, rev } = loaded;

	const { error } = await searchParams;
	const { title } = cfg.summary(item);

	return (
		<div>
			<nav className="mb-6 text-sm text-muted-foreground">
				<Link href={`/admin/${collection}`} className="hover:text-foreground">
					{cfg.labelPlural}
				</Link>{" "}
				/ Edit
			</nav>
			<h1 className="display-md mb-8 line-clamp-1">{title}</h1>
			{/* Keyed by revision: after a conflict the form remounts with the
			    latest content instead of pairing stale edits with a new rev. */}
			<CollectionForm
				key={rev ?? "unstored"}
				fields={cfg.fields}
				collectionKey={collection}
				item={item}
				rev={rev}
				labelSingular={cfg.labelSingular}
				listHref={`/admin/${collection}`}
				error={error}
			/>
		</div>
	);
}
