import { ReactNode } from "react";

type TableRow = {
	_type: string;
	_key: string;
	cells: string[];
};

type TableValue = {
	_type: string;
	rows?: TableRow[];
};

/**
 * Parses markdown-style links [text](url) into React anchor elements.
 * Returns an array of strings and anchor elements.
 */
function parseLinks(text: string): ReactNode[] {
	const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
	const parts: ReactNode[] = [];
	let lastIndex = 0;
	let match;

	while ((match = linkRegex.exec(text)) !== null) {
		// Add text before the link
		if (match.index > lastIndex) {
			parts.push(text.slice(lastIndex, match.index));
		}

		// Add the link as a React element
		const [, linkText, url] = match;
		parts.push(
			<a
				key={`link-${match.index}`}
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="text-blue-600 underline hover:text-blue-800"
			>
				{linkText}
			</a>,
		);

		lastIndex = match.index + match[0].length;
	}

	// Add remaining text after last link
	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}

	return parts.length > 0 ? parts : [text];
}

/**
 * Parses cell content supporting:
 * - Newlines (both literal \n and actual newlines)
 * - Bullet points (lines starting with "- ")
 * - Markdown links [text](url)
 */
function parseCell(content: string): ReactNode {
	if (!content) return null;

	// Normalize newlines: handle both literal "\n" string and actual newlines
	const normalizedContent = content
		.replace(/\\n/g, "\n")
		.replace(/\r\n/g, "\n");

	const lines = normalizedContent.split("\n").filter((line) => line.trim());

	if (lines.length === 0) return null;

	// Check if any line is a bullet point
	const hasBullets = lines.some((line) => line.trim().startsWith("- "));

	if (hasBullets) {
		// Separate bullet items from regular text
		const bulletItems: ReactNode[] = [];
		const regularLines: ReactNode[] = [];

		lines.forEach((line, index) => {
			const trimmed = line.trim();
			if (trimmed.startsWith("- ")) {
				const itemContent = trimmed.slice(2);
				bulletItems.push(
					<li key={`bullet-${index}`}>{parseLinks(itemContent)}</li>,
				);
			} else if (trimmed) {
				regularLines.push(
					<span key={`line-${index}`}>
						{parseLinks(trimmed)}
						{index < lines.length - 1 && <br />}
					</span>,
				);
			}
		});

		return (
			<>
				{regularLines.length > 0 && <div className="mb-1">{regularLines}</div>}
				{bulletItems.length > 0 && (
					<ul className="list-disc pl-4 space-y-0.5">{bulletItems}</ul>
				)}
			</>
		);
	}

	// No bullets - just handle multi-line text with links
	if (lines.length === 1) {
		return <>{parseLinks(lines[0])}</>;
	}

	return (
		<>
			{lines.map((line, index) => (
				<span key={`line-${index}`}>
					{parseLinks(line)}
					{index < lines.length - 1 && <br />}
				</span>
			))}
		</>
	);
}

export default function Table({ value }: { value?: TableValue }) {
	if (!value?.rows?.length) return null;

	const [headerRow, ...bodyRows] = value.rows;

	return (
		<div className="my-6 overflow-x-auto">
			<table className="w-full border-collapse text-left text-sm">
				{headerRow && (
					<thead>
						<tr className="border-b-2 border-gray-300 bg-gray-50">
							{headerRow.cells.map((cell, cellIndex) => (
								<th
									key={cellIndex}
									className="px-4 py-3 font-semibold text-gray-900"
								>
									{parseCell(cell)}
								</th>
							))}
						</tr>
					</thead>
				)}
				<tbody>
					{bodyRows.map((row) => (
						<tr
							key={row._key}
							className="border-b border-gray-200 hover:bg-gray-50"
						>
							{row.cells.map((cell, cellIndex) => (
								<td key={cellIndex} className="px-4 py-3 text-gray-700">
									{parseCell(cell)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
