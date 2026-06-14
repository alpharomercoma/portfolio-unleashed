import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionForm } from "@/components/admin/collection-form";
import { buildImageOptions } from "@/lib/collections/images";
import { getCollection } from "@/lib/collections/registry";

export default async function NewCollectionItemPage({
	params,
	searchParams,
}: {
	params: Promise<{ collection: string }>;
	searchParams: Promise<{ error?: string }>;
}) {
	const { collection } = await params;
	const cfg = getCollection(collection);
	if (!cfg) notFound();

	const { error } = await searchParams;
	const imageOptions = await buildImageOptions(cfg.fields);

	return (
		<div>
			<nav className="mb-6 text-sm text-muted-foreground">
				<Link href={`/admin/${collection}`} className="hover:text-foreground">
					{cfg.labelPlural}
				</Link>{" "}
				/ New
			</nav>
			<h1 className="display-md mb-8">New {cfg.labelSingular.toLowerCase()}</h1>
			<CollectionForm
				fields={cfg.fields}
				collectionKey={collection}
				imageOptions={imageOptions}
				labelSingular={cfg.labelSingular}
				listHref={`/admin/${collection}`}
				error={error}
			/>
		</div>
	);
}
