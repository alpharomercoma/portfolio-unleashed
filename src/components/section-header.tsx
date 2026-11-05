// A section opens the way the labs' sections do: a short title ending in a full
// stop, at most one short sentence, and at most one action on the right.
export function SectionHeader({
	title,
	children,
	action,
	id,
}: {
	title: string;
	children?: React.ReactNode;
	action?: React.ReactNode;
	id?: string;
}) {
	return (
		<div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<h2 id={id} className="display-lg">
					{title}
				</h2>
				{children && <p className="lede mt-3">{children}</p>}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
