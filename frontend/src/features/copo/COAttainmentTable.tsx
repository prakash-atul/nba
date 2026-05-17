import { BaseAttainmentTable } from "./BaseAttainmentTable";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { debugLogger } from "@/lib/debugLogger";
import type { AttainmentData } from "./types";

interface COAttainmentTableProps {
	attainmentData: AttainmentData;
	coThreshold: number;
	coMaxMarks?: Record<string, number>;
	getAttainmentLevel: (percentage: number) => number;
	getPercentageColor: (percentage: number) => string;
	snapshotIndirectData?: Array<{
		co_name: string;
		attainment_percentage: number;
		attainment_level: number;
		indirect_attainment_percentage?: number | null;
		indirect_attainment_level?: number | null;
		final_attainment_percentage?: number | null;
		final_attainment_level?: number | null;
	}>;
}

export function COAttainmentTable({
	attainmentData,
	coThreshold,
	coMaxMarks,
	getAttainmentLevel,
	getPercentageColor,
	snapshotIndirectData,
}: COAttainmentTableProps) {
	const coList = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];

	const isCOAssessed = (co: string): boolean => {
		if (!coMaxMarks) return true;
		return (coMaxMarks[co] || 0) > 0;
	};

	const getPercentage = (_co: string, field: 'aboveCOThreshold' | 'abovePass') => {
		if (attainmentData.presentStudents === 0) return 0;
		return (attainmentData.coStats[_co as keyof typeof attainmentData.coStats][field] / attainmentData.presentStudents) * 100;
	};
	
	const getAveragePercentage = (_co: string) => {
		if (attainmentData.presentStudents === 0) return 0;
		return attainmentData.coStats[_co as keyof typeof attainmentData.coStats].averagePercentage || 0;
	};

	if (snapshotIndirectData && snapshotIndirectData.length > 0) {
		debugLogger.info("COAttainmentTable", "Rendering Direct/Indirect/Final breakdown", {
			coCount: snapshotIndirectData.length,
			sample: snapshotIndirectData[0],
			hasIndirect: snapshotIndirectData.some(
				(d) => d.indirect_attainment_level !== null && d.indirect_attainment_level !== undefined,
			),
			blendedCos: snapshotIndirectData
				.filter((d) => d.final_attainment_percentage != null && d.final_attainment_percentage !== d.attainment_percentage)
				.map((d) => ({
					co: d.co_name,
					direct: d.attainment_percentage,
					final: d.final_attainment_percentage,
					diff: d.final_attainment_percentage != null && d.attainment_percentage != null
						? (d.final_attainment_percentage - d.attainment_percentage).toFixed(2)
						: null,
				})),
		});
	}

	return (
		<>
			<BaseAttainmentTable
				title="CO ATTAINMENT in 3.0 POINT Scale"
				coList={coList}
				isCOAssessed={isCOAssessed}
				attainmentData={attainmentData}
				rows={[
					{
						label: "ABSENTEE+NOT ATTEMPT",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.absentees : "NA"
					},
					{
						label: "PRESENT STUDENT OR ATTEMPT",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.presentStudents : "NA"
					},
					{
						label: `NO. OF STUDENTS SECURE MARKS > ${coThreshold}% (CO THRESHOLD)`,
						rowClass: "bg-gray-900 dark:bg-gray-950 text-white",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.coStats[_co as keyof typeof attainmentData.coStats].aboveCOThreshold : "NA"
					},
					{
						label: `PC. OF STUDENTS SECURE MARKS > ${coThreshold}% (CO THRESHOLD)`,
						getValue: (co, isAssessed) => isAssessed ? getPercentage(co, 'aboveCOThreshold').toFixed(2) : "NA",
						cellClass: (co) => !isCOAssessed(co) ? "text-gray-500" : ""
					},
					{
						label: "CO Attainment Level (Based on Criteria)",
						getValue: (co, isAssessed) => {
							if (!isAssessed) return "NA";
							const p = getPercentage(co, 'aboveCOThreshold');
							return getAttainmentLevel(p).toFixed(2);
						},
						cellClass: (co) => {
							if (!isCOAssessed(co)) return "text-gray-500 bg-gray-100 dark:bg-gray-800";
							return `font-bold ${getPercentageColor(getPercentage(co, 'aboveCOThreshold'))}`;
						}
					},
					{
						label: "Final attainment level CO (by Direct Assessment):",
						rowClass: "bg-orange-100 dark:bg-orange-950 font-bold",
						getValue: (co, isAssessed) => {
							if (!isAssessed) return "NA";
							const p = getPercentage(co, 'aboveCOThreshold');
							return getAttainmentLevel(p).toFixed(2);
						},
						cellClass: (co) => !isCOAssessed(co) ? "text-gray-500" : "font-bold text-lg"
					}
				]}
			/>

			<BaseAttainmentTable
				title="CO ATTAINMENT in ABSOLUTE Scale"
				coList={coList}
				isCOAssessed={isCOAssessed}
				attainmentData={attainmentData}
				rows={[
					{
						label: "ABSENTEE+NOT ATTEMPT",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.absentees : "NA"
					},
					{
						label: "PRESENT STUDENT OR ATTEMPT",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.presentStudents : "NA"
					},
					{
						label: "NO. OF STUDENTS SECURE MARKS > PASSING MARKS",
						rowClass: "bg-gray-900 dark:bg-gray-950 text-white",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.coStats[_co as keyof typeof attainmentData.coStats].abovePass : "NA"
					},
					{
						label: "PC. OF STUDENTS SECURE MARKS > PASSING MARKS",
						getValue: (co, isAssessed) => isAssessed ? getPercentage(co, 'abovePass').toFixed(2) : "NA",
						cellClass: (co) => !isCOAssessed(co) ? "text-gray-500" : ""
					},
					{
						label: "CO Attainment (AVERAGE OF PERCENTAGE ATTAINMENTS)",
						getValue: (co, isAssessed) => isAssessed ? getAveragePercentage(co).toFixed(2) : "NA",
						cellClass: (co) => {
							if (!isCOAssessed(co)) return "text-gray-500 bg-gray-100 dark:bg-gray-800";
							return `font-bold ${getPercentageColor(getAveragePercentage(co))}`;
						}
					},
					{
						label: "Final attainment level CO (IN ABSOLUTE SCALE):",
						rowClass: "bg-orange-100 dark:bg-orange-950 font-bold",
						getValue: (co, isAssessed) => isAssessed ? getAveragePercentage(co).toFixed(2) + "%" : "NA",
						cellClass: (co) => !isCOAssessed(co) ? "text-gray-500" : "font-bold text-lg"
					}
				]}
			/>

			{snapshotIndirectData && snapshotIndirectData.length > 0 && (
				<SnapshotIndirectTable
					snapshotIndirectData={snapshotIndirectData}
				/>
			)}
		</>
	);
}

function SnapshotIndirectTable({
	snapshotIndirectData,
}: {
	snapshotIndirectData: NonNullable<
		COAttainmentTableProps["snapshotIndirectData"]
	>;
}) {
	const cos = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];
	const filtered = cos
		.map((name) =>
			snapshotIndirectData.find((d) => d.co_name === name),
		)
		.filter(Boolean);

	if (!filtered.length) return null;

	const hasIndirect = filtered.some(
		(d) =>
			d!.indirect_attainment_level !== null &&
			d!.indirect_attainment_level !== undefined,
	);

	return (
		<Card className="mt-4 border dark:border-gray-800 shadow-sm overflow-hidden">
			<CardHeader className="bg-purple-100 dark:bg-purple-950 border-b-4 border-purple-500">
				<CardTitle className="text-xl text-gray-800 dark:text-gray-100 text-center uppercase">
					CO ATTAINMENT — DIRECT vs INDIRECT vs FINAL
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 overflow-auto">
				<Table>
					<TableHeader>
						<TableRow className="bg-gray-100/50 dark:bg-gray-800/50">
							<TableHead className="border border-gray-300 dark:border-gray-700 font-bold text-center">
								CO
							</TableHead>
							<TableHead className="border border-gray-300 dark:border-gray-700 font-bold text-center">
								Direct %
							</TableHead>
							<TableHead className="border border-gray-300 dark:border-gray-700 font-bold text-center">
								Direct Level
							</TableHead>
							{hasIndirect && (
								<>
									<TableHead className="border border-gray-300 dark:border-gray-700 font-bold text-center">
										Indirect %
									</TableHead>
									<TableHead className="border border-gray-300 dark:border-gray-700 font-bold text-center">
										Indirect Level
									</TableHead>
								</>
							)}
							<TableHead className="border border-gray-300 dark:border-gray-700 font-bold text-center text-green-700 dark:text-green-400">
								Final %
							</TableHead>
							<TableHead className="border border-gray-300 dark:border-gray-700 font-bold text-center text-green-700 dark:text-green-400">
								Final Level
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.map((d) => {
							if (!d) return null;
							return (
								<TableRow
									key={d.co_name}
									className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
								>
									<TableCell className="font-bold border border-gray-300 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-900">
										{d.co_name}
									</TableCell>
									<TableCell className="text-center border border-gray-300 dark:border-gray-700">
										{d.attainment_percentage != null
											? Number(d.attainment_percentage).toFixed(2)
											: "—"}
									</TableCell>
									<TableCell className="text-center border border-gray-300 dark:border-gray-700">
										{d.attainment_level != null
											? Number(d.attainment_level).toFixed(2)
											: "—"}
									</TableCell>
									{hasIndirect && (
										<>
											<TableCell className="text-center border border-gray-300 dark:border-gray-700">
												{d.indirect_attainment_percentage != null
													? Number(d.indirect_attainment_percentage).toFixed(2)
													: "—"}
											</TableCell>
											<TableCell className="text-center border border-gray-300 dark:border-gray-700">
												{d.indirect_attainment_level != null
													? Number(d.indirect_attainment_level).toFixed(2)
													: "—"}
											</TableCell>
										</>
									)}
									<TableCell className="text-center border border-gray-300 dark:border-gray-700 font-bold text-green-700 dark:text-green-400">
										{d.final_attainment_percentage != null
											? Number(d.final_attainment_percentage).toFixed(2)
											: d.attainment_percentage != null
												? Number(d.attainment_percentage).toFixed(2)
												: "—"}
									</TableCell>
									<TableCell className="text-center border border-gray-300 dark:border-gray-700 font-bold text-green-700 dark:text-green-400">
										{d.final_attainment_level != null
											? Number(d.final_attainment_level).toFixed(2)
											: d.attainment_level != null
												? Number(d.attainment_level).toFixed(2)
												: "—"}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}