import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StudentMarksTableHeaderRowsProps {
	maxMarks: Record<
		string,
		{
			total: number;
			CO1: number;
			CO2: number;
			CO3: number;
			CO4: number;
			CO5: number;
			CO6: number;
		}
	>;
	isCOAssessed: (co: string) => boolean;
}

export function StudentMarksTableHeaderRows({
	maxMarks,
	isCOAssessed,
}: StudentMarksTableHeaderRowsProps) {
	return (
		<TableHeader>
			<TableRow className="bg-yellow-100 dark:bg-yellow-950">
				<TableHead
					rowSpan={3}
					className="text-center border border-gray-300 dark:border-gray-700 font-bold"
				>
					S.No.
				</TableHead>
				<TableHead
					rowSpan={3}
					className="text-center border border-gray-300 dark:border-gray-700 font-bold"
				>
					Roll No.
				</TableHead>
				<TableHead
					rowSpan={3}
					className="text-center border border-gray-300 dark:border-gray-700 font-bold min-w-[200px]"
				>
					Name of Student
				</TableHead>
				<TableHead
					rowSpan={3}
					className="text-center border border-gray-300 dark:border-gray-700 font-bold"
				>
					ABSENTEE
				</TableHead>
				{Object.keys(maxMarks).map((testName, idx) => (
					<TableHead
						key={testName}
						colSpan={6}
						className={`text-center border border-gray-300 dark:border-gray-700 font-bold bg-yellow-200 dark:bg-yellow-900 ${
							idx > 0
								? "border-l-2 border-l-gray-500 dark:border-l-gray-400"
								: ""
						}`}
					>
						Assessment of {testName}
					</TableHead>
				))}
				<TableHead
					rowSpan={3}
					className="text-center border border-gray-300 dark:border-gray-700 font-bold"
				>
					TOTAL
				</TableHead>
				<TableHead
					colSpan={7}
					className="text-center border border-gray-300 dark:border-gray-700 font-bold bg-yellow-200 dark:bg-yellow-900"
				>
					% of CO ATTAINMENT
				</TableHead>
			</TableRow>
			<TableRow className="bg-blue-100 dark:bg-blue-950">
				{Object.entries(maxMarks).map(([testName, marks], idx) => (
					<TableHead
						key={`max-${testName}`}
						colSpan={6}
						className={`text-center border border-gray-300 dark:border-gray-700 font-bold ${
							idx > 0
								? "border-l-2 border-l-gray-500 dark:border-l-gray-400"
								: ""
						}`}
					>
						Maximum Marks: {marks.total}
					</TableHead>
				))}
				<TableHead
					colSpan={7}
					className="text-center border border-gray-300 dark:border-gray-700 font-bold"
				>
					%
				</TableHead>
			</TableRow>
			<TableRow className="bg-gray-100 dark:bg-gray-900">
				{Object.keys(maxMarks).map((testName, testIdx) =>
					["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"].map(
						(co, coIdx) => {
							const borderClass =
								coIdx === 0 && testIdx > 0
									? "border-l-2 border-l-gray-500 dark:border-l-gray-400"
									: "";
							return (
								<TableHead
									key={`${testName}-${co}`}
									className={`text-center border border-gray-300 dark:border-gray-700 font-bold ${borderClass}`}
								>
									{co}
								</TableHead>
							);
						},
					),
				)}
				{["CO1", "CO2", "CO3", "CO4", "CO5", "CO6", "ΣCO"].map((co) => (
					<TableHead
						key={`total-${co}`}
						className="text-center border border-gray-300 dark:border-gray-700 font-bold"
					>
						{co}
					</TableHead>
				))}
			</TableRow>
			<TableRow className="bg-gray-50 dark:bg-gray-800">
				<TableHead className="text-center border border-gray-300 dark:border-gray-700"></TableHead>
				<TableHead className="text-center border border-gray-300 dark:border-gray-700"></TableHead>
				<TableHead className="text-center border border-gray-300 dark:border-gray-700 text-xs">
					CO WISE MAXIMUM MARKS
				</TableHead>
				<TableHead className="text-center border border-gray-300 dark:border-gray-700 text-xs">
					"AB" or "UR"
				</TableHead>
				{Object.entries(maxMarks).map(([testName, marks], testIdx) =>
					["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"].map(
						(co, coIdx) => {
							const borderClass =
								coIdx === 0 && testIdx > 0
									? "border-l-2 border-l-gray-500 dark:border-l-gray-400"
									: "";
							return (
								<TableHead
									key={`${testName}-max-${co}`}
									className={`text-center border border-gray-300 dark:border-gray-700 font-bold ${borderClass}`}
								>
									{marks[co as keyof typeof marks] || 0}
								</TableHead>
							);
						},
					),
				)}
				<TableHead className="text-center border border-gray-300 dark:border-gray-700 font-bold">
					%
				</TableHead>
				{["CO1", "CO2", "CO3", "CO4", "CO5", "CO6", "ΣCO"].map((co) => (
					<TableHead
						key={`max-${co}`}
						className="text-center border border-gray-300 dark:border-gray-700 font-bold"
					>
						{co === "ΣCO" || isCOAssessed(co) ? "100" : "NA"}
					</TableHead>
				))}
			</TableRow>
		</TableHeader>
	);
}
