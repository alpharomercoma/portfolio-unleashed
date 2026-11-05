"use client";

import { Check, ImageIcon, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { downscaleImage } from "@/lib/downscale-image";

type MediaImage = {
	url: string;
	pathname: string;
	size: number;
	uploadedAt: string;
};

// Image field backed by the Blob media library. Opens a modal to upload, browse,
// select, and delete images. Two modes:
//   • uncontrolled + `name` → stores the URL in a hidden input the form submits.
//   • controlled `value`/`onChange` (no `name`) → caller owns the value (used by
//     the talk events editor, which serializes logos into its own JSON payload).
export function ImagePicker({
	name,
	defaultValue = "",
	value: controlledValue,
	onChange,
}: {
	name?: string;
	defaultValue?: string;
	value?: string;
	onChange?: (url: string) => void;
}) {
	const [internal, setInternal] = useState(defaultValue);
	const value = controlledValue ?? internal;
	const setValue = (v: string) => {
		if (onChange) onChange(v);
		else setInternal(v);
	};
	const [open, setOpen] = useState(false);

	return (
		<div>
			{name && <input type="hidden" name={name} value={value} />}
			<div className="flex items-center gap-3">
				<div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary grid place-items-center">
					{value ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={value} alt="" className="size-full object-cover" />
					) : (
						<ImageIcon className="size-5 text-muted-foreground" />
					)}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setOpen(true)}
				>
					{value ? "Change image" : "Choose image"}
				</Button>
				{value && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setValue("")}
					>
						Clear
					</Button>
				)}
			</div>
			{open && (
				<PickerModal
					current={value}
					onClose={() => setOpen(false)}
					onSelect={(url) => {
						setValue(url);
						setOpen(false);
					}}
				/>
			)}
		</div>
	);
}

/** A readable name for a stored image, without the blob store's random suffix. */
function imageName(url: string): string {
	const file = decodeURIComponent(url.split("/").pop() ?? "image");
	return file.replace(/-[A-Za-z0-9]{20,}(\.\w+)$/, "$1");
}

async function fetchMedia(): Promise<MediaImage[]> {
	const res = await fetch("/api/admin/media");
	const data = await res.json();
	if (!res.ok) throw new Error(data.error || "Failed to load images");
	return data.images || [];
}

function PickerModal({
	current,
	onClose,
	onSelect,
}: {
	current: string;
	onClose: () => void;
	onSelect: (url: string) => void;
}) {
	const titleId = useId();
	const [images, setImages] = useState<MediaImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [uploaded, setUploaded] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selected, setSelected] = useState(current);
	const fileRef = useRef<HTMLInputElement>(null);
	const dialog = useRef<HTMLDialogElement | null>(null);
	// Closing through the dialog returns focus to the button that opened it; simply
	// unmounting an open dialog wouldn't.
	const dismiss = () => dialog.current?.close();

	// State changes only once the request settles; `loading` already starts true.
	const settle = useCallback(
		(request: Promise<MediaImage[]>) =>
			request
				.then(setImages)
				.catch((e: Error) => setError(e.message))
				.finally(() => setLoading(false)),
		[],
	);

	useEffect(() => {
		void settle(fetchMedia());
	}, [settle]);

	const reload = useCallback(async () => {
		setLoading(true);
		await settle(fetchMedia());
	}, [settle]);

	async function upload(file: File) {
		setUploading(true);
		setUploaded(false);
		setError(null);
		try {
			// Shrink large images client-side; oversized requests are rejected by the
			// platform (HTTP 413) before they ever reach the upload route.
			const prepared = await downscaleImage(file);
			const fd = new FormData();
			fd.append("file", prepared);
			fd.append("folder", "media");
			const res = await fetch("/api/admin/upload", {
				method: "POST",
				body: fd,
			});
			if (!res.ok) {
				// 413 and other platform errors return HTML, not JSON — read defensively.
				const msg =
					res.status === 413
						? "Image is too large. Please use a smaller file."
						: await res
								.json()
								.then((d) => d.error)
								.catch(() => null);
				throw new Error(msg || "Upload failed. Please try again.");
			}
			const data = await res.json().catch(() => ({}));
			if (!data.url) throw new Error("Upload failed. Please try again.");
			await reload();
			setSelected(data.url);
			setUploaded(true);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setUploading(false);
		}
	}

	async function remove(url: string) {
		if (
			!window.confirm(
				"Delete this image from the library? This cannot be undone.",
			)
		)
			return;
		setError(null);
		try {
			const res = await fetch("/api/admin/media", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url }),
			});
			if (!res.ok) {
				const d = await res.json();
				throw new Error(d.error || "Delete failed");
			}
			if (selected === url) setSelected("");
			await reload();
		} catch (e) {
			setError((e as Error).message);
		}
	}

	if (typeof document === "undefined") return null;

	return createPortal(
		// A native modal dialog: focus stays inside and returns to the opener when it
		// closes. The ref opens it as soon as it mounts.
		<dialog
			ref={(d) => {
				dialog.current = d;
				if (d && !d.open) d.showModal();
			}}
			aria-labelledby={titleId}
			onClose={onClose}
			onClick={(e) => {
				if (e.target === e.currentTarget) dismiss();
			}}
			className="m-0 h-dvh max-h-none w-screen max-w-none place-items-center bg-ink/70 p-4 text-foreground open:grid [--focus:var(--brand-strong)]"
		>
			<div
				className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-background shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
					<h2
						id={titleId}
						className="font-display text-lg font-semibold tracking-tight"
					>
						Image library
					</h2>
					<button
						type="button"
						onClick={dismiss}
						aria-label="Close"
						className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
					>
						<X className="size-5" />
					</button>
				</header>

				<div className="border-b border-border px-5 py-4">
					<input
						ref={fileRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) void upload(f);
							e.target.value = "";
						}}
					/>
					<div
						onDragOver={(e) => e.preventDefault()}
						onDrop={(e) => {
							e.preventDefault();
							const f = Array.from(e.dataTransfer.files).find((x) =>
								x.type.startsWith("image/"),
							);
							if (f) void upload(f);
						}}
						className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground"
					>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fileRef.current?.click()}
							disabled={uploading}
						>
							<Upload className="size-4" />
							{uploading ? "Uploading…" : "Upload image"}
						</Button>
						<span>or drag and drop</span>
					</div>
					{error && (
						<p role="alert" className="mt-2 text-sm text-destructive">
							{error}
						</p>
					)}
					{/* Stays mounted, so a screen reader hears each change. */}
					<p role="status" className="sr-only">
						{uploading
							? "Uploading image"
							: loading
								? "Loading images"
								: uploaded
									? "Image uploaded"
									: ""}
					</p>
				</div>

				<div className="flex-1 overflow-y-auto p-5">
					{loading ? (
						<p className="text-sm text-muted-foreground">Loading…</p>
					) : images.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No images yet. Upload one to get started.
						</p>
					) : (
						<div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
							{images.map((img) => {
								const on = selected === img.url;
								const name = imageName(img.url);
								return (
									<div
										key={img.url}
										className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-secondary transition-colors ${
											on ? "border-brand" : "border-border"
										}`}
									>
										<button
											type="button"
											onClick={() => setSelected(img.url)}
											className="absolute inset-0"
											aria-label={`Select ${name}`}
											aria-pressed={on}
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={img.url}
												alt=""
												className="size-full object-contain p-2"
											/>
										</button>
										{on && (
											<span className="absolute left-1.5 top-1.5 rounded-full bg-brand p-0.5 text-white">
												<Check className="size-3.5" />
											</span>
										)}
										<button
											type="button"
											onClick={() => remove(img.url)}
											aria-label={`Delete ${name}`}
											className="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-full bg-background"
										>
											<Trash2 className="size-3.5 text-destructive" />
										</button>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => {
							onSelect("");
							dismiss();
						}}
					>
						Clear selection
					</Button>
					<div className="flex items-center gap-2">
						<Button type="button" variant="outline" size="sm" onClick={dismiss}>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={!selected}
							onClick={() => {
								onSelect(selected);
								dismiss();
							}}
						>
							Use image
						</Button>
					</div>
				</footer>
			</div>
		</dialog>,
		document.body,
	);
}
