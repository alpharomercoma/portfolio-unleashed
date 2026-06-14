"use client";

import Link from "next/link";

import { saveCollectionItem } from "@/app/admin/collection-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldConfig } from "@/lib/collections/registry";

const selectCls =
	"flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

export function CollectionForm({
	fields,
	collectionKey,
	item,
	imageOptions,
	labelSingular,
	listHref,
	error,
}: {
	fields: FieldConfig[];
	collectionKey: string;
	item?: Record<string, unknown>;
	imageOptions: Record<string, string[]>;
	labelSingular: string;
	listHref: string;
	error?: string;
}) {
	const val = (name: string) =>
		item?.[name] != null ? String(item[name]) : "";

	return (
		<form action={saveCollectionItem} className="space-y-6 max-w-2xl">
			{error && (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			)}
			<input type="hidden" name="collection" value={collectionKey} />
			{item?.id != null && (
				<input type="hidden" name="id" defaultValue={String(item.id)} />
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
				{fields.map((field) => {
					const id = `field-${field.name}`;
					const listId = `${id}-options`;
					const options = imageOptions[field.name] ?? [];
					return (
						<div
							key={field.name}
							className={`space-y-2 ${
								field.full || field.kind === "textarea" ? "sm:col-span-2" : ""
							}`}
						>
							<Label htmlFor={id}>
								{field.label}
								{field.required && <span className="text-destructive"> *</span>}
							</Label>

							{field.kind === "textarea" ? (
								<Textarea
									id={id}
									name={field.name}
									rows={4}
									required={field.required}
									placeholder={field.placeholder}
									defaultValue={val(field.name)}
								/>
							) : field.kind === "select" ? (
								<select
									id={id}
									name={field.name}
									defaultValue={val(field.name) || field.options?.[0] || ""}
									className={selectCls}
								>
									{(field.options ?? []).map((opt) => (
										<option key={opt} value={opt}>
											{opt}
										</option>
									))}
								</select>
							) : field.kind === "image" ? (
								<>
									<Input
										id={id}
										name={field.name}
										list={listId}
										placeholder={field.placeholder ?? "file name or URL"}
										defaultValue={val(field.name)}
									/>
									<datalist id={listId}>
										{options.map((opt) => (
											<option key={opt} value={opt} />
										))}
									</datalist>
								</>
							) : (
								<Input
									id={id}
									name={field.name}
									type={field.kind === "date" ? "date" : "text"}
									required={field.required}
									placeholder={field.placeholder}
									defaultValue={val(field.name)}
								/>
							)}

							{field.help && (
								<p className="text-xs text-muted-foreground">{field.help}</p>
							)}
						</div>
					);
				})}
			</div>

			<div className="flex items-center gap-3 pt-2">
				<Button type="submit">Save {labelSingular.toLowerCase()}</Button>
				<Button asChild variant="outline">
					<Link href={listHref}>Cancel</Link>
				</Button>
			</div>
		</form>
	);
}
