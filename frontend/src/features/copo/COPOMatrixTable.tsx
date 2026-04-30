import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import type { COPOMatrixState, AttainmentData } from "./types";
import { COPOMatrixGrid } from "./COPOMatrixGrid";

interface COPOMatrixTableProps {
	copoMatrix: COPOMatrixState;
	courseInfo?: {
		university_name: string;
		faculty_name: string;
		branch: string;
		programme_name: string;
		year: string;
		semester: string;
		course_name: string;
		course_code: string;
		session: string;
	} | null;
	updateCOPOMapping: (co: string, po: string, value: number) => void;
	calculatePOAttainment: (po: string) => number;
	getPercentageColor?: (percentage: number) => string;
	attainmentData: AttainmentData | null;
	getAttainmentLevel: (percentage: number) => number;
	getLevelColor: (level: number) => string;
	attainmentThresholds: { id: number; percentage: number }[];
	coMaxMarks?: Record<string, number>; // Total max marks per CO
	readOnly?: boolean;
}

export function COPOMatrixTable({
	copoMatrix,
	updateCOPOMapping,
	calculatePOAttainment,
	attainmentData,
	getAttainmentLevel,
	getLevelColor,
	attainmentThresholds,
	coMaxMarks,
	readOnly = false,
}: COPOMatrixTableProps) {
	return (
		<Card>
			<CardHeader className="bg-orange-100 dark:bg-orange-950 border-b-4 border-orange-500">
				<CardTitle className="text-lg text-gray-900 dark:text-white">
					TEZPUR UNIVERSITY
				</CardTitle>
				<p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
					Course Outcome - Program Outcome - Program Specific Outcome
					Mapping
				</p>
			</CardHeader>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<COPOMatrixGrid
						copoMatrix={copoMatrix}
						updateCOPOMapping={updateCOPOMapping}
						calculatePOAttainment={calculatePOAttainment}
						attainmentData={attainmentData}
						getAttainmentLevel={getAttainmentLevel}
						getLevelColor={getLevelColor}
						attainmentThresholds={attainmentThresholds}
						coMaxMarks={coMaxMarks}
						readOnly={readOnly}
					/>
				</div>
				<div className="p-4">
					<div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
						<p>
							<strong>Note:</strong> Enter mapping correlation
							values (0 to {attainmentThresholds.length}) based on
							the attainment criteria scale. 0 = No correlation,
							Higher values = Stronger correlation.
						</p>
						<p className="mt-2">
							<strong>Formula:</strong> PO/PSO Attainment = Σ(CO
							<sub>i</sub> × PO<sub>k</sub> /{" "}
							{attainmentThresholds.length}) / m
							<br />
							where m is the total number of COs mapped to that
							PO/PSO (mapping value &gt; 0)
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
