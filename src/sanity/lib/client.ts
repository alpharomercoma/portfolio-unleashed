import { createClient } from "next-sanity";

import { studioUrl } from "@/sanity/lib/api";

export const client = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
	apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!,
	useCdn: true,
	perspective: "published",
	stega: {
		studioUrl,
		logger: console,
		filter: (props) => {
			if (props.sourcePath.at(-1) === "title") {
				return true;
			}

			return props.filterDefault(props);
		},
	},
});
