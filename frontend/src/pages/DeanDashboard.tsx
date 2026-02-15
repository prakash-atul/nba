import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import type {
	User,
	DeanStats,
	DeanDepartment,
	DeanUser,
	DeanCourse,
	DeanStudent,
	DeanTest,
	DepartmentAnalytics,
} from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
	DeanStatsCards,
	DepartmentsView,
	UsersView,
	CoursesView,
	StudentsView,
	TestsView,
	AnalyticsView,
	HODManagement,
	type DeanPage,
} from "@/components/dean";
import { AppSidebar, AppHeader, type NavItem } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Building2,
	Users as UsersIcon,
	BookOpen,
	GraduationCap,
	ClipboardList,
	BarChart3,
	LayoutDashboard,
	UserCog,
} from "lucide-react";

const deanNavItems: NavItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "departments", label: "Departments", icon: Building2 },
	{ id: "hod-management", label: "HOD Management", icon: UserCog },
	{ id: "users", label: "Users", icon: UsersIcon },
	{ id: "courses", label: "Courses", icon: BookOpen },
	{ id: "students", label: "Students", icon: GraduationCap },
	{ id: "assessments", label: "Assessments", icon: ClipboardList },
	{ id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function DeanDashboard() {
	const [currentPage, setCurrentPage] = useState<DeanPage>("dashboard");
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const navigate = useNavigate();

	// Data states
	const [stats, setStats] = useState<DeanStats>({
		totalDepartments: 0,
		totalUsers: 0,
		totalCourses: 0,
		totalStudents: 0,
		totalAssessments: 0,
		usersByRole: {
			hod: 0,
			faculty: 0,
			staff: 0,
		},
	});
	const [departments, setDepartments] = useState<DeanDepartment[]>([]);
	const [users, setUsers] = useState<DeanUser[]>([]);
	const [courses, setCourses] = useState<DeanCourse[]>([]);
	const [students, setStudents] = useState<DeanStudent[]>([]);
	const [tests, setTests] = useState<DeanTest[]>([]);
	const [analytics, setAnalytics] = useState<DepartmentAnalytics[]>([]);

	// Loading states
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Get current user
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		if (!storedUser) {
			navigate("/login");
			return;
		}
		// Only allow dean status
		if (!storedUser.is_dean) {
			// Redirect based on role
			if (storedUser.role === "admin") {
				navigate("/dashboard");
			} else if (storedUser.is_hod) {
				navigate("/hod");
			} else if (storedUser.role === "faculty") {
				navigate("/faculty");
			} else if (storedUser.role === "staff") {
				navigate("/staff");
			} else {
				navigate("/login");
			}
			return;
		}
		setCurrentUser(storedUser);
		fetchAllData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigate]);

	const fetchAllData = async () => {
		setLoading(true);
		try {
			const [statsData, departmentsData] = await Promise.all([
				apiService.getDeanStats(),
				apiService.getDeanDepartments(),
			]);
			setStats(statsData);
			setDepartments(departmentsData);

			// Fetch data based on active view
			await fetchViewData(currentPage);
		} catch (error) {
			console.error("Failed to fetch data:", error);
			toast.error("Failed to load dashboard data");
		} finally {
			setLoading(false);
		}
	};

	const fetchViewData = async (view: string) => {
		try {
			switch (view) {
				case "departments":
				case "hod-management": {
					const departmentsData =
						await apiService.getDeanDepartments();
					setDepartments(departmentsData);
					break;
				}
				case "users":
					const usersData = await apiService.getDeanUsers();
					setUsers(usersData);
					break;
				case "courses":
					const coursesData = await apiService.getDeanCourses();
					setCourses(coursesData);
					break;
				case "students":
					const studentsData = await apiService.getDeanStudents();
					setStudents(studentsData);
					break;
				case "assessments":
					const testsData = await apiService.getDeanTests();
					setTests(testsData);
					break;
				case "analytics":
					const analyticsData =
						await apiService.getDepartmentAnalytics();
					setAnalytics(analyticsData);
					break;
			}
		} catch (error) {
			console.error(`Failed to fetch ${view}:`, error);
		}
	};

	const handlePageChange = async (page: DeanPage) => {
		setCurrentPage(page);
		setRefreshing(true);
		await fetchViewData(page);
		setRefreshing(false);
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			const [statsData, departmentsData] = await Promise.all([
				apiService.getDeanStats(),
				apiService.getDeanDepartments(),
			]);
			setStats(statsData);
			setDepartments(departmentsData);
			await fetchViewData(currentPage);
		} catch (error) {
			toast.error("Failed to refresh data");
		} finally {
			setRefreshing(false);
		}
	};

	const handleLogout = async () => {
		await apiService.logout();
		navigate("/login");
	};

	const renderContent = () => {
		if (loading) {
			return (
				<div className="flex items-center justify-center h-64">
					<RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
				</div>
			);
		}

		switch (currentPage) {
			case "dashboard":
				return (
					<div className="space-y-6">
						<DeanStatsCards stats={stats} isLoading={refreshing} />

						{/* Quick Access Cards */}
						<div>
							<h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
								Quick Access
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<QuickAccessCard
									title="Departments"
									description="View all departments and their details"
									icon={Building2}
									onClick={() =>
										handlePageChange("departments")
									}
								/>
								<QuickAccessCard
									title="HOD Management"
									description="Appoint and manage department HODs"
									icon={UserCog}
									onClick={() =>
										handlePageChange("hod-management")
									}
								/>
								<QuickAccessCard
									title="Users"
									description="View all users across departments"
									icon={UsersIcon}
									onClick={() => handlePageChange("users")}
								/>
								<QuickAccessCard
									title="Courses"
									description="View all courses and enrollments"
									icon={BookOpen}
									onClick={() => handlePageChange("courses")}
								/>
								<QuickAccessCard
									title="Students"
									description="View all enrolled students"
									icon={GraduationCap}
									onClick={() => handlePageChange("students")}
								/>
								<QuickAccessCard
									title="Assessments"
									description="View all tests and assessments"
									icon={ClipboardList}
									onClick={() =>
										handlePageChange("assessments")
									}
								/>
								<QuickAccessCard
									title="Analytics"
									description="View department-wise analytics"
									icon={BarChart3}
									onClick={() =>
										handlePageChange("analytics")
									}
								/>
							</div>
						</div>
					</div>
				);

			case "departments":
				return (
					<DepartmentsView
						departments={departments}
						isLoading={refreshing}
					/>
				);

			case "hod-management":
				return (
					<HODManagement
						departments={departments}
						isLoading={refreshing}
						onSuccess={handleRefresh}
					/>
				);

			case "users":
				return <UsersView users={users} isLoading={refreshing} />;

			case "courses":
				return <CoursesView courses={courses} isLoading={refreshing} />;

			case "students":
				return (
					<StudentsView students={students} isLoading={refreshing} />
				);

			case "assessments":
				return <TestsView tests={tests} isLoading={refreshing} />;

			case "analytics":
				return (
					<AnalyticsView
						analytics={analytics}
						isLoading={refreshing}
					/>
				);

			default:
				return (
					<div className="space-y-6">
						<DeanStatsCards stats={stats} isLoading={refreshing} />
					</div>
				);
		}
	};

	// Don't render until user is verified
	if (!currentUser) {
		return null;
	}

	return (
		<div className="flex h-screen bg-gray-50 dark:bg-gray-950">
			<AppSidebar
				user={currentUser}
				sidebarOpen={sidebarOpen}
				items={deanNavItems}
				activeId={currentPage}
				onNavigate={(id) => handlePageChange(id as DeanPage)}
				onLogout={handleLogout}
				title="Tezpur University"
				subtitle="Academic Dean"
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<AppHeader
					sidebarOpen={sidebarOpen}
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
					title={currentPage}
					description={`Welcome back, ${
						currentUser?.username?.split(" ")[0] || "Dean"
					}!`}
				>
					<Button
						variant="outline"
						size="icon"
						onClick={handleRefresh}
						disabled={refreshing}
					>
						<RefreshCw
							className={`w-4 h-4 ${
								refreshing ? "animate-spin" : ""
							}`}
						/>
					</Button>
				</AppHeader>

				{/* Dashboard Content */}
				<main className="flex-1 overflow-auto">
					<ScrollArea className="h-full">
						<div className="p-6">{renderContent()}</div>
					</ScrollArea>
				</main>
			</div>
			<Toaster />
		</div>
	);
}

// Quick Access Card Component
function QuickAccessCard({
	title,
	description,
	icon: Icon,
	onClick,
}: {
	title: string;
	description: string;
	icon: React.ElementType;
	onClick: () => void;
}) {
	return (
		<Card
			className="cursor-pointer hover:shadow-md transition-all hover:border-purple-300 dark:hover:border-purple-700 group"
			onClick={onClick}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
						<Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
					</div>
					<Eye className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
				</div>
			</CardHeader>
			<CardContent>
				<CardTitle className="text-base mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
					{title}
				</CardTitle>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					{description}
				</p>
			</CardContent>
		</Card>
	);
}
