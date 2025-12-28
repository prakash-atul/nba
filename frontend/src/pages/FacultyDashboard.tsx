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
	type FacultyPage,
} from "@/components/faculty";
import { AppSidebar, AppHeader, type NavItem } from "@/components/layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiService } from "@/services/api";
import type { User, Course, FacultyStats } from "@/services/api";
import {
	LayoutDashboard,
	ClipboardList,
	FileCheck,
	Network,
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
	{ id: "marks", label: "Marks Entry", icon: FileCheck },
	{ id: "copo", label: "CO-PO Mapping", icon: Network },
];

export function FacultyDashboard() {
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [courses, setCourses] = useState<Course[]>([]);
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
		if (storedUser.role !== "faculty" && storedUser.role !== "hod") {
			// Allow HOD to access this dashboard too if they want, or redirect?
			// Usually strict role check. But user said HOD reuses components.
			// For now, let's stick to faculty role check or redirect to respective dashboard.
			// If HOD logs in, they go to /hod. If they navigate here manually, maybe allow?
			// Let's assume this is primarily for Faculty role.
			if (storedUser.role === "admin") {
				navigate("/dashboard");
				return;
			}
			if (storedUser.role === "dean") {
				navigate("/dean");
				return;
			}
			if (storedUser.role === "staff") {
				navigate("/staff");
				return;
			}
			// If HOD, they might want to see this view for their own courses.
		}
		setUser(storedUser);
		loadCourses();
		loadStats();
	}, [navigate]);

	const loadCourses = async () => {
		try {
			const coursesData = await apiService.getCourses();
			setCourses(coursesData);
			// Auto-select first course if available and none selected
			if (coursesData.length > 0 && !selectedCourse) {
				setSelectedCourse(coursesData[0]);
			}
		} catch (error) {
			console.error("Failed to load courses:", error);
		}
	};

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
		loadCourses();
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
			<div className="flex h-screen bg-gray-50 dark:bg-gray-950">
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
													? `${selectedCourse.course_code} - ${selectedCourse.name}`
													: "Select Course"}
											</span>
											<ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-[250px]">
										{courses.map((course) => (
											<DropdownMenuItem
												key={course.id}
												onSelect={() =>
													setSelectedCourse(course)
												}
											>
												{course.course_code} -{" "}
												{course.name}
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
									disabled={isLoading}
								>
									<RefreshCw
										className={`h-4 w-4 ${
											isLoading ? "animate-spin" : ""
										}`}
									/>
								</Button>
							)}
						</div>
					</AppHeader>

					<main className="flex-1 overflow-hidden">
						{activeView === "dashboard" ? (
							<ScrollArea className="h-full">
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
										isLoading={isLoading}
									/>
								</div>
							</ScrollArea>
						) : activeView === "assessments" ? (
							<FacultyAssessments
								selectedCourse={selectedCourse}
							/>
						) : activeView === "marks" ? (
							<FacultyMarks selectedCourse={selectedCourse} />
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
