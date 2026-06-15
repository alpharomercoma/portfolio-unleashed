"use client";

import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { saveTalk } from "@/app/admin/actions";
import { draftTalkFromSlides } from "@/app/admin/talk-ai-actions";
import { ImagePicker } from "@/components/admin/image-picker";
import { TalkEventsEditor } from "@/components/admin/talk-events-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	TALK_CATEGORIES,
	TALK_LEVELS,
	TALK_TYPES,
	TYPES_WITHOUT_LEVEL,
	type Talk,
} from "@/lib/talks/schema";

const selectCls =
	"flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

type DraftState =
	| { kind: "idle" }
	| { kind: "loading" }
	| { kind: "done" }
	| { kind: "error"; message: string };

export function TalkForm({
	talk,
	error,
	aiEnabled = false,
}: {
	talk?: Talk;
	error?: string;
	aiEnabled?: boolean;
}) {
	const t = talk;

	// Controlled fields — the AI draft button populates these in place.
	const [title, setTitle] = useState(t?.title ?? "");
	const [tagline, setTagline] = useState(t?.tagline ?? "");
	const [type, setType] = useState<Talk["type"]>(t?.type ?? "Talk");
	const [level, setLevel] = useState<string>(t?.level ?? "Foundational");
	const [category, setCategory] = useState(t?.category ?? "Community");
	const [abstract, setAbstract] = useState(t?.abstract ?? "");
	const [outline, setOutline] = useState((t?.outline ?? []).join("\n"));
	const [keyTakeaways, setKeyTakeaways] = useState(
		(t?.keyTakeaways ?? []).join("\n"),
	);
	const [tags, setTags] = useState((t?.tags ?? []).join("\n"));
	const [status, setStatus] = useState<Talk["status"]>(
		t?.status ?? "published",
	);

	// AI panel — the slides URL doubles as the talk's primary slide URL.
	const [slidesUrl, setSlidesUrl] = useState(t?.primarySlideUrl ?? "");
	const [draft, setDraft] = useState<DraftState>({ kind: "idle" });

	const hasLevel = !TYPES_WITHOUT_LEVEL.includes(type);
	const drafting = draft.kind === "loading";

	async function handleDraft() {
		const url = slidesUrl.trim();
		if (!url) {
			setDraft({ kind: "error", message: "Paste a Google Slides link first." });
			return;
		}
		const hasContent = Boolean(
			title.trim() || abstract.trim() || outline.trim() || keyTakeaways.trim(),
		);
		if (
			hasContent &&
			!window.confirm(
				"Replace the title, tagline, abstract, outline, takeaways, and tags with an AI draft from these slides? (Nothing is saved until you click Save.)",
			)
		) {
			return;
		}
		setDraft({ kind: "loading" });
		try {
			const res = await draftTalkFromSlides(url);
			if (!res.ok) {
				setDraft({ kind: "error", message: res.error });
				return;
			}
			const d = res.draft;
			if (d.title) setTitle(d.title);
			setTagline(d.tagline ?? "");
			setAbstract(d.abstract ?? "");
			setOutline((d.outline ?? []).join("\n"));
			setKeyTakeaways((d.keyTakeaways ?? []).join("\n"));
			setTags((d.tags ?? []).join("\n"));
			if (d.category) setCategory(d.category);
			if (d.type) setType(d.type);
			if (d.level) setLevel(d.level);
			// A fresh draft should be reviewed before it goes public.
			setStatus("draft");
			setDraft({ kind: "done" });
		} catch (err) {
			setDraft({
				kind: "error",
				message: (err as Error).message || "Something went wrong. Try again.",
			});
		}
	}

	return (
		<form action={saveTalk} className="space-y-6 max-w-2xl">
			{error && (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			)}
			<input type="hidden" name="slug" defaultValue={t?.slug ?? ""} />
			<input type="hidden" name="createdAt" defaultValue={t?.createdAt ?? ""} />

			{/* AI draft panel */}
			<div className="rounded-xl border border-lime/40 bg-lime/5 p-4">
				<div className="flex items-center gap-2">
					<Sparkles className="size-4 text-lime-strong" />
					<h2 className="text-sm font-semibold text-foreground">
						Draft from slides
					</h2>
				</div>
				<p className="mt-1 text-xs text-muted-foreground">
					Paste a Google Slides or public PDF link (set to “anyone with the
					link”). Mistral reads the deck and fills in the title, abstract,
					outline, takeaways, and tags — you review, then Save. Canva blocks
					automated reads, so export it to PDF/Slides first.
				</p>
				<div className="mt-3 flex flex-col gap-2 sm:flex-row">
					<Input
						type="url"
						aria-label="Google Slides URL"
						placeholder="https://docs.google.com/presentation/d/…"
						value={slidesUrl}
						onChange={(e) => setSlidesUrl(e.target.value)}
						className="flex-1"
					/>
					<Button
						type="button"
						onClick={handleDraft}
						disabled={!aiEnabled || drafting}
						title={
							aiEnabled
								? undefined
								: "Set MISTRAL_API_KEY to enable AI drafting"
						}
					>
						{drafting ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Reading deck…
							</>
						) : (
							<>
								<Sparkles className="size-4" />
								Draft from slides
							</>
						)}
					</Button>
				</div>
				{!aiEnabled && (
					<p className="mt-2 text-xs text-muted-foreground">
						AI drafting is off. Set <code>MISTRAL_API_KEY</code> to enable it.
					</p>
				)}
				{draft.kind === "error" && (
					<p className="mt-2 text-xs text-destructive">{draft.message}</p>
				)}
				{draft.kind === "done" && (
					<p className="mt-2 text-xs text-lime-strong">
						Drafted from your slides — review the fields below, then Save. Saved
						as a draft until you publish.
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="title">Title</Label>
				<Input
					id="title"
					name="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="tagline">Tagline</Label>
				<Input
					id="tagline"
					name="tagline"
					value={tagline}
					onChange={(e) => setTagline(e.target.value)}
				/>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
				<div className="space-y-2">
					<Label htmlFor="type">Type</Label>
					<select
						id="type"
						name="type"
						value={type}
						onChange={(e) => setType(e.target.value as Talk["type"])}
						className={selectCls}
					>
						{TALK_TYPES.map((v) => (
							<option key={v} value={v}>
								{v}
							</option>
						))}
					</select>
				</div>
				{hasLevel ? (
					<div className="space-y-2">
						<Label htmlFor="level">Level</Label>
						<select
							id="level"
							name="level"
							value={level}
							onChange={(e) => setLevel(e.target.value)}
							className={selectCls}
						>
							{TALK_LEVELS.map((v) => (
								<option key={v} value={v}>
									{v}
								</option>
							))}
						</select>
					</div>
				) : (
					<div className="space-y-2">
						<Label>Level</Label>
						<p className="flex h-9 items-center text-sm text-muted-foreground">
							Not applicable
						</p>
					</div>
				)}
				<div className="space-y-2 col-span-2 sm:col-span-1">
					<Label htmlFor="category">Category</Label>
					<input
						id="category"
						name="category"
						list="categories"
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className={selectCls}
					/>
					<datalist id="categories">
						{TALK_CATEGORIES.map((v) => (
							<option key={v} value={v} />
						))}
					</datalist>
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
				<div className="space-y-2">
					<Label htmlFor="status">Status</Label>
					<select
						id="status"
						name="status"
						value={status}
						onChange={(e) => setStatus(e.target.value as Talk["status"])}
						className={selectCls}
					>
						<option value="published">Published</option>
						<option value="draft">Draft</option>
					</select>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-6 gap-y-2">
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" name="featured" defaultChecked={t?.featured} />
					Featured
				</label>
				<p className="text-xs text-muted-foreground">
					Drafts are hidden from the public site until you set Status to
					Published.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="abstract">Abstract</Label>
				<Textarea
					id="abstract"
					name="abstract"
					rows={4}
					value={abstract}
					onChange={(e) => setAbstract(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="outline">Outline (one item per line)</Label>
				<Textarea
					id="outline"
					name="outline"
					rows={6}
					value={outline}
					onChange={(e) => setOutline(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="keyTakeaways">Key takeaways (one per line)</Label>
				<Textarea
					id="keyTakeaways"
					name="keyTakeaways"
					rows={4}
					value={keyTakeaways}
					onChange={(e) => setKeyTakeaways(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="tags">Tags (one per line)</Label>
				<Textarea
					id="tags"
					name="tags"
					rows={3}
					value={tags}
					onChange={(e) => setTags(e.target.value)}
				/>
			</div>

			<div className="grid sm:grid-cols-2 gap-4">
				<div className="space-y-2">
					{/* Primary slide URL is the same field the AI panel reads above. */}
					<Label htmlFor="primarySlideUrl">Primary slide URL</Label>
					<Input
						id="primarySlideUrl"
						name="primarySlideUrl"
						value={slidesUrl}
						onChange={(e) => setSlidesUrl(e.target.value)}
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

			<div className="space-y-2">
				<Label>Showcase image</Label>
				<ImagePicker
					name="showcaseImage"
					defaultValue={t?.showcaseImage ?? ""}
				/>
			</div>

			<div className="space-y-2">
				<Label>Events</Label>
				<p className="text-xs text-muted-foreground">
					Where and when this talk was delivered. Sorted newest-first on the
					talk page.
				</p>
				<TalkEventsEditor defaultEvents={t?.events ?? []} />
			</div>

			<div className="flex items-center gap-3 pt-2">
				<Button type="submit">Save talk</Button>
				<Button asChild variant="outline">
					<Link href="/admin/talks">Cancel</Link>
				</Button>
			</div>
		</form>
	);
}
