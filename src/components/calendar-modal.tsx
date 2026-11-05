"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";

// A native modal dialog: the browser supplies the focus trap, Escape, the inert
// background, and returning focus to the button that opened it.
export function CalendarModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (isOpen && !dialog.open) dialog.showModal();
		if (!isOpen && dialog.open) dialog.close();
	}, [isOpen]);

	return (
		<dialog
			ref={ref}
			aria-labelledby={titleId}
			onClose={onClose}
			// A click on the backdrop lands on the dialog element itself.
			onClick={(e) => {
				if (e.target === e.currentTarget) e.currentTarget.close();
			}}
			className="m-auto h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-[1.5rem] bg-white p-0 text-foreground [--focus:var(--brand-strong)] backdrop:bg-ink/70"
		>
			{isOpen && (
				<div className="flex h-full flex-col">
					<div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
						<h2 id={titleId} className="display-sm">
							Book a call
						</h2>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close"
							onClick={() => ref.current?.close()}
						>
							<X aria-hidden />
						</Button>
					</div>
					<iframe
						title="Google Calendar appointment booking"
						src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ30FwNt-TOS_CvDfH860NacWYekx4QjEz9bhS1lt6DFVMssfagz7PO6xrPp94daAK_dw3nQEg1D?gv=true"
						className="w-full flex-1 border-0"
					/>
				</div>
			)}
		</dialog>
	);
}
