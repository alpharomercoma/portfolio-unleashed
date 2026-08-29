import Link from "next/link";
import { notFound } from "next/navigation";

import {
	removeCollectionItem,
	toggleCollectionItemVisibility,
} from "@/app/admin/collection-actions";
import { HiddenBadge } from "@/components/admin/hidden-badge";
import { SortableList } from "@/components/admin/sortable-list";
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
	// Collections with an image field get a small thumbnail beside each row.
	const imageField = cfg.fields.find((f) => f.kind === "image")?.name;
	const thumbOf = (item: Record<string, unknown>) =>
		imageField ? String(item[imageField] ?? "") || undefined : undefined;

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

			{cfg.reorderable ? (
				<SortableList
					collectionKey={collection}
					items={items.map((item) => {
						const { title, meta } = cfg.summary(item);
						return {
							id: String(item.id),
							title,
							meta,
							editHref: `/admin/${collection}/${item.id}`,
							thumb: thumbOf(item),
							hidden: Boolean(item.hidden),
						};
					})}
				/>
			) : (
				<ul className="divide-y divide-border border-y border-border">
					{items.map((item) => {
						const { title, meta } = cfg.summary(item);
						const hidden = Boolean(item.hidden);
						return (
							<li
								key={item.id}
								className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4"
							>
								<div className="flex items-center gap-3 min-w-0">
									{thumbOf(item) && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={thumbOf(item)}
											alt=""
											loading="lazy"
											className={`size-10 shrink-0 rounded-md border border-border bg-secondary object-cover ${
												hidden ? "opacity-40" : ""
											}`}
										/>
									)}
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<Link
												href={`/admin/${collection}/${item.id}`}
												className={`font-medium hover:underline line-clamp-1 ${
													hidden ? "text-muted-foreground" : "text-foreground"
												}`}
											>
												{title}
											</Link>
											{hidden && <HiddenBadge />}
										</div>
										{meta && (
											<div className="text-xs text-muted-foreground mt-0.5">
												{meta}
											</div>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<Button asChild variant="outline" size="sm">
										<Link href={`/admin/${collection}/${item.id}`}>Edit</Link>
									</Button>
									<form action={toggleCollectionItemVisibility}>
										<input type="hidden" name="collection" value={collection} />
										<input type="hidden" name="id" value={String(item.id)} />
										<input
											type="hidden"
											name="hidden"
											value={hidden ? "false" : "true"}
										/>
										<Button variant="outline" size="sm" type="submit">
											{hidden ? "Unhide" : "Hide"}
										</Button>
									</form>
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
			)}
		</div>
	);
}
