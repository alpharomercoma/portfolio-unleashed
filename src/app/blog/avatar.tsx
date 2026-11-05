import { Image } from "next-sanity/image";

import type { Author } from "../../../sanity.types";
import { urlForImage } from "@/sanity/lib/utils";

interface Props {
	name: string;
	picture: Exclude<Author["picture"], undefined> | null;
}

export default function Avatar({ name, picture }: Props) {
	return (
		<div className="flex items-center gap-2.5 text-sm">
			{picture?.asset?._ref && (
				<Image
					alt=""
					className="size-9 rounded-full object-cover"
					height={36}
					width={36}
					src={
						urlForImage(picture)
							?.height(96)
							.width(96)
							.fit("crop")
							.url() as string
					}
				/>
			)}
			<span className="font-medium text-foreground">
				{picture?.asset?._ref ? name : `By ${name}`}
			</span>
		</div>
	);
}
