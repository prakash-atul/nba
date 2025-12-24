import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssessmentsSidebar } from "@/components/assessments/AssessmentsSidebar";
import { AssessmentsHeader } from "@/components/assessments/AssessmentsHeader";
import { MarksEntrySelector } from "@/components/marks/MarksEntrySelector";
import { MarksEntryByQuestion } from "@/components/marks/MarksEntryByQuestion";
import { MarksEntryByCO } from "@/components/marks/MarksEntryByCO";
import { ViewTestMarks } from "@/components/marks/ViewTestMarks";
import { Toaster } from "@/components/ui/sonner";
import { apiService } from "@/services/api";
import type { User, Course, Test } from "@/services/api";

export function MarksPage() {
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [courses, setCourses] = useState<Course[]>([]);
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [selectedTest, setSelectedTest] = useState<Test | null>(null);
	const [entryMode, setEntryMode] = useState<
		"by-question" | "by-co" | "view-all" | null
	>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		if (!storedUser) {
			navigate("/login");
			return;
		}
		if (storedUser.role !== "faculty" && storedUser.role !== "hod") {
			navigate("/dashboard");
			return;
		}
		setUser(storedUser);
		loadCourses();
	}, [navigate]);

	const loadCourses = async () => {
		try {
			const coursesData = await apiService.getCourses();
			setCourses(coursesData);
		} catch (error) {
			console.error("Failed to load courses:", error);
		}
	};

	const handleLogout = async () => {
		await apiService.logout();
		navigate("/login");
	};

	const handleNavigate = (page: "assessments" | "marks" | "copo") => {
		if (page === "assessments") {
			navigate("/assessments");
		} else if (page === "copo") {
			navigate("/copo");
		}
	};

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

	if (!user) {
		return null;
	}

	return (
		<>
			<Toaster />
			<div className="flex h-screen bg-gray-50 dark:bg-gray-950">
				{/* Sidebar */}
				<AssessmentsSidebar
					user={user}
					sidebarOpen={sidebarOpen}
					onLogout={handleLogout}
					currentPage="marks"
					onNavigate={handleNavigate}
				/>

				{/* Main Content */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Header */}
					<AssessmentsHeader
						sidebarOpen={sidebarOpen}
						onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
						courses={courses}
						selectedCourse={selectedCourse}
						onCourseChange={setSelectedCourse}
						onCreateNew={() => {}}
						isMarksPage={true}
					/>

					{/* Dashboard Content */}
					<main className="flex-1 overflow-auto">
						<ScrollArea className="h-full">
							<div className="p-6">
								{!selectedTest ? (
									<MarksEntrySelector
										course={selectedCourse}
										onTestSelected={handleTestSelected}
									/>
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
								) : entryMode === "view-all" ? (
									<ViewTestMarks
										test={selectedTest}
										course={selectedCourse}
										onBack={handleBackToSelection}
									/>
								) : (
									<div className="space-y-6">
										{selectedTest && (
											<button
												onClick={handleBackToTestList}
												className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M10 19l-7-7m0 0l7-7m-7 7h18"
													/>
												</svg>
												Back to Test Selection
											</button>
										)}
										<div className="flex flex-col items-center gap-6 py-12">
											<div className="text-center">
												{selectedTest ? (
													<>
														<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
															{selectedTest.name}
														</h2>
														<p className="text-gray-500 dark:text-gray-400">
															Choose how you want
															to enter marks
														</p>
													</>
												) : (
													<>
														<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
															Marks Management
														</h2>
														<p className="text-gray-500 dark:text-gray-400">
															Choose an entry mode
															to get started
														</p>
													</>
												)}
											</div>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
												<button
													onClick={() =>
														setEntryMode(
															"by-question"
														)
													}
													className="p-6 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
												>
													<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
														Bulk Marks Entry
													</h3>
													<p className="text-sm text-gray-500 dark:text-gray-400">
														Enter marks for multiple
														students in tabular
														format
													</p>
												</button>
												<button
													onClick={() =>
														setEntryMode("by-co")
													}
													className="p-6 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
												>
													<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
														By CO
													</h3>
													<p className="text-sm text-gray-500 dark:text-gray-400">
														Enter aggregated marks
														per CO directly
													</p>
												</button>
												<button
													onClick={() =>
														setEntryMode("view-all")
													}
													className="p-6 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
												>
													<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
														View All Marks
													</h3>
													<p className="text-sm text-gray-500 dark:text-gray-400">
														View marks for all
														students in this test
													</p>
												</button>
											</div>
										</div>
									</div>
								)}
							</div>
						</ScrollArea>
					</main>
				</div>
			</div>
		</>
	);
}
