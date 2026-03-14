import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import {
	FacultyAssessments,
	FacultyMarks,
	FacultyCOPO,
	FacultyStatsCards,
	FacultyQuickAccess,
	FacultyOverview,
	FacultyStudents,
	type FacultyPage,
} from "@/components/faculty";
import { AppSidebar, AppHeader, type NavItem } from "@/components/layout";
import { apiService } from "@/services/api";
import { facultyApi } from "@/services/api/faculty";
import { usePaginatedData } from "@/lib/usePaginatedData";
import type { User, Course, FacultyStats } from "@/services/api";
import {
	LayoutDashboard,
	ClipboardList,
	FileCheck,
	Network,
	GraduationCap,
	ChevronDown,
	RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const facultyNavItems: NavItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "assessments", label: "Assessments", icon: ClipboardList },
	{ id: "students", label: "Students", icon: GraduationCap },
	{ id: "marks", label: "Marks Entry", icon: FileCheck },
	{ id: "copo", label: "CO-PO Mapping", icon: Network },
];

export function FacultyDashboard() {
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const {
		data: courses,
		loading: isLoadingCourses,
		refresh: refreshCourses,
	} = usePaginatedData<Course>({
		fetchFn: facultyApi.getCourses,
		limit: 100,
	});
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [activeView, setActiveView] = useState<FacultyPage>("dashboard");
	const [isLoading, setIsLoading] = useState(false);
	const [stats, setStats] = useState<FacultyStats>({
		totalCourses: 0,
		totalAssessments: 0,
		totalStudents: 0,
		averageAttainment: 0,
	});
	const navigate = useNavigate();

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		if (!storedUser) {
			navigate("/login");
			return;
		}
		if (storedUser.role !== "faculty") {
			if (storedUser.role === "admin") {
				navigate("/dashboard");
			} else if (storedUser.role === "hod") {
				navigate("/hod");
			} else if (storedUser.is_dean) {
				navigate("/dean");
			} else if (storedUser.role === "staff") {
				navigate("/staff");
			} else {
				navigate("/login");
			}
			return;
		}
		setUser(storedUser);
		loadStats();
	}, [navigate]);

	// Auto-select first course when courses load
	useEffect(() => {
		if (courses.length > 0 && !selectedCourse) {
			setSelectedCourse(courses[0]);
		}
	}, [courses]);

	const loadStats = async () => {
		setIsLoading(true);
		try {
			const statsData = await apiService.getFacultyStats();
			setStats(statsData);
		} catch (error) {
			// If the faculty stats endpoint doesn't exist yet, calculate from courses
			console.error("Failed to load faculty stats:", error);
			setStats({
				totalCourses: courses.length,
				totalAssessments: 0,
				totalStudents: 0,
				averageAttainment: 0,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleRefresh = () => {
		loadStats();
		refreshCourses();
	};

	const handleNavigate = (page: FacultyPage) => {
		setActiveView(page);
	};

	const handleLogout = async () => {
		await apiService.logout();
		navigate("/login");
	};

	if (!user) {
		return null;
	}

	return (
		<>
			<Toaster />
			<div className="flex h-screen bg-background">
				<AppSidebar
					items={facultyNavItems}
					user={user}
					activeId={activeView}
					onNavigate={(id) => handleNavigate(id as FacultyPage)}
					onLogout={handleLogout}
					sidebarOpen={sidebarOpen}
				/>

				<div className="flex-1 flex flex-col overflow-hidden">
					<AppHeader
						sidebarOpen={sidebarOpen}
						onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
						title="Faculty Dashboard"
						description={
							activeView === "dashboard"
								? "Overview of your courses and performance"
								: "Manage assessments, marks, and CO-PO mapping."
						}
					>
						<div className="flex items-center gap-3">
							{activeView !== "dashboard" && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="w-[250px] justify-between"
										>
											<span className="truncate text-left">
												{selectedCourse
													? `${selectedCourse.course_code} - ${selectedCourse.course_name}`
													: "Select Course"}
											</span>
											<ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-[250px]">
										{courses.map((course) => (
											<DropdownMenuItem
												key={course.course_id}
												onSelect={() =>
													setSelectedCourse(course)
												}
											>
												{course.course_code} -{" "}
												{course.course_name}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
							{activeView === "dashboard" && (
								<Button
									variant="outline"
									size="icon"
									onClick={handleRefresh}
									disabled={isLoading || isLoadingCourses}
								>
									<RefreshCw
										className={`h-4 w-4 ${
											isLoading || isLoadingCourses
												? "animate-spin"
												: ""
										}`}
									/>
								</Button>
							)}
						</div>
					</AppHeader>

					<main className="flex-1 overflow-hidden">
						{activeView === "dashboard" ? (
							<div className="h-full overflow-y-auto">
								<div className="p-6 space-y-6">
									<FacultyStatsCards
										stats={stats}
											isLoading={isLoading}
									/>
									<div>
										<h2 className="text-lg font-semibold mb-4">
											Quick Access
										</h2>
										<FacultyQuickAccess
											onNavigate={handleNavigate}
										/>
									</div>
									<FacultyOverview
										courses={courses}
										isLoading={isLoading} onRefresh={handleRefresh}
									/>
								</div>
							</div>
						) : activeView === "assessments" ? (
							<FacultyAssessments
								selectedCourse={selectedCourse}
							/>
						) : activeView === "marks" ? (
							<FacultyMarks selectedCourse={selectedCourse} />
						) : activeView === "students" ? (
							<FacultyStudents />
						) : (
							<FacultyCOPO
								selectedCourse={selectedCourse}
								user={user}
							/>
						)}
					</main>
				</div>
			</div>
		</>
	);
}
