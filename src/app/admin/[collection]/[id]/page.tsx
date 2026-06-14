import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionForm } from "@/components/admin/collection-form";
import { buildImageOptions } from "@/lib/collections/images";
import { getCollection } from "@/lib/collections/registry";
import { getItem } from "@/lib/collections/store";

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

	const item = await getItem(collection, id);
	if (!item) notFound();

	const { error } = await searchParams;
	const imageOptions = await buildImageOptions(cfg.fields);
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
			<CollectionForm
				fields={cfg.fields}
				collectionKey={collection}
				item={item}
				imageOptions={imageOptions}
				labelSingular={cfg.labelSingular}
				listHref={`/admin/${collection}`}
				error={error}
			/>
		</div>
	);
}
