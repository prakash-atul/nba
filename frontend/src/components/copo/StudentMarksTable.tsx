import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { StudentMarks } from "./types";

interface StudentMarksTableProps {
	studentsData: StudentMarks[];
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
	facultyName: string;
	departmentName: string;
	courseName: string;
	courseCode: string;
	year: number;
	semester: string;
	loading: boolean;
	getPercentageColor: (percentage: number) => string;
	coMaxMarks?: Record<string, number>; // Total max marks per CO across all tests
}

export function StudentMarksTable({
	studentsData,
	maxMarks,
	facultyName,
	departmentName,
	courseName,
	courseCode,
	year,
	semester,
	loading,
	getPercentageColor,
	coMaxMarks,
}: StudentMarksTableProps) {
	const getAcademicYear = (year: number) => `${year}-${year + 1}`;
	const getSemesterDisplay = (sem: string) => {
		return sem;
	};
	const getCurrentSession = () => {
		const currentYear = new Date().getFullYear();
		return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
	};

	// Helper to check if a CO is assessed
	const isCOAssessed = (co: string): boolean => {
		if (!coMaxMarks) return true;
		return (coMaxMarks[co] || 0) > 0;
	};

	return (
		<Card>
			<CardHeader className="bg-orange-100 dark:bg-orange-950 border-b-4 border-orange-500">
				<div className="space-y-2">
					<CardTitle className="text-xl text-center text-gray-900 dark:text-white font-bold">
						TEZPUR UNIVERSITY
					</CardTitle>
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex gap-2">
							<span className="font-semibold">Faculty Name:</span>
							<span>{facultyName}</span>
						</div>
						<div className="flex gap-2">
							<span className="font-semibold">BRANCH:</span>
							<span>{departmentName}</span>
						</div>
						<div className="flex gap-2">
							<span className="font-semibold">Programme:</span>
							<span>B. Tech</span>
						</div>
						<div className="flex gap-2">
							<span className="font-semibold">YEAR:</span>
							<span>{getAcademicYear(year)}</span>
							<span className="font-semibold ml-4">SEM:</span>
							<span>{getSemesterDisplay(semester)}</span>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex gap-2">
							<span className="font-semibold">Course:</span>
							<span>{courseName}</span>
						</div>
						<div className="flex gap-2">
							<span className="font-semibold">Course Code:</span>
							<span>{courseCode}</span>
							<span className="font-semibold ml-4">SESSION:</span>
							<span>{getCurrentSession()}</span>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<Table>
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
								{Object.entries(maxMarks).map(
									([testName, marks], idx) => (
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
									),
								)}
								<TableHead
									colSpan={7}
									className="text-center border border-gray-300 dark:border-gray-700 font-bold"
								>
									%
								</TableHead>
							</TableRow>
							<TableRow className="bg-gray-100 dark:bg-gray-900">
								{Object.keys(maxMarks).map(
									(testName, testIdx) =>
										[
											"CO1",
											"CO2",
											"CO3",
											"CO4",
											"CO5",
											"CO6",
										].map((co, coIdx) => {
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
										}),
								)}
								{[
									"CO1",
									"CO2",
									"CO3",
									"CO4",
									"CO5",
									"CO6",
									"ΣCO",
								].map((co) => (
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
								{Object.entries(maxMarks).map(
									([testName, marks], testIdx) =>
										[
											"CO1",
											"CO2",
											"CO3",
											"CO4",
											"CO5",
											"CO6",
										].map((co, coIdx) => {
											const borderClass =
												coIdx === 0 && testIdx > 0
													? "border-l-2 border-l-gray-500 dark:border-l-gray-400"
													: "";
											return (
												<TableHead
													key={`${testName}-max-${co}`}
													className={`text-center border border-gray-300 dark:border-gray-700 font-bold ${borderClass}`}
												>
													{marks[
														co as keyof typeof marks
													] || 0}
												</TableHead>
											);
										}),
								)}
								<TableHead className="text-center border border-gray-300 dark:border-gray-700 font-bold">
									%
								</TableHead>
								{[
									"CO1",
									"CO2",
									"CO3",
									"CO4",
									"CO5",
									"CO6",
									"ΣCO",
								].map((co) => (
									<TableHead
										key={`max-${co}`}
										className="text-center border border-gray-300 dark:border-gray-700 font-bold"
									>
										{co === "ΣCO" || isCOAssessed(co)
											? "100"
											: "NA"}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell
										colSpan={100}
										className="text-center py-8"
									>
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
											<span className="ml-3">
												Loading CO-PO mapping data...
											</span>
										</div>
									</TableCell>
								</TableRow>
							) : studentsData.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={100}
										className="text-center py-8 text-gray-500"
									>
										No student data available for this
										course.
									</TableCell>
								</TableRow>
							) : (
								studentsData.map((student, idx) => (
									<TableRow key={student.rollNo}>
										<TableCell className="text-center border border-gray-300 dark:border-gray-700">
											{idx + 1}
										</TableCell>
										<TableCell className="text-center border border-gray-300 dark:border-gray-700 font-medium">
											{student.rollNo}
										</TableCell>
										<TableCell className="border border-gray-300 dark:border-gray-700 px-2">
											{student.name}
										</TableCell>
										<TableCell className="text-center border border-gray-300 dark:border-gray-700">
											{student.absentee}
										</TableCell>
										{Object.keys(maxMarks).map(
											(testName, testIdx) => {
												const testMarks =
													student.tests[testName] ||
													{};
												return [
													"CO1",
													"CO2",
													"CO3",
													"CO4",
													"CO5",
													"CO6",
												].map((co, coIdx) => {
													const marks =
														testMarks[
															co as keyof typeof testMarks
														];
													const displayMarks =
														typeof marks ===
														"number"
															? marks.toFixed(2)
															: "0.00";
													const borderClass =
														coIdx === 0 &&
														testIdx > 0
															? "border-l-2 border-l-gray-500 dark:border-l-gray-400"
															: "";
													return (
														<TableCell
															key={`${testName}-${co}`}
															className={`text-center border border-gray-300 dark:border-gray-700 ${borderClass}`}
														>
															{displayMarks}
														</TableCell>
													);
												});
											},
										)}
										<TableCell className="text-center border border-gray-300 dark:border-gray-700 font-bold bg-yellow-100 dark:bg-yellow-950">
											{student.total.toFixed(2)}
										</TableCell>
										{[
											"CO1",
											"CO2",
											"CO3",
											"CO4",
											"CO5",
											"CO6",
											"ΣCO",
										].map((co) => {
											// Show NA for unassessed COs (except ΣCO which is always calculated)
											if (
												co !== "ΣCO" &&
												!isCOAssessed(co)
											) {
												return (
													<TableCell
														key={`co-${co}`}
														className="text-center border border-gray-300 dark:border-gray-700 font-bold text-gray-500"
													>
														NA
													</TableCell>
												);
											}
											const percentage =
												student.coTotals[
													co as keyof typeof student.coTotals
												];
											return (
												<TableCell
													key={`co-${co}`}
													className={`text-center border border-gray-300 dark:border-gray-700 font-bold ${getPercentageColor(
														percentage,
													)}`}
												>
													{percentage.toFixed(2)}
												</TableCell>
											);
										})}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
