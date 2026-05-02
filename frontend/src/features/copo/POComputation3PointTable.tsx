import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface POComputation3PointTableProps {
	data: {
		rows: { co: string; values: Record<string, number | null> }[];
		averages: Record<string, number | null>;
		overall: number;
	};
}

export const POComputation3PointTable = React.memo(function POComputation3PointTable({
	data,
}: POComputation3PointTableProps) {
	const pos = [
		"PO1",
		"PO2",
		"PO3",
		"PO4",
		"PO5",
		"PO6",
		"PO7",
		"PO8",
		"PO9",
		"PO10",
		"PO11",
		"PO12",
		"PSO1",
		"PSO2",
		"PSO3",
	];

	return (
		<Card className="mt-6 border dark:border-gray-800 shadow-sm overflow-hidden">
			<CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800">
				<CardTitle className="text-xl text-gray-800 dark:text-gray-100 flex items-center justify-between">
					<span>PO &amp; PSO Attainment (3 Point Scale)</span>
					<span className="text-sm font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1 rounded-full">
						Overall: {data.overall.toFixed(2)}
					</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 overflow-auto">
				<Table>
					<TableHeader>
						<TableRow className="bg-gray-100/50 dark:bg-gray-800/50">
							<TableHead className="w-[100px] border-r dark:border-gray-800 font-bold text-gray-900 dark:text-gray-100 min-w-20">
								Course Outcome
							</TableHead>
							{pos.map((po) => (
								<TableHead
									key={po}
									className="text-center border-r font-bold text-gray-900 dark:text-gray-100 dark:border-gray-800 min-w-[60px]"
								>
									{po}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.rows.map((row) => (
							<TableRow
								key={row.co}
								className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 border-b dark:border-gray-800"
							>
								<TableCell className="font-semibold border-r dark:border-gray-800 text-gray-900 dark:text-gray-100">
									{row.co}
								</TableCell>
								{pos.map((po) => (
									<TableCell
										key={po}
										className="text-center border-r dark:border-gray-800"
									>
										{row.values[po] !== null
											? row.values[po]!.toFixed(2)
											: "-"}
									</TableCell>
								))}
							</TableRow>
						))}

						{/* Direct Attainment Average Row */}
						<TableRow className="bg-blue-50/30 dark:bg-blue-900/10 font-bold border-t-2 dark:border-t-gray-700">
							<TableCell className="border-r dark:border-gray-800 text-gray-900 dark:text-gray-100">
								AVG
							</TableCell>
							{pos.map((po) => {
								const val = data.averages[po];
								return (
									<TableCell
										key={po}
										className="text-center border-r dark:border-gray-800 text-blue-700 dark:text-blue-400"
									>
										{val !== null && val !== undefined
											? val.toFixed(2)
											: "-"}
									</TableCell>
								);
							})}
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>
		);
});
