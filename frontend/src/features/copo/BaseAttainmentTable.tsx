import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttainmentData } from "./types";

interface BaseAttainmentTableProps {
	title: string;
	coList: string[];
	isCOAssessed: (co: string) => boolean;
	attainmentData: AttainmentData;
	rows: {
		label: string;
		getValue: (co: string, isAssessed: boolean) => React.ReactNode;
		rowClass?: string;
		cellClass?: (co: string) => string;
	}[];
}

export function BaseAttainmentTable({
	title,
	coList,
	isCOAssessed,
	rows,
}: BaseAttainmentTableProps) {
	return (
		<Card>
			<CardHeader className="bg-pink-100 dark:bg-pink-950">
				<CardTitle className="text-xl text-center font-bold">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-blue-100 dark:bg-blue-950">
								<TableHead
									className="border border-gray-300 dark:border-gray-700 font-bold text-center align-middle bg-yellow-200 dark:bg-yellow-900"
									rowSpan={2}
								>
									ATTAINMENT TABLE
								</TableHead>
								<TableHead
									className="border border-gray-300 dark:border-gray-700 font-bold text-center"
									colSpan={6}
								>
									CO1 to CO6
								</TableHead>
							</TableRow>
							<TableRow className="bg-gray-100 dark:bg-gray-900">
								{coList.map((co) => (
									<TableHead
										key={co}
										className="border border-gray-300 dark:border-gray-700 font-bold text-center"
									>
										{co}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, i) => (
								<TableRow key={i} className={row.rowClass}>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										{row.label}
									</TableCell>
									{coList.map((co) => (
										<TableCell
											key={co}
											className={`border border-gray-300 dark:border-gray-700 text-center ${row.cellClass?.(co) || ""}`}
										>
											{row.getValue(co, isCOAssessed(co))}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
