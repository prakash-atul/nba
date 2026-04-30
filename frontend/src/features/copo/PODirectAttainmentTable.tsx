import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { COPOMatrixState } from "./types";

interface PODirectAttainmentTableProps {
	copoMatrix: COPOMatrixState;
	coMaxMarks?: Record<string, number>;
}

export function PODirectAttainmentTable({
	copoMatrix,
	coMaxMarks,
}: PODirectAttainmentTableProps) {
	const cos = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];
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

	const isCOAssessed = (co: string): boolean => {
		if (!coMaxMarks) return true;
		return (coMaxMarks[co] || 0) > 0;
	};

	const calculateWeightSum = (po: string) => {
		let sum = 0;
		cos.forEach((co) => {
			if (isCOAssessed(co)) {
				const val = copoMatrix[co as keyof COPOMatrixState][po] || 0;
				sum += val;
			}
		});
		return sum;
	};

	return (
		<Card className="mt-6 border dark:border-gray-800 shadow-sm overflow-hidden">
			<CardHeader className="bg-orange-100 dark:bg-orange-950 border-b-4 border-orange-500">
				<CardTitle className="text-xl text-gray-800 dark:text-gray-100 text-center uppercase">
					PO ATTAINMENT USING CO (DIRECT METHOD)
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 overflow-auto">
				<Table>
					<TableHeader>
						<TableRow className="bg-blue-100 dark:bg-blue-900/50">
							<TableHead
								className="w-[100px] border border-gray-300 dark:border-gray-700 font-bold text-gray-900 dark:text-gray-100 text-center uppercase"
								colSpan={16}
							>
								CO PO MAPPING
							</TableHead>
						</TableRow>
						<TableRow className="bg-gray-100/50 dark:bg-gray-800/50">
							<TableHead className="w-[100px] border border-gray-300 dark:border-gray-700 font-bold text-gray-900 dark:text-gray-100 text-center">
								-
							</TableHead>
							{pos.map((po) => (
								<TableHead
									key={po}
									className="text-center border border-gray-300 dark:border-gray-700 font-bold text-gray-900 dark:text-gray-100 min-w-[60px]"
								>
									{po}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{cos.map((co) => (
							<TableRow
								key={co}
								className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
							>
								<TableCell className="font-bold border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-center bg-gray-50 dark:bg-gray-900">
									{co}
								</TableCell>
								{pos.map((po) => {
									const val =
										copoMatrix[co as keyof COPOMatrixState][
											po
										];
									return (
										<TableCell
											key={po}
											className="text-center border border-gray-300 dark:border-gray-700"
										>
											{val > 0 ? val : "-"}
										</TableCell>
									);
								})}
							</TableRow>
						))}

						<TableRow className="bg-orange-50 dark:bg-orange-900/20 font-bold">
							<TableCell className="border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-center uppercase">
								WT. SUM
							</TableCell>
							{pos.map((po) => (
								<TableCell
									key={po}
									className="text-center border border-gray-300 dark:border-gray-700"
								>
									{calculateWeightSum(po).toFixed(2)}
								</TableCell>
							))}
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
