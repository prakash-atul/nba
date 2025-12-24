import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarksEntrySelector } from "@/components/marks/MarksEntrySelector";
import { MarksEntryByQuestion } from "@/components/marks/MarksEntryByQuestion";
import { MarksEntryByCO } from "@/components/marks/MarksEntryByCO";
import { ViewTestMarks } from "@/components/marks/ViewTestMarks";
import type { Course, Test } from "@/services/api";

interface FacultyMarksProps {
	selectedCourse: Course | null;
}

export function FacultyMarks({ selectedCourse }: FacultyMarksProps) {
	const [selectedTest, setSelectedTest] = useState<Test | null>(null);
	const [entryMode, setEntryMode] = useState<
		"by-question" | "by-co" | "view-all" | null
	>(null);

	const handleTestSelected = (test: Test) => {
		setSelectedTest(test);
		setEntryMode(null);
	};

	const handleBackToSelection = () => {
		setEntryMode(null);
	};

	const handleBackToTestList = () => {
		setSelectedTest(null);
		setEntryMode(null);
	};

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<ScrollArea className="h-full">
				<div className="p-6">
					{!selectedTest ? (
						<MarksEntrySelector
							course={selectedCourse}
							onTestSelected={handleTestSelected}
						/>
					) : !entryMode ? (
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
										{selectedTest.name}
									</h2>
									<p className="text-gray-500 dark:text-gray-400">
										Select how you want to enter marks
									</p>
								</div>
								<button
									onClick={handleBackToTestList}
									className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
								>
									← Back to Tests
								</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<button
									onClick={() => setEntryMode("by-question")}
									className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group"
								>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2">
										Entry by Question
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Enter marks for one question at a time
										for all students. Best for grading a
										specific question.
									</p>
								</button>

								<button
									onClick={() => setEntryMode("by-co")}
									className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group"
								>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2">
										Entry by CO
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										Enter marks grouped by Course Outcomes.
										Useful for outcome-based assessment.
									</p>
								</button>

								<button
									onClick={() => setEntryMode("view-all")}
									className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group"
								>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2">
										View All Marks
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										View and edit all marks for this test in
										a spreadsheet-like view.
									</p>
								</button>
							</div>
						</div>
					) : entryMode === "by-question" ? (
						<MarksEntryByQuestion
							test={selectedTest}
							course={selectedCourse}
							onBack={handleBackToSelection}
						/>
					) : entryMode === "by-co" ? (
						<MarksEntryByCO
							test={selectedTest}
							course={selectedCourse}
							onBack={handleBackToSelection}
						/>
					) : (
						<ViewTestMarks
							test={selectedTest}
							course={selectedCourse}
							onBack={handleBackToSelection}
						/>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
