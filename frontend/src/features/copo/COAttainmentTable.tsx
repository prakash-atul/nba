import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { AttainmentData } from "./types";

interface COAttainmentTableProps {
	attainmentData: AttainmentData;
	coThreshold: number;
	coMaxMarks?: Record<string, number>; // Total max marks per CO across all tests
	getAttainmentLevel: (percentage: number) => number;
	getPercentageColor: (percentage: number) => string;
}

export function COAttainmentTable({
	attainmentData,
	coThreshold,
	coMaxMarks,
	getAttainmentLevel,
	getPercentageColor,
}: COAttainmentTableProps) {
	const coList = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];

	// Helper to check if a CO is assessed (has max marks > 0)
	const isCOAssessed = (co: string): boolean => {
		if (!coMaxMarks) return true; // If no max marks data, assume all are assessed
		return (coMaxMarks[co] || 0) > 0;
	};

	return (
		<>
			{/* CO ATTAINMENT in 3.0 POINT Scale */}
			<Card>
				<CardHeader className="bg-pink-100 dark:bg-pink-950">
					<CardTitle className="text-xl text-center font-bold">
						CO ATTAINMENT in 3.0 POINT Scale
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
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										ABSENTEE+NOT ATTEMPT
									</TableCell>
									{coList.map((co) => (
										<TableCell
											key={co}
											className="border border-gray-300 dark:border-gray-700 text-center"
										>
											{isCOAssessed(co)
												? attainmentData.absentees
												: "NA"}
										</TableCell>
									))}
								</TableRow>
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										PRESENT STUDENT OR ATTEMPT
									</TableCell>
									{coList.map((co) => (
										<TableCell
											key={co}
											className="border border-gray-300 dark:border-gray-700 text-center"
										>
											{isCOAssessed(co)
												? attainmentData.presentStudents
												: "NA"}
										</TableCell>
									))}
								</TableRow>
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										NO. OF STUDENTS SECURE MARKS &gt;{" "}
										{coThreshold}% (CO THRESHOLD)
									</TableCell>
									{coList.map((co) => (
										<TableCell
											key={co}
											className="border border-gray-300 dark:border-gray-700 text-center bg-gray-900 dark:bg-gray-950 text-white"
										>
											{isCOAssessed(co)
												? attainmentData.coStats[
														co as keyof typeof attainmentData.coStats
													].aboveCOThreshold
												: "NA"}
										</TableCell>
									))}
								</TableRow>
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										PC. OF STUDENTS SECURE MARKS &gt;{" "}
										{coThreshold}% (CO THRESHOLD)
									</TableCell>
									{coList.map((co) => {
										if (!isCOAssessed(co)) {
											return (
												<TableCell
													key={co}
													className="border border-gray-300 dark:border-gray-700 text-center text-gray-500"
												>
													NA
												</TableCell>
											);
										}
										const percentage =
											attainmentData.presentStudents > 0
												? (attainmentData.coStats[
														co as keyof typeof attainmentData.coStats
													].aboveCOThreshold /
														attainmentData.presentStudents) *
													100
												: 0;
										return (
											<TableCell
												key={co}
												className="border border-gray-300 dark:border-gray-700 text-center"
											>
												{percentage.toFixed(2)}
											</TableCell>
										);
									})}
								</TableRow>
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										CO Attainment Level (Based on Criteria)
									</TableCell>
									{coList.map((co) => {
										if (!isCOAssessed(co)) {
											return (
												<TableCell
													key={co}
													className="border border-gray-300 dark:border-gray-700 text-center text-gray-500 bg-gray-100 dark:bg-gray-800"
												>
													NA
												</TableCell>
											);
										}
										const percentage =
											attainmentData.presentStudents > 0
												? (attainmentData.coStats[
														co as keyof typeof attainmentData.coStats
													].aboveCOThreshold /
														attainmentData.presentStudents) *
													100
												: 0;
										const level =
											getAttainmentLevel(percentage);
										return (
											<TableCell
												key={co}
												className={`border border-gray-300 dark:border-gray-700 text-center font-bold ${getPercentageColor(
													percentage,
												)}`}
											>
												{level.toFixed(2)}
											</TableCell>
										);
									})}
								</TableRow>
								<TableRow className="bg-orange-100 dark:bg-orange-950">
									<TableCell className="border border-gray-300 dark:border-gray-700 font-bold">
										Final attainment level CO (by Direct
										Assessment):
									</TableCell>
									{coList.map((co) => {
										if (!isCOAssessed(co)) {
											return (
												<TableCell
													key={co}
													className="border border-gray-300 dark:border-gray-700 text-center font-bold text-gray-500 bg-gray-200 dark:bg-gray-700"
												>
													NA
												</TableCell>
											);
										}
										const percentage =
											attainmentData.presentStudents > 0
												? (attainmentData.coStats[
														co as keyof typeof attainmentData.coStats
													].aboveCOThreshold /
														attainmentData.presentStudents) *
													100
												: 0;
										const level =
											getAttainmentLevel(percentage);
										return (
											<TableCell
												key={co}
												className={`border border-gray-300 dark:border-gray-700 text-center font-bold ${getPercentageColor(
													percentage,
												)}`}
											>
												{level.toFixed(2)}
											</TableCell>
										);
									})}
								</TableRow>
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* CO ATTAINMENT in ABSOLUTE Scale */}
			<Card>
				<CardHeader className="bg-pink-100 dark:bg-pink-950">
					<CardTitle className="text-xl text-center font-bold">
						CO ATTAINMENT in ABSOLUTE Scale
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
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										ABSENTEE+NOT ATTEMPT
									</TableCell>
									{coList.map((co) => (
										<TableCell
											key={co}
											className="border border-gray-300 dark:border-gray-700 text-center"
										>
											{isCOAssessed(co)
												? attainmentData.absentees
												: "NA"}
										</TableCell>
									))}
								</TableRow>
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										PRESENT STUDENT OR ATTEMPT
									</TableCell>
									{coList.map((co) => (
										<TableCell
											key={co}
											className="border border-gray-300 dark:border-gray-700 text-center"
										>
											{isCOAssessed(co)
												? attainmentData.presentStudents
												: "NA"}
										</TableCell>
									))}
								</TableRow>
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										NO. OF STUDENTS SECURE MARKS &gt;
										PASSING MARKS
									</TableCell>
									{coList.map((co) => (
										<TableCell
											key={co}
											className="border border-gray-300 dark:border-gray-700 text-center bg-gray-800 dark:bg-gray-950 text-white"
										>
											{isCOAssessed(co)
												? attainmentData.coStats[
														co as keyof typeof attainmentData.coStats
													].abovePass
												: "NA"}
										</TableCell>
									))}
								</TableRow>
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										PC. OF STUDENTS SECURE MARKS &gt;
										PASSING MARKS
									</TableCell>
									{coList.map((co) => {
										if (!isCOAssessed(co)) {
											return (
												<TableCell
													key={co}
													className="border border-gray-300 dark:border-gray-700 text-center text-gray-500"
												>
													NA
												</TableCell>
											);
										}
										const percentage =
											attainmentData.presentStudents > 0
												? (attainmentData.coStats[
														co as keyof typeof attainmentData.coStats
													].abovePass /
														attainmentData.presentStudents) *
													100
												: 0;
										return (
											<TableCell
												key={co}
												className="border border-gray-300 dark:border-gray-700 text-center"
											>
												{percentage.toFixed(2)}
											</TableCell>
										);
									})}
								</TableRow>
								<TableRow>
									<TableCell className="border border-gray-300 dark:border-gray-700 font-medium">
										CO Attainment (% of Students Above
										Passing Marks)
									</TableCell>
									{coList.map((co) => {
										if (!isCOAssessed(co)) {
											return (
												<TableCell
													key={co}
													className="border border-gray-300 dark:border-gray-700 text-center text-gray-500 bg-gray-100 dark:bg-gray-800"
												>
													NA
												</TableCell>
											);
										}
										const percentage =
											attainmentData.presentStudents > 0
												? (attainmentData.coStats[
														co as keyof typeof attainmentData.coStats
													].abovePass /
														attainmentData.presentStudents) *
													100
												: 0;
										return (
											<TableCell
												key={co}
												className={`border border-gray-300 dark:border-gray-700 text-center font-bold ${getPercentageColor(
													percentage,
												)}`}
											>
												{percentage.toFixed(2)}
											</TableCell>
										);
									})}
								</TableRow>
								<TableRow className="bg-orange-100 dark:bg-orange-950">
									<TableCell className="border border-gray-300 dark:border-gray-700 font-bold">
										Final attainment level CO (IN ABSOLUTE
										SCALE):
									</TableCell>
									{coList.map((co) => {
										if (!isCOAssessed(co)) {
											return (
												<TableCell
													key={co}
													className="border border-gray-300 dark:border-gray-700 text-center font-bold text-gray-500 bg-gray-200 dark:bg-gray-700"
												>
													NA
												</TableCell>
											);
										}
										const percentage =
											attainmentData.presentStudents > 0
												? (attainmentData.coStats[
														co as keyof typeof attainmentData.coStats
													].abovePass /
														attainmentData.presentStudents) *
													100
												: 0;
										return (
											<TableCell
												key={co}
												className={`border border-gray-300 dark:border-gray-700 text-center font-bold ${getPercentageColor(
													percentage,
												)}`}
											>
												{percentage.toFixed(2)}
											</TableCell>
										);
									})}
								</TableRow>
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
