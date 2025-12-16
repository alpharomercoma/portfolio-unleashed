"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ResumeModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const RESUME_URL = "https://flowcv.com/resume/p5r0itrtfm";

export function ResumeModal({ isOpen, onClose }: ResumeModalProps) {
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setShowContent(true);
				});
			});
		} else {
			setShowContent(false);
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	const handleClose = () => {
		setShowContent(false);
		setTimeout(() => onClose(), 300);
	};

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				handleClose();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen]);

	if (!isOpen) return null;

	// Render in a portal so it isn't trapped under parent stacking contexts (e.g. navbar z-index).
	return createPortal(
		<div
			className="fixed inset-0 z-9999"
			role="dialog"
			aria-modal="true"
			aria-label="Resume viewer"
		>
			{/* Dimmed blur background - covers entire screen */}
			<div
				className={`fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
					showContent ? "opacity-100" : "opacity-0"
				}`}
				onClick={handleClose}
			/>

			{/* Floating controls - fixed position */}
			<div
				className={`fixed left-3 right-3 sm:left-4 sm:right-4 z-10 flex items-center justify-between transition-all duration-300 ${
					showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
				}`}
				style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
			>
				<div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-full shadow-xl">
					<FileText className="h-5 w-5 text-blue" />
					<span className="font-semibold text-gray-900 text-sm sm:text-base">
						<span className="sm:hidden">Resume</span>
						<span className="hidden sm:inline">Alpha Romer Coma - Resume</span>
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-10 rounded-full bg-white shadow-xl gap-2 text-sm font-medium border-0"
						asChild
					>
						<a href={RESUME_URL} target="_blank" rel="noreferrer">
							<ExternalLink className="h-4 w-4" />
							<span className="hidden sm:inline">Open</span>
						</a>
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="h-10 w-10 rounded-full bg-white shadow-xl border-0"
						onClick={handleClose}
						aria-label="Close resume viewer"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>
			</div>

			{/* Fullscreen iframe viewer */}
			<div
				className={`fixed inset-0 flex items-center justify-center p-0 sm:p-6 transition-all duration-500 ${
					showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"
				}`}
				style={{
					paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.5rem)",
					paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
					paddingLeft: "calc(env(safe-area-inset-left, 0px) + 0px)",
					paddingRight: "calc(env(safe-area-inset-right, 0px) + 0px)",
				}}
				onClick={handleClose}
			>
				<div
					className="w-full h-full max-w-none sm:max-w-[1100px] bg-white sm:shadow-2xl shadow-none sm:rounded-lg rounded-none overflow-hidden"
					style={{ maxHeight: "100dvh" }}
					onClick={(e) => e.stopPropagation()}
				>
					<iframe
						title="Alpha Romer Coma - Resume (FlowCV)"
						src={RESUME_URL}
						className="h-full w-full"
						style={{ border: 0 }}
						loading="lazy"
					/>
				</div>
			</div>
		</div>,
		document.body,
	);
}

export function ResumeButton({ className }: { className?: string }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				variant="outline"
				size="lg"
				className={`rounded-full border-border hover:bg-secondary h-11 px-6 bg-transparent gap-2 ${className ?? ""}`}
				onClick={() => setIsOpen(true)}
			>
				<FileText className="h-4 w-4" />
				View Resume
			</Button>
			<ResumeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</>
	);
}
