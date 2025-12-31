import { PortableText } from "next-sanity";
import AnchoredHeading from "./AnchoredHeading";
import Image from "./Image";
import Code from "./Code";
import CustomHTML from "./CustomHTML";
import Table from "./Table";
import { cn } from "@/lib/utils";
import styles from "../../app/_components/markdown-styles.module.css";

export default function Content({
	value,
	className,
	children,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: { value: any } & React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"richtext mx-auto w-full space-y-[1em] [&>:first-child]:!mt-0",
				className,
				styles.richtext,
			)}
		>
			<PortableText
				value={value}
				components={{
					block: {
						h2: (node) => <AnchoredHeading as="h2" {...node} />,
						h3: (node) => <AnchoredHeading as="h3" {...node} />,
						h4: (node) => <AnchoredHeading as="h4" {...node} />,
						h5: (node) => <AnchoredHeading as="h5" {...node} />,
						h6: (node) => <AnchoredHeading as="h6" {...node} />,
						blockquote: ({ children }) => (
							<blockquote className="border-l-2 pl-4">
								<p>{children}</p>
							</blockquote>
						),
					},
					list: {
						bullet: ({ children }) => (
							<ul className="list-disc pl-4">{children}</ul>
						),
						number: ({ children }) => (
							<ol className="list-decimal pl-4">{children}</ol>
						),
					},
					types: {
						image: Image,
						code: Code,
						table: Table,
						sizeChart: Table,
						"custom-html": ({ value }) => (
							<CustomHTML
								className="has-[table]:md:mx-auto has-[table]:md:[grid-column:bleed]"
								{...value}
							/>
						),
					},
				}}
			/>

			{children}
		</div>
	);
}
