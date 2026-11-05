// Brand mark: a filled lambda on a tile, a reframed "alpha" / ML λ. Single source
// of truth: the favicon (src/app/icon.svg) and the generated PWA/Apple icons
// share this. The default is indigo with a white mark; on the brand field pass
// `tile={LOGO_WHITE} mark={LOGO_BRAND}`.
export const LOGO_BRAND = "#5342e5";
export const LOGO_WHITE = "#ffffff";
// The filled lambda, in a 0 0 64 64 viewBox.
export const LOGO_MARK_PATH = "M32 14 L49 51 L41 51 L32 35 L23 51 L15 51 Z";

export function Logo({
	size = 28,
	rounded = true,
	tile = LOGO_BRAND,
	mark = LOGO_WHITE,
	className,
	title = "Alpha Romer Coma",
}: {
	size?: number;
	rounded?: boolean;
	tile?: string;
	mark?: string;
	className?: string;
	// Pass null when the logo sits next to a wordmark / inside a labeled link, so
	// it renders decoratively (aria-hidden) instead of double-announcing.
	title?: string | null;
}) {
	const a11y = title
		? ({ role: "img", "aria-label": title } as const)
		: ({ "aria-hidden": true } as const);
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 64 64"
			className={className}
			{...a11y}
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect width="64" height="64" rx={rounded ? 18 : 0} fill={tile} />
			<path d={LOGO_MARK_PATH} fill={mark} />
		</svg>
	);
}
