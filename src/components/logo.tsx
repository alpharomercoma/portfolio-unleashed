// Brand mark: a neon-lime tile with a bold lambda in Nebius's dark navy (a "shade
// of black", not pure #000) — a reframed "alpha" / ML λ. Single source of truth:
// the favicon (src/app/icon.svg) and the generated PWA/Apple icons share this.
export const LOGO_LIME = "#e0ff4f";
// Nebius's signature dark (their wordmark color), a desaturated navy-black.
export const LOGO_DARK = "#052b42";
// The filled lambda, in a 0 0 64 64 viewBox.
export const LOGO_MARK_PATH = "M32 14 L49 51 L41 51 L32 35 L23 51 L15 51 Z";

export function Logo({
	size = 28,
	rounded = true,
	tile = LOGO_LIME,
	mark = LOGO_DARK,
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
