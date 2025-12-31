type TableRow = {
	_type: string;
	_key: string;
	cells: string[];
};

type TableValue = {
	_type: string;
	rows?: TableRow[];
};

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
									{cell}
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
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
