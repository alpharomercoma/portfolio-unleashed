"use client";

import moduleProps from "./moduleProps";
import { stegaClean } from "next-sanity";
import { useEffect, useRef } from "react";

export default function CustomHTML({
	className,
	html,
	...props
}: Partial<
	{
		className: string;
		html: {
			code: string;
		};
	} & Sanity.Module
>) {
	const ref = useRef<HTMLElement>(null);

	if (!html?.code) return null;

	// if no <script> tag, render as is

	if (!html.code.includes("<script"))
		return (
			<section
				className={stegaClean(className)}
				dangerouslySetInnerHTML={{ __html: stegaClean(html.code) }}
				{...moduleProps(props)}
			/>
		);

	// if includes <script> tag, ensure script is re-run on each render

	// eslint-disable-next-line react-hooks/rules-of-hooks
	useEffect(() => {
		const section = ref.current;
		if (!section) return;
		section.appendChild(
			document.createRange().createContextualFragment(stegaClean(html.code)),
		);
		return () => section.replaceChildren();
	}, [html.code]);

	return (
		<section
			ref={ref}
			className={stegaClean(className)}
			{...moduleProps(props)}
		/>
	);
}
