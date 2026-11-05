import { slug } from "@/lib/utils";
import { VscLink } from "react-icons/vsc";
import type {
	PortableTextBlock,
	PortableTextComponentProps,
} from "next-sanity";

export default function AnchoredHeading({
	as: Tag,
	children,
	value,
}: {
	as: React.ElementType;
} & PortableTextComponentProps<PortableTextBlock>) {
	const id = slug(value.children.reduce((acc, { text }) => acc + text, ""));

	return (
		<Tag id={id} className="group">
			{children}

			<a
				className="ml-2 !no-underline opacity-0 focus:opacity-100 group-hover:opacity-100 group-target:opacity-100"
				href={`#${id}`}
				aria-label="Link to this section"
			>
				<VscLink
					className="inline-block align-baseline text-[smaller]"
					aria-hidden
				/>
			</a>
		</Tag>
	);
}
