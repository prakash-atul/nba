import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { COPOMatrixState, AttainmentData } from "./types";

interface COPOMatrixGridProps {
	copoMatrix: COPOMatrixState;
	updateCOPOMapping: (co: string, po: string, value: number) => void;
	calculatePOAttainment: (po: string) => number;
	attainmentData: AttainmentData | null;
	getAttainmentLevel: (percentage: number) => number;
	getLevelColor: (level: number) => string;
	attainmentThresholds: { id: number; percentage: number }[];
	coMaxMarks?: Record<string, number>; // Total max marks per CO
	readOnly?: boolean;
}

export function COPOMatrixGrid({
	copoMatrix,
	updateCOPOMapping,
	calculatePOAttainment,
	attainmentData,
	getAttainmentLevel,
	getLevelColor,
	attainmentThresholds,
	coMaxMarks,
	readOnly = false,
}: COPOMatrixGridProps) {
	// Helper to check if a CO is assessed
	const isCOAssessed = (co: string): boolean => {
		if (!coMaxMarks) return true;
		return (coMaxMarks[co] || 0) > 0;
	};

	return (
		<Table>
			<TableHeader>
				<TableRow className="bg-blue-100 dark:bg-blue-950">
					<TableHead
						rowSpan={2}
						className="border border-gray-300 dark:border-gray-700 font-bold text-center align-middle bg-yellow-200 dark:bg-yellow-900"
					>
						CO
					</TableHead>
					<TableHead
						rowSpan={2}
						className="border border-gray-300 dark:border-gray-700 font-bold text-center align-middle bg-yellow-200 dark:bg-yellow-900"
					>
						CO Attainment Level
					</TableHead>
					<TableHead
						colSpan={12}
						className="border border-gray-300 dark:border-gray-700 font-bold text-center bg-green-100 dark:bg-green-950"
					>
						CO-PO Mapping Matrix
					</TableHead>
					<TableHead
						colSpan={3}
						className="border border-gray-300 dark:border-gray-700 font-bold text-center bg-purple-100 dark:bg-purple-950"
					>
						CO-PSO Mapping Matrix
					</TableHead>
				</TableRow>
				<TableRow className="bg-gray-100 dark:bg-gray-900">
					{[
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
					].map((po) => (
						<TableHead
							key={po}
							className="border border-gray-300 dark:border-gray-700 font-bold text-center"
						>
							{po}
						</TableHead>
					))}
					{["PSO1", "PSO2", "PSO3"].map((pso) => (
						<TableHead
							key={pso}
							className="border border-gray-300 dark:border-gray-700 font-bold text-center"
						>
							{pso}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{/* CO Rows */}
				{["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"].map((co) => {
					const assessed = isCOAssessed(co);
					const coLevel =
						assessed && attainmentData
							? getAttainmentLevel(
									attainmentData.presentStudents > 0
										? (attainmentData.coStats[
												co as keyof typeof attainmentData.coStats
											].aboveCOThreshold /
												attainmentData.presentStudents) *
												100
										: 0,
								)
							: 0;

					return (
						<TableRow key={co}>
							<TableCell className="border border-gray-300 dark:border-gray-700 font-bold text-center">
								{co}
							</TableCell>
							<TableCell className="border border-gray-300 dark:border-gray-700 text-center">
								{assessed ? (
									<Badge className={getLevelColor(coLevel)}>
										{(coLevel).toFixed(2)}
									</Badge>
								) : (
									<span className="text-gray-500 font-medium">
										NA
									</span>
								)}
							</TableCell>
							{/* PO Mappings */}
							{[
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
							].map((po) => (
								<TableCell
									key={po}
									className="border border-gray-300 dark:border-gray-700 text-center p-1"
								>
									<Input
										type="number"
										min="0"
										max={attainmentThresholds.length}
										disabled={readOnly}
										value={
											copoMatrix[
												co as keyof COPOMatrixState
											][po]
										}
										onChange={(e) =>
											updateCOPOMapping(
												co,
												po,
												Number(e.target.value),
											)
										}
										onFocus={(e) => e.target.select()}
										className="w-16 h-8 text-center"
									/>
								</TableCell>
							))}
							{/* PSO Mappings */}
							{["PSO1", "PSO2", "PSO3"].map((pso) => (
								<TableCell
									key={pso}
									className="border border-gray-300 dark:border-gray-700 text-center p-1"
								>
									<Input
										type="number"
										min="0"
										max={attainmentThresholds.length}
										disabled={readOnly}
										value={
											copoMatrix[
												co as keyof COPOMatrixState
											][pso]
										}
										onChange={(e) =>
											updateCOPOMapping(
												co,
												pso,
												Number(e.target.value),
											)
										}
										onFocus={(e) => e.target.select()}
										className="w-16 h-8 text-center"
									/>
								</TableCell>
							))}
						</TableRow>
					);
				})}

				{/* PO Attainment Row */}
				<TableRow className="bg-orange-100 dark:bg-orange-950 font-bold">
					<TableCell
						colSpan={2}
						className="border border-gray-300 dark:border-gray-700 text-center"
					>
						PO Attainment Level
					</TableCell>
					{[
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
					].map((po) => {
						const attainment = calculatePOAttainment(po);
						return (
							<TableCell
								key={po}
								className="border border-gray-300 dark:border-gray-700 text-center"
							>
								<Badge
									className={getLevelColor(
										Math.round(attainment),
									)}
								>
									{attainment.toFixed(2)}
								</Badge>
							</TableCell>
						);
					})}
					{["PSO1", "PSO2", "PSO3"].map((pso) => {
						const attainment = calculatePOAttainment(pso);
						return (
							<TableCell
								key={pso}
								className="border border-gray-300 dark:border-gray-700 text-center"
							>
								<Badge
									className={getLevelColor(
										Math.round(attainment),
									)}
								>
									{attainment.toFixed(2)}
								</Badge>
							</TableCell>
						);
					})}
				</TableRow>
			</TableBody>
		</Table>
	);
}
