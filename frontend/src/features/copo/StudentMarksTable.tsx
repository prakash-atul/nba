import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { StudentMarksCardHeader } from "./StudentMarksCardHeader";
import { StudentMarksTableHeaderRows } from "./StudentMarksTableHeaderRows";
import type { StudentMarks } from "./types";
import React from "react";

interface StudentMarksTableProps {
	studentsData: StudentMarks[];
	maxMarks: any;
	facultyName: string;
	departmentName: string;
	courseName: string;
	courseCode: string;
	programme?: string;
	year?: string | number;
	semester?: string | number;
	session?: string;
	loading: boolean;
	getPercentageColor: (percentage: number) => string;
	coMaxMarks?: Record<string, number>; // Total max marks per CO across all tests
}

export const StudentMarksTable = React.memo(function StudentMarksTable({
	studentsData,
	maxMarks,
	facultyName,
	departmentName,
	courseName,
	courseCode,
	programme,
	year,
	semester,
	session,
	loading,
	getPercentageColor,
	coMaxMarks,
}: StudentMarksTableProps) {
	// Helper to check if a CO is assessed
	const isCOAssessed = (co: string): boolean => {
		if (!coMaxMarks) return true;
		return (coMaxMarks[co] || 0) > 0;
	};

	return (
		<Card>
			<StudentMarksCardHeader
				facultyName={facultyName}
				departmentName={departmentName}
				courseName={courseName}
				courseCode={courseCode}
				programme={programme}
				year={year}
				semester={semester}
				session={session}
			/>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<Table>
						<StudentMarksTableHeaderRows
							maxMarks={maxMarks}
							isCOAssessed={isCOAssessed}
						/>
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
										<TableCell className="border border-gray-300 dark:border-gray-700 px-2 text-left font-medium max-w-[180px] truncate">
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
});
