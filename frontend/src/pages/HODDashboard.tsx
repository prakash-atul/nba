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
	type HODPage,
} from "@/components/hod";
import { AssessmentsHeader } from "@/components/assessments/AssessmentsHeader";
import { CreateAssessmentForm } from "@/components/assessments/CreateAssessmentForm";
import { TestsList } from "@/components/assessments/TestsList";
import { EnrollStudentsDialog } from "@/components/assessments/EnrollStudentsDialog";

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
				// Redirect to marks page
				navigate("/marks");
				return null;

			case "copo":
				// Redirect to copo page
				navigate("/copo");
				return null;

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
