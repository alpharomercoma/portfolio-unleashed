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

/**
 * A revision number from a form field, or undefined when absent/blank (legacy
 * forms, seed-only content). Anything else that is not a non-negative integer
 * becomes -1 so the write is rejected rather than silently unchecked.
 */
export function parseRev(value: unknown): number | undefined {
	const raw = String(value ?? "").trim();
	if (!raw) return undefined;
	return /^\d{1,15}$/.test(raw) ? Number(raw) : -1;
}

/**
 * Write preconditions for an admin edit form: the save must find the record at
 * the revision the form was opened at. That covers seed-only content too (an
 * unstored record is revision 0, or its last revision if it was deleted), and
 * since revisions never go back, it also catches deletes in between. Only
 * forms rendered without a store (no Redis) carry no revision.
 */
export function editPreconditions(formData: FormData): {
	expectedRev?: number;
} {
	const expectedRev = parseRev(formData.get("rev"));
	return expectedRev === undefined ? {} : { expectedRev };
}

/**
 * The first sentence of stored copy, for places with room for one line. Skips
 * abbreviations like "U.S." by requiring two lowercase letters or digits before
 * the stop and a capital after it.
 */
export function firstSentence(text: string): string {
	const trimmed = text.trim();
	const m = /^[\s\S]*?[a-z0-9)]{2}[.!?](?=\s+[A-Z])/.exec(trimmed);
	return m ? m[0] : trimmed;
}
