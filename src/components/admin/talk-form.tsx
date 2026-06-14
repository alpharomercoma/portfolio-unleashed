import Link from "next/link";

import { saveTalk } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	TALK_CATEGORIES,
	TALK_LEVELS,
	TALK_TYPES,
	type Talk,
} from "@/lib/talks/schema";

const selectCls =
	"flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

export function TalkForm({ talk, error }: { talk?: Talk; error?: string }) {
	const t = talk;
	return (
		<form action={saveTalk} className="space-y-6 max-w-2xl">
			{error && (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			)}
			<input type="hidden" name="slug" defaultValue={t?.slug ?? ""} />
			<input type="hidden" name="createdAt" defaultValue={t?.createdAt ?? ""} />

			<div className="space-y-2">
				<Label htmlFor="title">Title</Label>
				<Input id="title" name="title" defaultValue={t?.title ?? ""} required />
			</div>

			<div className="space-y-2">
				<Label htmlFor="tagline">Tagline</Label>
				<Input id="tagline" name="tagline" defaultValue={t?.tagline ?? ""} />
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
				<div className="space-y-2">
					<Label htmlFor="type">Type</Label>
					<select
						id="type"
						name="type"
						defaultValue={t?.type ?? "Talk"}
						className={selectCls}
					>
						{TALK_TYPES.map((v) => (
							<option key={v} value={v}>
								{v}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-2">
					<Label htmlFor="level">Level</Label>
					<select
						id="level"
						name="level"
						defaultValue={t?.level ?? "Foundational"}
						className={selectCls}
					>
						{TALK_LEVELS.map((v) => (
							<option key={v} value={v}>
								{v}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-2 col-span-2 sm:col-span-1">
					<Label htmlFor="category">Category</Label>
					<input
						id="category"
						name="category"
						list="categories"
						defaultValue={t?.category ?? "Community"}
						className={selectCls}
					/>
					<datalist id="categories">
						{TALK_CATEGORIES.map((v) => (
							<option key={v} value={v} />
						))}
					</datalist>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="durationMinutes">Duration (minutes)</Label>
					<Input
						id="durationMinutes"
						name="durationMinutes"
						type="number"
						defaultValue={t?.durationMinutes ?? 60}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="language">Language</Label>
					<Input
						id="language"
						name="language"
						defaultValue={t?.language ?? "English"}
					/>
				</div>
			</div>

			<div className="flex gap-6">
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" name="featured" defaultChecked={t?.featured} />
					Featured
				</label>
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						name="needsReview"
						defaultChecked={t?.needsReview}
					/>
					Needs review
				</label>
			</div>

			<div className="space-y-2">
				<Label htmlFor="abstract">Abstract</Label>
				<Textarea
					id="abstract"
					name="abstract"
					rows={4}
					defaultValue={t?.abstract ?? ""}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="outline">Outline (one item per line)</Label>
				<Textarea
					id="outline"
					name="outline"
					rows={6}
					defaultValue={(t?.outline ?? []).join("\n")}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="keyTakeaways">Key takeaways (one per line)</Label>
				<Textarea
					id="keyTakeaways"
					name="keyTakeaways"
					rows={4}
					defaultValue={(t?.keyTakeaways ?? []).join("\n")}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="tags">Tags (one per line)</Label>
				<Textarea
					id="tags"
					name="tags"
					rows={3}
					defaultValue={(t?.tags ?? []).join("\n")}
				/>
			</div>

			<div className="grid sm:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="primarySlideUrl">Primary slide URL</Label>
					<Input
						id="primarySlideUrl"
						name="primarySlideUrl"
						defaultValue={t?.primarySlideUrl ?? ""}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="videoUrl">Video URL</Label>
					<Input
						id="videoUrl"
						name="videoUrl"
						defaultValue={t?.videoUrl ?? ""}
					/>
				</div>
			</div>

			<div className="grid sm:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="showcaseImage">Showcase image URL</Label>
					<Input
						id="showcaseImage"
						name="showcaseImage"
						defaultValue={t?.showcaseImage ?? ""}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="showcaseFile">…or upload an image (Blob)</Label>
					<Input
						id="showcaseFile"
						name="showcaseFile"
						type="file"
						accept="image/*"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="events">Events (JSON array)</Label>
				<Textarea
					id="events"
					name="events"
					rows={10}
					className="font-mono text-xs"
					defaultValue={JSON.stringify(t?.events ?? [], null, 2)}
				/>
				<p className="text-xs text-muted-foreground">
					Each event: eventName, organizerName, date (YYYY-MM-DD), venue,
					audienceSize, slideUrl, videoUrl.
				</p>
			</div>

			<div className="flex items-center gap-3 pt-2">
				<Button type="submit">Save talk</Button>
				<Button asChild variant="outline">
					<Link href="/admin">Cancel</Link>
				</Button>
			</div>
		</form>
	);
}
