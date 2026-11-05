import type { BarRow } from "@/lib/chart-rows";
import { cn } from "@/lib/utils";

export { chartRows, parseBar, type BarRow } from "@/lib/chart-rows";

// Horizontal bars for a data panel or a white card. Every value is printed, so
// the bars never carry information alone, and colour marks the one row that the
// finding is about (with heavier text, so it survives without colour).
export function BarRows({
	rows,
	tone = "deep",
	className,
}: {
	rows: BarRow[];
	tone?: "deep" | "light";
	className?: string;
}) {
	const max = Math.max(...rows.map((r) => r.value), 1);
	return (
		<ul className={cn("space-y-2 text-sm", className)}>
			{rows.map((row) => (
				<li key={row.label}>
					<span
						className={cn(
							"flex items-baseline justify-between gap-4",
							tone === "deep" ? "text-on-deep" : "text-muted-foreground",
							row.highlight &&
								(tone === "deep"
									? "font-semibold text-white"
									: "font-semibold text-foreground"),
						)}
					>
						<span>{row.label}</span>
						<span className="whitespace-nowrap tabular-nums">
							{row.display}
						</span>
					</span>
					<span
						aria-hidden
						className={cn(
							"bar-draw mt-1.5 block h-1.5 min-w-1 rounded-full",
							row.highlight
								? tone === "deep"
									? "bg-white"
									: "bg-brand"
								: tone === "deep"
									? "bg-bar"
									: "bg-bar-light",
						)}
						style={{ width: `${(row.value / max) * 100}%` }}
					/>
				</li>
			))}
		</ul>
	);
}

export type ColumnDatum = { label: string; value: number; highlight?: boolean };

// Vertical bars, one per year. Labels and values are real text in reading order.
export function Columns({
	data,
	tone = "deep",
	fill = false,
	className,
}: {
	data: ColumnDatum[];
	tone?: "deep" | "light";
	/** Grow to the height of the parent instead of a fixed one. */
	fill?: boolean;
	className?: string;
}) {
	const max = Math.max(...data.map((d) => d.value), 1);
	return (
		<ul
			className={cn(
				"flex gap-3",
				fill ? "flex-1 items-stretch" : "items-end",
				className,
			)}
		>
			{data.map((d) => (
				<li key={d.label} className="flex min-w-0 flex-1 flex-col">
					{/* The room on top is for the tallest column's number. */}
					<span
						className={cn(
							"relative mt-6 block",
							fill ? "min-h-20 flex-1" : "h-20",
						)}
					>
						<span
							className="absolute inset-x-0 bottom-0 block"
							style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
						>
							<span
								className={cn(
									"absolute inset-x-0 bottom-full mb-1 text-center text-sm font-medium tabular-nums",
									tone === "deep" ? "text-white" : "text-foreground",
								)}
							>
								{d.value}
							</span>
							<span
								aria-hidden
								className={cn(
									"column-draw block h-full w-full rounded-t-[0.25rem]",
									d.highlight
										? tone === "deep"
											? "bg-white"
											: "bg-brand"
										: tone === "deep"
											? "bg-bar"
											: "bg-bar-light",
								)}
							/>
						</span>
					</span>
					<span
						className={cn(
							"mt-1.5 text-center text-xs tabular-nums",
							tone === "deep" ? "text-on-deep" : "text-muted-foreground",
						)}
					>
						{d.label}
					</span>
				</li>
			))}
		</ul>
	);
}
