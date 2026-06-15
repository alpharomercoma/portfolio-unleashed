import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function count(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	arr: Array<any> | number,
	singular: string = "item",
	plural?: string,
) {
	const num = typeof arr === "number" ? arr : arr?.length || 0;
	return `${num || 0} ${num === 1 ? singular : plural || singular + "s"}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
	func: T,
	delay: number = 1000, // 1 sec
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (this: any, ...args: Parameters<T>) {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}

export function slug(str: string) {
	return str
		.toLowerCase()
		.replace(/[\s\W]+/g, "-")
		.replace(/^-+/, "")
		.replace(/-+$/, "");
}

/** Split a textarea value into trimmed, non-empty lines (one item per line). */
export function parseLines(value: unknown): string[] {
	return String(value ?? "")
		.split("\n")
		.map((s) => s.trim())
		.filter(Boolean);
}

/** Compare ISO date / year strings descending (newest first). */
export function byDateDesc(a: string, b: string): number {
	return a < b ? 1 : a > b ? -1 : 0;
}
