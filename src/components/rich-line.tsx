import { Fragment } from "react";

// One line of resume text: **bold** stands out and [links](url) become their label,
// so numbers carry the line. Nothing else is interpreted.
export function RichLine({ text }: { text: string }) {
	const plain = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
	const parts = plain.split("**");
	return (
		<>
			{parts.map((part, i) =>
				i % 2 === 1 ? (
					<strong key={i} className="font-semibold text-foreground">
						{part}
					</strong>
				) : (
					<Fragment key={i}>{part}</Fragment>
				),
			)}
		</>
	);
}
