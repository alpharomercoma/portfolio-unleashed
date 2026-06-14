import Link from "next/link";
import { notFound } from "next/navigation";

import { removeCollectionItem } from "@/app/admin/collection-actions";
import { Button } from "@/components/ui/button";
import { getCollection } from "@/lib/collections/registry";
import {
	getAllItems,
	isCollectionsStoreConfigured,
} from "@/lib/collections/store";

export default async function CollectionListPage({
	params,
}: {
	params: Promise<{ collection: string }>;
}) {
	const { collection } = await params;
	const cfg = getCollection(collection);
	if (!cfg) notFound();

	const items = await getAllItems(collection);

	return (
		<div>
			<header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
				<div>
					<h1 className="display-md">{cfg.labelPlural}</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{items.length} {items.length === 1 ? "item" : "items"}
					</p>
				</div>
				<Button asChild>
					<Link href={`/admin/${collection}/new`}>
						New {cfg.labelSingular.toLowerCase()}
					</Link>
				</Button>
			</header>

			{!isCollectionsStoreConfigured && (
				<p className="mb-6 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
					Upstash Redis is not configured, so changes will not persist. Showing
					the committed seed data.
				</p>
			)}

			<ul className="divide-y divide-border border-y border-border">
				{items.map((item) => {
					const { title, meta } = cfg.summary(item);
					return (
						<li
							key={item.id}
							className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4"
						>
							<div className="min-w-0">
								<Link
									href={`/admin/${collection}/${item.id}`}
									className="font-medium text-foreground hover:underline line-clamp-1"
								>
									{title}
								</Link>
								{meta && (
									<div className="text-xs text-muted-foreground mt-0.5">
										{meta}
									</div>
								)}
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<Button asChild variant="outline" size="sm">
									<Link href={`/admin/${collection}/${item.id}`}>Edit</Link>
								</Button>
								<form action={removeCollectionItem}>
									<input type="hidden" name="collection" value={collection} />
									<input type="hidden" name="id" value={String(item.id)} />
									<Button variant="outline" size="sm" type="submit">
										Delete
									</Button>
								</form>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
