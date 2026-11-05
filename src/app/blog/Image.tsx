import Img from "./Img";
import { stegaClean } from "next-sanity";

export default function Image({
	value,
}: {
	value: Sanity.Image & {
		caption?: string;
		source?: string;
		float?: "left" | "right";
	};
}) {
	return (
		<figure
			className="max-lg:full-bleed !mb-4 !mt-8 space-y-2 text-center md:![grid-column:bleed]"
			style={{ float: stegaClean(value.float) }}
		>
			<Img
				className="mx-auto max-h-svh w-auto bg-secondary text-[0px]"
				image={value}
				imageWidth={1500}
			/>

			{value.caption && (
				<figcaption className="text-balance px-4 text-sm text-muted-foreground">
					{value.caption}

					{value.source && (
						<>
							{" ("}
							<a href={value.source} className="text-link">
								Source
							</a>
							{")"}
						</>
					)}
				</figcaption>
			)}
		</figure>
	);
}
