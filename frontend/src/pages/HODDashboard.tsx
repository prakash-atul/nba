import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type {
	User,
	HODStats,
	DepartmentCourse,
	DepartmentFaculty,
	Course,
} from "@/services/api";
import {
	HODSidebar,
	HODHeader,
	HODStatsCards,
	HODQuickAccess,
	CoursesManagement,
	FacultyManagement,
	type HODPage,
} from "@/components/hod";
import { AssessmentsHeader } from "@/components/assessments/AssessmentsHeader";
import { CreateAssessmentForm } from "@/components/assessments/CreateAssessmentForm";
import { TestsList } from "@/components/assessments/TestsList";
import { EnrollStudentsDialog } from "@/components/assessments/EnrollStudentsDialog";
import { MarksEntrySelector } from "@/components/marks/MarksEntrySelector";
import { MarksEntryByQuestion } from "@/components/marks/MarksEntryByQuestion";
import { MarksEntryByCO } from "@/components/marks/MarksEntryByCO";
import { ViewTestMarks } from "@/components/marks/ViewTestMarks";
import { COPOMapping } from "@/components/copo";
import type { Test } from "@/services/api";

export function HODDashboard() {
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [currentPage, setCurrentPage] = useState<HODPage>("dashboard");
	const [isLoading, setIsLoading] = useState(false);

	// Dashboard data
	const [stats, setStats] = useState<HODStats>({
		totalCourses: 0,
		totalFaculty: 0,
		totalStudents: 0,
		totalAssessments: 0,
	});
	const [courses, setCourses] = useState<DepartmentCourse[]>([]);
	const [faculty, setFaculty] = useState<DepartmentFaculty[]>([]);

	// Assessment page data (for faculty features)
	const [facultyCourses, setFacultyCourses] = useState<Course[]>([]);
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showEnrollDialog, setShowEnrollDialog] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Marks page state
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
		if (storedUser.role !== "hod") {
			// Redirect based on role
			if (storedUser.role === "admin") {
				navigate("/dashboard");
			} else if (storedUser.role === "faculty") {
				navigate("/assessments");
			} else {
				navigate("/login");
			}
			return;
		}
		setUser(storedUser);
		loadDashboardData();
		loadFacultyCourses();
	}, [navigate]);

	const loadDashboardData = async () => {
		setIsLoading(true);
		try {
			const [statsData, coursesData, facultyData] = await Promise.all([
				apiService.getHODStats(),
				apiService.getDepartmentCourses(),
				apiService.getDepartmentFaculty(),
			]);
			setStats(statsData);
			setCourses(coursesData);
			setFaculty(facultyData);
		} catch (error) {
			toast.error("Failed to load dashboard data");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadFacultyCourses = async () => {
		try {
			const coursesData = await apiService.getCourses();
			setFacultyCourses(coursesData);
		} catch (error) {
			console.error("Failed to load faculty courses:", error);
		}
	};

	const handleLogout = async () => {
		await apiService.logout();
		navigate("/login");
	};

	const handleNavigate = (page: HODPage) => {
		setCurrentPage(page);
		// Reset assessment form state when navigating away
		if (page !== "assessments") {
			setShowCreateForm(false);
		}
		// Reset marks page state when navigating away
		if (page !== "marks") {
			setSelectedTest(null);
			setEntryMode(null);
		}
	};

	const handleAssessmentCreated = (courseId?: number) => {
		setShowCreateForm(false);
		if (courseId) {
			const course = facultyCourses.find((c) => c.id === courseId);
			if (course) {
				setSelectedCourse(course);
			}
		}
		setRefreshTrigger((prev) => prev + 1);
		loadDashboardData(); // Refresh stats
	};

	if (!user) {
		return null;
	}

	const renderContent = () => {
		switch (currentPage) {
			case "dashboard":
				return (
					<div className="space-y-6">
						<HODStatsCards stats={stats} isLoading={isLoading} />
						<div>
							<h2 className="text-lg font-semibold mb-4">
								Quick Access
							</h2>
							<HODQuickAccess onNavigate={handleNavigate} />
						</div>
					</div>
				);

			case "courses":
				return (
					<CoursesManagement
						courses={courses}
						faculty={faculty}
						isLoading={isLoading}
						onRefresh={loadDashboardData}
					/>
				);

			case "faculty":
				return (
					<FacultyManagement
						faculty={faculty}
						isLoading={isLoading}
						onRefresh={loadDashboardData}
					/>
				);

			case "assessments":
				// Use the same assessment components as faculty
				return (
					<div className="space-y-4">
						<AssessmentsHeader
							sidebarOpen={sidebarOpen}
							onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
							courses={facultyCourses}
							selectedCourse={selectedCourse}
							onCourseChange={setSelectedCourse}
							onCreateNew={() => setShowCreateForm(true)}
							onEnrollStudents={() => setShowEnrollDialog(true)}
						/>
						{showCreateForm ? (
							<CreateAssessmentForm
								selectedCourse={selectedCourse}
								onSuccess={handleAssessmentCreated}
								onCancel={() => setShowCreateForm(false)}
							/>
						) : (
							<TestsList
								course={selectedCourse}
								refreshTrigger={refreshTrigger}
							/>
						)}
						<EnrollStudentsDialog
							open={showEnrollDialog}
							onOpenChange={setShowEnrollDialog}
							course={selectedCourse}
						/>
					</div>
				);

			case "marks":
				return (
					<div className="space-y-4">
						<AssessmentsHeader
							sidebarOpen={sidebarOpen}
							onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
							courses={facultyCourses}
							selectedCourse={selectedCourse}
							onCourseChange={(course) => {
								setSelectedCourse(course);
								setSelectedTest(null);
								setEntryMode(null);
							}}
							onCreateNew={() => {}}
							isMarksPage={true}
						/>
						{!selectedTest ? (
							<MarksEntrySelector
								course={selectedCourse}
								onTestSelected={(test) => {
									setSelectedTest(test);
									setEntryMode(null);
								}}
							/>
						) : entryMode === "by-question" ? (
							<MarksEntryByQuestion
								test={selectedTest}
								course={selectedCourse}
								onBack={() => setEntryMode(null)}
							/>
						) : entryMode === "by-co" ? (
							<MarksEntryByCO
								test={selectedTest}
								course={selectedCourse}
								onBack={() => setEntryMode(null)}
							/>
						) : entryMode === "view-all" ? (
							<ViewTestMarks
								test={selectedTest}
								course={selectedCourse}
								onBack={() => setEntryMode(null)}
							/>
						) : (
							<div className="space-y-6">
								<button
									onClick={() => {
										setSelectedTest(null);
										setEntryMode(null);
									}}
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
								<div className="flex flex-col items-center gap-6 py-12">
									<div className="text-center">
										<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
											{selectedTest.name}
										</h2>
										<p className="text-gray-500 dark:text-gray-400">
											Choose how you want to enter marks
										</p>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
										<button
											onClick={() =>
												setEntryMode("by-question")
											}
											className="p-6 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
										>
											<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
												Bulk Marks Entry
											</h3>
											<p className="text-sm text-gray-500 dark:text-gray-400">
												Enter marks for multiple
												students in tabular format
											</p>
										</button>
										<button
											onClick={() =>
												setEntryMode("by-co")
											}
											className="p-6 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
										>
											<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
												By CO
											</h3>
											<p className="text-sm text-gray-500 dark:text-gray-400">
												Enter aggregated marks per CO
												directly
											</p>
										</button>
										<button
											onClick={() =>
												setEntryMode("view-all")
											}
											className="p-6 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
										>
											<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
												View All Marks
											</h3>
											<p className="text-sm text-gray-500 dark:text-gray-400">
												View marks for all students in
												this test
											</p>
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				);

			case "copo":
				return (
					<div className="space-y-4">
						<AssessmentsHeader
							sidebarOpen={sidebarOpen}
							onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
							courses={facultyCourses}
							selectedCourse={selectedCourse}
							onCourseChange={setSelectedCourse}
							onCreateNew={() => {}}
						/>
						{selectedCourse ? (
							<COPOMapping
								courseCode={selectedCourse.course_code}
								courseName={selectedCourse.name}
								courseId={selectedCourse.id}
								facultyName={user.username}
								departmentName={
									user.department_name || "Not Assigned"
								}
								year={selectedCourse.year}
								semester={selectedCourse.semester}
							/>
						) : (
							<div className="flex items-center justify-center h-64">
								<div className="text-center">
									<h3 className="text-lg font-medium text-gray-900 dark:text-white">
										No Course Selected
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
										Please select a course from the dropdown
										above
									</p>
								</div>
							</div>
						)}
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<>
			<Toaster />
			<div className="flex h-screen bg-gray-50 dark:bg-gray-950">
				{/* Sidebar */}
				<HODSidebar
					user={user}
					sidebarOpen={sidebarOpen}
					currentPage={currentPage}
					onNavigate={handleNavigate}
					onLogout={handleLogout}
				/>

				{/* Main Content */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Header */}
					<HODHeader
						sidebarOpen={sidebarOpen}
						onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
						currentPage={currentPage}
						onRefresh={loadDashboardData}
						isLoading={isLoading}
					/>

					{/* Content */}
					<main className="flex-1 overflow-auto">
						<ScrollArea className="h-full">
							<div className="p-6">{renderContent()}</div>
						</ScrollArea>
					</main>
				</div>
			</div>
		</>
	);
}
