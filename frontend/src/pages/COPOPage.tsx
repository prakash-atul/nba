import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AssessmentsSidebar } from "@/components/assessments/AssessmentsSidebar";
import { AssessmentsHeader } from "@/components/assessments/AssessmentsHeader";
import { COPOMapping } from "@/components/copo";
import { Toaster } from "@/components/ui/sonner";
import { apiService } from "@/services/api";
import type { User, Course } from "@/services/api";

export function COPOPage() {
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [courses, setCourses] = useState<Course[]>([]);
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		if (!storedUser) {
			navigate("/login");
			return;
		}
		if (storedUser.role !== "faculty") {
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
			// Auto-select first course if available
			if (coursesData.length > 0 && !selectedCourse) {
				setSelectedCourse(coursesData[0]);
			}
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
		} else if (page === "marks") {
			navigate("/marks");
		}
		// If page === "copo", we're already here
	};

	if (!user) {
		return null;
	}

	return (
		<div className="flex h-screen bg-gray-50 dark:bg-gray-950">
			<AssessmentsSidebar
				user={user}
				sidebarOpen={sidebarOpen}
				onLogout={handleLogout}
				currentPage="copo"
				onNavigate={handleNavigate}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				<AssessmentsHeader
					sidebarOpen={sidebarOpen}
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
					courses={courses}
					selectedCourse={selectedCourse}
					onCourseChange={setSelectedCourse}
					onCreateNew={() => {}}
				/>

				<div className="flex-1 overflow-y-auto p-8">
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
						<div className="flex items-center justify-center h-full">
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
			</div>

			<Toaster />
		</div>
	);
}
