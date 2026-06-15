"use client";

import { Check, ImageIcon, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

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

function PickerModal({
	current,
	onClose,
	onSelect,
}: {
	current: string;
	onClose: () => void;
	onSelect: (url: string) => void;
}) {
	const [images, setImages] = useState<MediaImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selected, setSelected] = useState(current);
	const fileRef = useRef<HTMLInputElement>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/media");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to load images");
			setImages(data.images || []);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = "";
		};
	}, [onClose]);

	async function upload(file: File) {
		setUploading(true);
		setError(null);
		try {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("folder", "media");
			const res = await fetch("/api/admin/upload", {
				method: "POST",
				body: fd,
			});
			const data = await res.json();
			if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
			await load();
			setSelected(data.url);
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
			await load();
		} catch (e) {
			setError((e as Error).message);
		}
	}

	if (typeof document === "undefined") return null;

	return createPortal(
		<div
			className="fixed inset-0 z-[100] grid place-items-center bg-ink/70 p-4"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-label="Image library"
		>
			<div
				className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-background shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
					<h2 className="font-display text-lg font-semibold tracking-tight">
						Image library
					</h2>
					<button
						type="button"
						onClick={onClose}
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
					{error && <p className="mt-2 text-sm text-destructive">{error}</p>}
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
								return (
									<div
										key={img.url}
										className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-secondary transition-colors ${
											on ? "border-lime" : "border-border"
										}`}
									>
										<button
											type="button"
											onClick={() => setSelected(img.url)}
											className="absolute inset-0"
											aria-label="Select image"
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={img.url}
												alt=""
												className="size-full object-contain p-2"
											/>
										</button>
										{on && (
											<span className="absolute left-1.5 top-1.5 rounded-full bg-lime p-0.5 text-ink">
												<Check className="size-3.5" />
											</span>
										)}
										<button
											type="button"
											onClick={() => remove(img.url)}
											aria-label="Delete image"
											className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
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
						onClick={() => onSelect("")}
					>
						Clear selection
					</Button>
					<div className="flex items-center gap-2">
						<Button type="button" variant="outline" size="sm" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={!selected}
							onClick={() => onSelect(selected)}
						>
							Use image
						</Button>
					</div>
				</footer>
			</div>
		</div>,
		document.body,
	);
}
