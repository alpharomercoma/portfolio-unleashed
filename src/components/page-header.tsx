// The top of every inner page: the same title treatment as the labs' index pages,
// on white under the brand bar.
export function PageHeader({
	title,
	children,
	meta,
}: {
	title: string;
	children?: React.ReactNode;
	meta?: React.ReactNode;
}) {
	return (
		<header className="site-container pt-12 lg:pt-16">
			<h1 className="display-xl max-w-4xl">{title}</h1>
			{children && <p className="lede mt-5">{children}</p>}
			{meta && <div className="mt-3 text-sm text-muted-foreground">{meta}</div>}
		</header>
	);
}
