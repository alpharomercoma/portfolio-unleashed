"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import "@uiw/react-md-editor/markdown-editor.css";

import { saveAboutAction } from "@/app/admin/about-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { About } from "@/lib/about/schema";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function AboutForm({
	about,
	error,
	saved,
}: {
	about: About;
	error?: string;
	saved?: boolean;
}) {
	const [title, setTitle] = useState(about.title);
	const [body, setBody] = useState(about.body);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const wrapRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	function insertAtCursor(text: string) {
		const ta = wrapRef.current?.querySelector("textarea");
		if (ta) {
			const start = ta.selectionStart ?? body.length;
			const end = ta.selectionEnd ?? body.length;
			const next = body.slice(0, start) + text + body.slice(end);
			setBody(next);
			requestAnimationFrame(() => {
				ta.focus();
				const caret = start + text.length;
				ta.setSelectionRange(caret, caret);
			});
		} else {
			setBody((b) => b + text);
		}
	}

	async function uploadFile(file: File) {
		setUploading(true);
		setUploadError(null);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/admin/upload", {
				method: "POST",
				body: fd,
			});
			const data = (await res.json()) as { url?: string; error?: string };
			if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
			const alt = file.name.replace(/\.[^.]+$/, "");
			insertAtCursor(`\n\n![${alt}](${data.url})\n\n`);
		} catch (e) {
			setUploadError((e as Error).message);
		} finally {
			setUploading(false);
		}
	}

	function onPick(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (f) void uploadFile(f);
		e.target.value = "";
	}

	function onDrop(e: React.DragEvent<HTMLDivElement>) {
		const f = Array.from(e.dataTransfer.files).find((x) =>
			x.type.startsWith("image/"),
		);
		if (f) {
			e.preventDefault();
			void uploadFile(f);
		}
	}

	function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
		const f = Array.from(e.clipboardData.files).find((x) =>
			x.type.startsWith("image/"),
		);
		if (f) {
			e.preventDefault();
			void uploadFile(f);
		}
	}

	return (
		<form action={saveAboutAction} className="space-y-6 max-w-3xl">
			{saved && (
				<p className="rounded-lg border border-lime/50 bg-lime/15 px-4 py-3 text-sm text-foreground">
					Saved. The public About page has been updated.
				</p>
			)}
			{error && (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</p>
			)}

			<div className="space-y-2">
				<Label htmlFor="about-title">Title</Label>
				<Input
					id="about-title"
					name="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
				/>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<Label>Body (markdown)</Label>
					<div className="flex items-center gap-3">
						{uploading && (
							<span className="text-xs text-muted-foreground">Uploading…</span>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fileRef.current?.click()}
							disabled={uploading}
						>
							Upload image
						</Button>
					</div>
				</div>
				{uploadError && (
					<p className="text-sm text-destructive">{uploadError}</p>
				)}
				<input
					ref={fileRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={onPick}
				/>
				<div
					ref={wrapRef}
					onDrop={onDrop}
					onPaste={onPaste}
					data-color-mode="light"
				>
					<MDEditor
						value={body}
						onChange={(v) => setBody(v ?? "")}
						height={480}
						preview="live"
						textareaProps={{
							placeholder:
								"Write your story in markdown. Drag, paste, or upload images.",
						}}
					/>
				</div>
				<input type="hidden" name="body" value={body} />
				<p className="text-xs text-muted-foreground">
					Supports markdown (headings, bold, lists, quotes, links). Drag, paste,
					or use Upload image to add pictures.
				</p>
			</div>

			<Button type="submit">Save about page</Button>
		</form>
	);
}
