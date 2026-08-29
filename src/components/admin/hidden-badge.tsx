import { EyeOff } from "lucide-react";

// Small marker shown beside a collection item that's hidden from the public site.
// Presentational only, so it's shared by the server list and the client
// SortableList without a "use client" boundary of its own.
export function HiddenBadge() {
	return (
		<span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
			<EyeOff className="size-3" />
			Hidden
		</span>
	);
}
