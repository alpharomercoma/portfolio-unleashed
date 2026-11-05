// A small model of Next's data cache: unstable_cache memoizes by key parts
// until one of its tags is revalidated, so tests see the same stale-read
// behaviour production does. Invalidations are recorded for assertions.
export const invalidated: { tags: string[]; paths: string[] } = {
	tags: [],
	paths: [],
};

const entries = new Map<string, { tags: string[]; value: Promise<unknown> }>();

export function resetCache(): void {
	entries.clear();
	invalidated.tags.length = 0;
	invalidated.paths.length = 0;
}

export function unstable_cache<
	T extends (...args: never[]) => Promise<unknown>,
>(fn: T, keyParts: string[] = [], opts: { tags?: string[] } = {}): T {
	return (async (...args: Parameters<T>) => {
		const key = JSON.stringify([keyParts, args]);
		const hit = entries.get(key);
		if (hit) return hit.value;
		const value = fn(...args);
		entries.set(key, { tags: opts.tags ?? [], value });
		value.catch(() => entries.delete(key));
		return value;
	}) as T;
}

function expireTag(tag: string) {
	invalidated.tags.push(tag);
	for (const [key, entry] of entries) {
		if (entry.tags.includes(tag)) entries.delete(key);
	}
}

export function revalidateTag(tag: string): void {
	expireTag(tag);
}

export function updateTag(tag: string): void {
	expireTag(tag);
}

export function revalidatePath(path: string): void {
	invalidated.paths.push(path);
}
