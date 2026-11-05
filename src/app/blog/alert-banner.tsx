"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";

import { disableDraftMode } from "./actions";

const emptySubscribe = () => () => {};

export default function AlertBanner() {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	const shouldShow = useSyncExternalStore(
		emptySubscribe,
		() => window.top === window,
		() => false,
	);

	if (!shouldShow) return null;

	return (
		<div
			className={`${
				pending ? "animate-pulse" : ""
			} w-full border-b bg-background text-foreground`}
		>
			<div className="py-2 text-center text-sm">
				{pending ? (
					"Disabling draft mode..."
				) : (
					<>
						{"Previewing drafts. "}
						<button
							type="button"
							onClick={() =>
								startTransition(() =>
									disableDraftMode().then(() => {
										router.refresh();
									}),
								)
							}
							className="text-link"
						>
							Back to published
						</button>
					</>
				)}
			</div>
		</div>
	);
}
