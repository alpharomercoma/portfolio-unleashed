import cn from "classnames";
import Link from "next/link";
import ContentfulImage from "./contentful-image";
type Props = {
	title: string;
	src: string;
	slug?: string;
};

const CoverImage = ({ title, src, slug }: Props) => {
	const image = (
		<ContentfulImage
			alt={`Cover Image for ${title}`}
			priority
			width={2000}
			height={1000}
			className={cn("shadow-small max-w-full", {
				"hover:shadow-medium max-w-full transition-shadow duration-200": slug,
			})}
			src={src}
		/>
	);
	return (
		<div className="sm:mx-0">
			{slug ? (
				<Link href={`/blog/${slug}`} aria-label={title}>
					{image}
				</Link>
			) : (
				image
			)}
		</div>
	);
};

export default CoverImage;
