import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CalendarModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			requestAnimationFrame(() => {
				requestAnimationFrame(() => setShowContent(true));
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
			if (e.key === "Escape" && isOpen) handleClose();
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen]);

	if (!isOpen) return null;

	// Render in a portal so it isn't trapped under parent stacking contexts (e.g. navbar z-index).
	return createPortal(
		<div className="fixed inset-0 z-9999">
			<div
				className={`fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
					showContent ? "opacity-100" : "opacity-0"
				}`}
				onClick={handleClose}
			/>

			<div
				className={`fixed top-4 left-4 right-4 z-10 flex items-center justify-between transition-all duration-300 ${
					showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
				}`}
			>
				<div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-xl">
					<span className="font-semibold text-gray-900 text-sm sm:text-base">
						Book an appointment
					</span>
				</div>
				<Button
					variant="outline"
					size="icon"
					className="h-10 w-10 rounded-full bg-white shadow-xl border-0"
					onClick={handleClose}
					aria-label="Close booking modal"
				>
					<X className="h-5 w-5" />
				</Button>
			</div>

			<div
				className={`fixed inset-0 flex items-center justify-center p-4 sm:p-8 pt-20 pb-4 transition-all duration-500 ${
					showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"
				}`}
			>
				<div
					className="w-full h-full max-w-[1000px] bg-white shadow-2xl rounded-lg overflow-hidden"
					style={{ maxHeight: "calc(100vh - 100px)" }}
					onClick={(e) => e.stopPropagation()}
				>
					<iframe
						title="Google Calendar Appointment Scheduling"
						src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ30FwNt-TOS_CvDfH860NacWYekx4QjEz9bhS1lt6DFVMssfagz7PO6xrPp94daAK_dw3nQEg1D?gv=true"
						style={{ border: 0 }}
						width="100%"
						height="100%"
						loading="lazy"
					/>
				</div>
			</div>
		</div>,
		document.body,
	);
}
