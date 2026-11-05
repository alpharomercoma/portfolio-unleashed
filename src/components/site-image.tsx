import Image, { type ImageProps } from "next/image";

import { canOptimize } from "@/lib/assets";

// `next/image` for anything that comes from a store. Stored values may point at any
// host, and the optimizer throws at render time on one it doesn't know, which would
// take the whole page down. Those are served as they are instead.
export function SiteImage({
	src,
	alt,
	...props
}: ImageProps & { src: string }) {
	return (
		<Image src={src} alt={alt} unoptimized={!canOptimize(src)} {...props} />
	);
}
