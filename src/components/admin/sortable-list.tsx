"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { reorderCollectionItems } from "@/app/admin/collection-actions";
import { removeCollectionItem } from "@/app/admin/collection-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SortableRowData = {
	id: string;
	title: string;
	meta: string;
	editHref: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SortableList({
	collectionKey,
	items,
}: {
	collectionKey: string;
	items: SortableRowData[];
}) {
	const [rows, setRows] = useState(items);
	const [status, setStatus] = useState<SaveStatus>("idle");
	const [, startTransition] = useTransition();

	// Keep local order in sync if the server sends a fresh list (e.g. after an
	// add/delete revalidation), but don't clobber an in-flight optimistic move.
	useEffect(() => {
		setRows(items);
	}, [items]);

	// Fade the "Saved" pill back to idle.
	useEffect(() => {
		if (status !== "saved") return;
		const t = setTimeout(() => setStatus("idle"), 1800);
		return () => clearTimeout(t);
	}, [status]);

	const sensors = useSensors(
		// A small distance threshold lets clicks on Edit/Delete through without
		// starting a drag.
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function onDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = rows.findIndex((r) => r.id === active.id);
		const newIndex = rows.findIndex((r) => r.id === over.id);
		if (oldIndex < 0 || newIndex < 0) return;

		const next = arrayMove(rows, oldIndex, newIndex);
		setRows(next); // optimistic
		setStatus("saving");
		startTransition(async () => {
			const res = await reorderCollectionItems(
				collectionKey,
				next.map((r) => r.id),
			);
			setStatus(res.ok ? "saved" : "error");
		});
	}

	return (
		<div>
			<div className="mb-3 flex items-center justify-between gap-3">
				<p className="text-xs text-muted-foreground">
					Drag the handle to reorder — changes save automatically.
				</p>
				<SaveIndicator status={status} />
			</div>

			<DndContext
				// Stable id → deterministic a11y ids across SSR/client (dnd-kit
				// otherwise uses a module counter that mismatches on hydration).
				id={`sortable-${collectionKey}`}
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis]}
				onDragEnd={onDragEnd}
			>
				<SortableContext
					items={rows.map((r) => r.id)}
					strategy={verticalListSortingStrategy}
				>
					<ul className="divide-y divide-border border-y border-border">
						{rows.map((row) => (
							<SortableRow
								key={row.id}
								row={row}
								collectionKey={collectionKey}
							/>
						))}
					</ul>
				</SortableContext>
			</DndContext>
		</div>
	);
}

function SaveIndicator({ status }: { status: SaveStatus }) {
	if (status === "idle") return null;
	if (status === "saving")
		return (
			<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
				<Loader2 className="size-3.5 animate-spin" />
				Saving…
			</span>
		);
	if (status === "saved")
		return (
			<span className="inline-flex items-center gap-1.5 text-xs text-lime-strong">
				<Check className="size-3.5" />
				Saved
			</span>
		);
	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-destructive">
			<TriangleAlert className="size-3.5" />
			Couldn’t save order
		</span>
	);
}

function SortableRow({
	row,
	collectionKey,
}: {
	row: SortableRowData;
	collectionKey: string;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: row.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<li
			ref={setNodeRef}
			style={style}
			className={cn(
				"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 bg-background",
				isDragging && "relative z-10 rounded-lg shadow-lg",
			)}
		>
			<div className="flex items-center gap-3 min-w-0">
				<button
					type="button"
					aria-label={`Drag to reorder ${row.title}`}
					className="shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
					{...attributes}
					{...listeners}
				>
					<GripVertical className="size-4" />
				</button>
				<div className="min-w-0">
					<Link
						href={row.editHref}
						className="font-medium text-foreground hover:underline line-clamp-1"
					>
						{row.title}
					</Link>
					{row.meta && (
						<div className="text-xs text-muted-foreground mt-0.5">
							{row.meta}
						</div>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<Button asChild variant="outline" size="sm">
					<Link href={row.editHref}>Edit</Link>
				</Button>
				<form action={removeCollectionItem}>
					<input type="hidden" name="collection" value={collectionKey} />
					<input type="hidden" name="id" value={row.id} />
					<Button variant="outline" size="sm" type="submit">
						Delete
					</Button>
				</form>
			</div>
		</li>
	);
}
