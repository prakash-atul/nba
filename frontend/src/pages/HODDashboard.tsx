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
	HODStatsCards,
	HODQuickAccess,
	CoursesManagement,
	FacultyManagement,
	type HODPage,
} from "@/components/hod";
import { FacultyAssessments } from "@/components/faculty/FacultyAssessments";
import { FacultyMarks } from "@/components/faculty/FacultyMarks";
import { FacultyCOPO } from "@/components/faculty/FacultyCOPO";
import { AppSidebar, AppHeader, type NavItem } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
	LayoutDashboard,
	BookOpen,
	ClipboardList,
	FileCheck,
	Network,
	Users,
	RefreshCw,
	ChevronDown,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const hodNavItems: NavItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "courses", label: "Manage Courses", icon: BookOpen },
	{ id: "faculty", label: "Faculty & Staff", icon: Users },
	{ id: "assessments", label: "Assessments", icon: ClipboardList },
	{ id: "marks", label: "Marks Entry", icon: FileCheck },
	{ id: "copo", label: "CO-PO Mapping", icon: Network },
];

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
				return <FacultyAssessments selectedCourse={selectedCourse} />;

			case "marks":
				return <FacultyMarks selectedCourse={selectedCourse} />;

			case "copo":
				return (
					<FacultyCOPO selectedCourse={selectedCourse} user={user} />
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
				<AppSidebar
					user={user}
					sidebarOpen={sidebarOpen}
					items={hodNavItems}
					activeId={currentPage}
					onNavigate={(id) => handleNavigate(id as HODPage)}
					onLogout={handleLogout}
					title="Tezpur University"
					subtitle={user.department_name || "Department"}
				/>

				{/* Main Content */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Header */}
					<AppHeader
						sidebarOpen={sidebarOpen}
						onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
						title={
							currentPage === "dashboard"
								? "HOD Dashboard"
								: currentPage
						}
						description={
							["assessments", "marks", "copo"].includes(
								currentPage
							)
								? "Manage your academic activities"
								: undefined
						}
					>
						{["assessments", "marks", "copo"].includes(
							currentPage
						) ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="w-[250px] justify-between"
									>
										<span className="truncate text-left">
											{selectedCourse
												? `${selectedCourse.course_code} - ${selectedCourse.name}`
												: "All Courses"}
										</span>
										<ChevronDown className="w-4 h-4 ml-2 shrink-0" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-[300px]"
								>
									<DropdownMenuItem
										onClick={() => setSelectedCourse(null)}
									>
										All Courses
									</DropdownMenuItem>
									{facultyCourses.map((course) => (
										<DropdownMenuItem
											key={course.id}
											onClick={() =>
												setSelectedCourse(course)
											}
										>
											<div className="flex flex-col">
												<span className="font-medium">
													{course.course_code} -{" "}
													{course.name}
												</span>
												<span className="text-xs text-gray-500">
													{course.semester} Semester,
													Year {course.year}
												</span>
											</div>
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<Button
								variant="outline"
								size="icon"
								onClick={loadDashboardData}
								disabled={isLoading}
							>
								<RefreshCw
									className={`w-4 h-4 ${
										isLoading ? "animate-spin" : ""
									}`}
								/>
							</Button>
						)}
					</AppHeader>

					{/* Content */}
					<main className="flex-1 overflow-auto">
						<ScrollArea className="h-full">
							{["assessments", "marks", "copo"].includes(
								currentPage
							) ? (
								// Faculty components handle their own padding/layout
								<div className="h-full">{renderContent()}</div>
							) : (
								// Standard HOD pages need padding
								<div className="p-6">{renderContent()}</div>
							)}
						</ScrollArea>
					</main>
				</div>
			</div>
		</>
	);
}
