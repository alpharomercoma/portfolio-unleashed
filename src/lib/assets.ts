import { isAllowedImageHost } from "@/lib/image-hosts";

/**
 * A stored image value to a URL: absolute paths and URLs pass through, and a bare
 * file name resolves inside the given /public directory.
 */
export function assetUrl(value: string, dir: string): string {
	if (!value) return "";
	return /^(https?:|\/)/.test(value) ? value : `${dir}/${value}`;
}

/**
 * Whether the image optimizer accepts this URL. Gallery entries may point at any
 * host, and `next/image` throws at render time on one it doesn't know, so pass
 * `unoptimized={!canOptimize(src)}` wherever the host isn't guaranteed.
 */
export function canOptimize(src: string): boolean {
	if (src.startsWith("/") && !src.startsWith("//")) return true;
	try {
		const u = new URL(src);
		return u.protocol === "https:" && isAllowedImageHost(u.hostname);
	} catch {
		return false;
	}
}

/**
 * The image optimizer's URL, for an image laid out without `next/image`. Anything
 * the optimizer wouldn't accept is returned untouched. The width must be one of
 * Next's default sizes.
 */
export function optimizedImage(src: string, width: number): string {
	return canOptimize(src)
		? `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
		: src;
}
