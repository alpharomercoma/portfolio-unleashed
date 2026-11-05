export type BarRow = {
	label: string;
	/** The number the bar is scaled by. */
	value: number;
	/** What is printed beside the bar; the bar itself is decoration. */
	display: string;
	/** The text after the number ("ms", "%"); rows are only comparable if it matches. */
	unit?: string;
	highlight?: boolean;
};

// One plain quantity, optionally marked approximate: "5,852 ms", "~157 jobs/min",
// ".5 s". Anchored, so "-3%" or "$3" can't lose a prefix and draw a different bar.
const QUANTITY = /^[~≈]?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)(.*)$/;

/** "Label = 92%" (a leading * marks the highlighted row) into a chart row. */
export function parseBar(entry: string): BarRow | null {
	const trimmed = entry.trim();
	const highlight = trimmed.startsWith("*");
	const body = highlight ? trimmed.slice(1) : trimmed;
	const at = body.lastIndexOf(" = ");
	if (at < 1) return null;
	const label = body.slice(0, at).trim();
	const display = body.slice(at + 3).trim();
	const match = QUANTITY.exec(display);
	if (!label || !match) return null;
	const unit = match[2].trim().toLowerCase();
	// A second number means a range or a typo ("1 to 3 ms", "1.2.3"), not one value.
	if (/\d/.test(unit)) return null;
	const value = Number(match[1].replaceAll(",", ""));
	if (!Number.isFinite(value)) return null;
	return {
		label,
		display,
		value,
		unit,
		highlight,
	};
}

/**
 * Chart rows for one study. Bars share a scale, so "900 ms" beside "1.2 s" would
 * draw the slower one shorter: rows in different units get no chart at all.
 */
export function chartRows(entries: string[]): BarRow[] {
	const rows = entries.flatMap((e) => {
		const row = parseBar(e);
		return row ? [row] : [];
	});
	return new Set(rows.map((r) => r.unit)).size > 1 ? [] : rows;
}

/** Whether every row will actually be drawn. Writers check this; readers drop bad rows. */
export function isChartable(entries: string[]): boolean {
	return chartRows(entries).length === entries.length;
}
