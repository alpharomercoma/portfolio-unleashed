import { Image } from "next-sanity/image";

import { cn } from "@/lib/utils";
import { urlForImage } from "@/sanity/lib/utils";

interface CoverImageProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	image: any;
	priority?: boolean;
	className?: string;
}

export default function CoverImage(props: CoverImageProps) {
	const { image: source, priority, className } = props;
	return source?.asset?._ref ? (
		<Image
			className={cn("h-auto w-full", className)}
			width={2000}
			height={1000}
			alt={source?.alt || ""}
			src={urlForImage(source)?.height(1000).width(2000).url() as string}
			sizes="(min-width: 1024px) 64rem, 100vw"
			priority={priority}
		/>
	) : (
		<div className="aspect-[2/1] bg-secondary" />
	);
}
