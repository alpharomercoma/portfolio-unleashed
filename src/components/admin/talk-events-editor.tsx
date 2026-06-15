"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { ImagePicker } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TalkEvent } from "@/lib/talks/schema";

// One editable row. `audienceSize` is kept as a string for the number input and
// coerced on serialize; `_key` is a stable local id for React, never persisted.
type Row = {
	_key: number;
	id: string;
	eventName: string;
	organizerName: string;
	organizerLogo: string;
	date: string;
	venue: string;
	audienceSize: string;
	slideUrl: string;
	videoUrl: string;
};

function toRow(e: Partial<TalkEvent>, key: number): Row {
	return {
		_key: key,
		id: e.id ?? "",
		eventName: e.eventName ?? "",
		organizerName: e.organizerName ?? "",
		organizerLogo: e.organizerLogo ?? "",
		date: e.date ?? "",
		venue: e.venue ?? "",
		audienceSize: e.audienceSize != null ? String(e.audienceSize) : "",
		slideUrl: e.slideUrl ?? "",
		videoUrl: e.videoUrl ?? "",
	};
}

// A row is "active" once it has any content. Empty rows are dropped on submit;
// active rows require the three core fields (matches talkEventSchema).
function isActive(r: Row): boolean {
	return Boolean(
		r.eventName ||
		r.organizerName ||
		r.organizerLogo ||
		r.date ||
		r.venue ||
		r.audienceSize ||
		r.slideUrl ||
		r.videoUrl,
	);
}

function serialize(rows: Row[]): string {
	const events = rows.filter(isActive).map((r) => ({
		...(r.id ? { id: r.id } : {}),
		eventName: r.eventName.trim(),
		organizerName: r.organizerName.trim(),
		organizerLogo: r.organizerLogo.trim(),
		date: r.date,
		venue: r.venue.trim(),
		audienceSize: Number(r.audienceSize) || 0,
		slideUrl: r.slideUrl.trim(),
		videoUrl: r.videoUrl.trim(),
	}));
	return JSON.stringify(events);
}

export function TalkEventsEditor({
	defaultEvents,
}: {
	defaultEvents: TalkEvent[];
}) {
	const [rows, setRows] = useState<Row[]>(() =>
		defaultEvents.map((e, i) => toRow(e, i)),
	);
	const nextKey = useRef(defaultEvents.length);

	const update = (key: number, patch: Partial<Row>) =>
		setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...patch } : r)));

	const remove = (key: number) =>
		setRows((rs) => rs.filter((r) => r._key !== key));

	const add = () => setRows((rs) => [...rs, toRow({}, nextKey.current++)]);

	const move = (index: number, delta: number) =>
		setRows((rs) => {
			const next = [...rs];
			const target = index + delta;
			if (target < 0 || target >= next.length) return rs;
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});

	return (
		<div className="space-y-3">
			{/* The form reads this serialized payload; the rows above never submit
			    their own fields, so the admin never touches raw JSON. */}
			<input type="hidden" name="events" value={serialize(rows)} />

			{rows.length === 0 && (
				<p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
					No events yet. Add where and when this talk was delivered.
				</p>
			)}

			<ul className="space-y-4">
				{rows.map((row, index) => {
					const active = isActive(row);
					return (
						<li
							key={row._key}
							className="rounded-xl border border-border bg-card p-4"
						>
							<div className="mb-3 flex items-center justify-between gap-2">
								<span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
									Event {index + 1}
								</span>
								<div className="flex items-center gap-1">
									<button
										type="button"
										aria-label="Move up"
										disabled={index === 0}
										onClick={() => move(index, -1)}
										className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
									>
										<ChevronUp className="size-4" />
									</button>
									<button
										type="button"
										aria-label="Move down"
										disabled={index === rows.length - 1}
										onClick={() => move(index, 1)}
										className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
									>
										<ChevronDown className="size-4" />
									</button>
									<button
										type="button"
										aria-label={`Remove event ${index + 1}`}
										onClick={() => remove(row._key)}
										className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2 className="size-4" />
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
								<div className="space-y-1.5 sm:col-span-2">
									<Label htmlFor={`evt-name-${row._key}`}>
										Event name{" "}
										{active && <span className="text-destructive">*</span>}
									</Label>
									<Input
										id={`evt-name-${row._key}`}
										required={active}
										value={row.eventName}
										placeholder="PyTorch Conference Europe 2026"
										onChange={(e) =>
											update(row._key, { eventName: e.target.value })
										}
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor={`evt-org-${row._key}`}>
										Organizer{" "}
										{active && <span className="text-destructive">*</span>}
									</Label>
									<Input
										id={`evt-org-${row._key}`}
										required={active}
										value={row.organizerName}
										placeholder="Linux Foundation"
										onChange={(e) =>
											update(row._key, { organizerName: e.target.value })
										}
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor={`evt-date-${row._key}`}>
										Date {active && <span className="text-destructive">*</span>}
									</Label>
									<Input
										id={`evt-date-${row._key}`}
										type="date"
										required={active}
										value={row.date}
										onChange={(e) => update(row._key, { date: e.target.value })}
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor={`evt-venue-${row._key}`}>Venue</Label>
									<Input
										id={`evt-venue-${row._key}`}
										value={row.venue}
										placeholder="Station F, Paris"
										onChange={(e) =>
											update(row._key, { venue: e.target.value })
										}
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor={`evt-reach-${row._key}`}>Audience size</Label>
									<Input
										id={`evt-reach-${row._key}`}
										type="number"
										min={0}
										value={row.audienceSize}
										placeholder="0"
										onChange={(e) =>
											update(row._key, { audienceSize: e.target.value })
										}
									/>
								</div>

								<div className="space-y-1.5 sm:col-span-2">
									<Label htmlFor={`evt-slide-${row._key}`}>Slides URL</Label>
									<Input
										id={`evt-slide-${row._key}`}
										type="url"
										value={row.slideUrl}
										placeholder="https://..."
										onChange={(e) =>
											update(row._key, { slideUrl: e.target.value })
										}
									/>
								</div>

								<div className="space-y-1.5 sm:col-span-2">
									<Label htmlFor={`evt-video-${row._key}`}>Video URL</Label>
									<Input
										id={`evt-video-${row._key}`}
										type="url"
										value={row.videoUrl}
										placeholder="https://..."
										onChange={(e) =>
											update(row._key, { videoUrl: e.target.value })
										}
									/>
								</div>

								<div className="space-y-1.5 sm:col-span-2">
									<Label>Organizer logo</Label>
									<ImagePicker
										value={row.organizerLogo}
										onChange={(url) => update(row._key, { organizerLogo: url })}
									/>
								</div>
							</div>
						</li>
					);
				})}
			</ul>

			<Button type="button" variant="outline" size="sm" onClick={add}>
				<Plus className="size-4" />
				Add event
			</Button>
		</div>
	);
}
