import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import type {
	User,
	AdminStats,
	AdminCourse,
	AdminTest,
	Student,
	Department,
	School,
} from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
	StatsCards,
	QuickAccessCards,
	UsersView,
	CoursesView,
	StudentsView,
	TestsView,
	DepartmentsView,
	SchoolsView,
} from "@/components/admin";
import { AppSidebar, AppHeader, type NavItem } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
	LayoutDashboard,
	Users as UsersIcon,
	BookOpen,
	GraduationCap,
	FileText,
	Building2,
	School as SchoolIcon,
} from "lucide-react";

const adminNavItems: NavItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "schools", label: "Schools", icon: SchoolIcon },
	{ id: "departments", label: "Departments", icon: Building2 },
	{ id: "users", label: "Users", icon: UsersIcon },
	{ id: "courses", label: "Courses", icon: BookOpen },
	{ id: "students", label: "Students", icon: GraduationCap },
	{ id: "tests", label: "Tests", icon: FileText },
];

export function AdminDashboard() {
	const [activeNav, setActiveNav] = useState("dashboard");
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const navigate = useNavigate();

	// Data states
	const [stats, setStats] = useState<AdminStats>({
		totalUsers: 0,
		totalCourses: 0,
		totalStudents: 0,
		totalAssessments: 0,
	});
	const [users, setUsers] = useState<User[]>([]);
	const [courses, setCourses] = useState<AdminCourse[]>([]);
	const [students, setStudents] = useState<Student[]>([]);
	const [tests, setTests] = useState<AdminTest[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [schools, setSchools] = useState<School[]>([]);

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
		// Only allow admin role
		if (storedUser.role !== "admin") {
			// Redirect based on role and flags
			if (storedUser.is_dean) {
				navigate("/dean");
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
				apiService.getAdminStats(),
				apiService.getAllDepartments(),
			]);
			setStats(statsData);
			setDepartments(departmentsData);

			// Fetch data based on active view
			await fetchViewData(activeNav);
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
				case "users":
					const usersData = await apiService.getAllUsers();
					setUsers(usersData);
					break;
				case "departments":
					const [departmentsData, schoolsListForDept] =
						await Promise.all([
							apiService.getAllDepartments(),
							apiService.getAllSchools(),
						]);
					setDepartments(departmentsData);
					setSchools(schoolsListForDept);
					break;
				case "courses":
					const coursesData = await apiService.getAllCoursesAdmin();
					setCourses(coursesData);
					break;
				case "students":
					const studentsData = await apiService.getAllStudentsAdmin();
					setStudents(studentsData);
					break;
				case "tests":
					const testsData = await apiService.getAllTestsAdmin();
					setTests(testsData);
					break;
				case "schools":
					const [schoolsData, usersList] = await Promise.all([
						apiService.getAllSchools(),
						apiService.getAllUsers(),
					]);
					setSchools(schoolsData);
					setUsers(usersList);
					break;
			}
		} catch (error) {
			console.error(`Failed to fetch ${view}:`, error);
		}
	};

	const handleNavChange = async (navId: string) => {
		setActiveNav(navId);
		setRefreshing(true);
		await fetchViewData(navId);
		setRefreshing(false);
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			const statsData = await apiService.getAdminStats();
			setStats(statsData);
			await fetchViewData(activeNav);
			toast.success("Data refreshed successfully");
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

	const handleUserDataRefresh = (newStats: AdminStats, newUsers: User[]) => {
		setStats(newStats);
		setUsers(newUsers);
	};

	const handleDepartmentsRefresh = async () => {
		try {
			const [deptData, schoolsListForDept] = await Promise.all([
				apiService.getAllDepartments(),
				apiService.getAllSchools(),
			]);
			setDepartments(deptData);
			setSchools(schoolsListForDept);
		} catch (error) {
			console.error("Failed to refresh department data:", error);
		}
	};

	const renderContent = () => {
		if (loading) {
			return (
				<div className="flex items-center justify-center h-64">
					<RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
				</div>
			);
		}

		switch (activeNav) {
			case "dashboard":
				return (
					<div className="space-y-6">
						<StatsCards stats={stats} />
						<QuickAccessCards
							stats={stats}
							onNavChange={handleNavChange}
						/>
					</div>
				);
			case "departments":
				return (
					<DepartmentsView
						departments={departments}							schools={schools}						refreshing={refreshing}
						onDataRefresh={handleDepartmentsRefresh}
					/>
				);
			case "users":
				return (
					<UsersView
						users={users}
						departments={departments}
						currentUser={currentUser}
						refreshing={refreshing}
						onDataRefresh={handleUserDataRefresh}
					/>
				);
			case "courses":
				return (
					<CoursesView courses={courses} refreshing={refreshing} />
				);
			case "students":
				return (
					<StudentsView students={students} refreshing={refreshing} />
				);
			case "tests":
				return <TestsView tests={tests} refreshing={refreshing} />;
			case "schools":
				return (
					<SchoolsView
						schools={schools}
						users={users}
						refreshing={refreshing}
						onDataRefresh={() => fetchViewData("schools")}
					/>
				);
			default:
				return (
					<div className="space-y-6">
						<StatsCards stats={stats} />
						<QuickAccessCards
							stats={stats}
							onNavChange={handleNavChange}
						/>
					</div>
				);
		}
	};

	// Don't render until user is verified
	if (!currentUser) {
		return null;
	}

	return (
		<>
			<Toaster />
			<div className="flex h-screen bg-gray-50 dark:bg-gray-950">
				<AppSidebar
					user={currentUser}
					sidebarOpen={sidebarOpen}
					items={adminNavItems}
					activeId={activeNav}
					onNavigate={handleNavChange}
					onLogout={handleLogout}
					title="NBA System"
					subtitle="Administrator"
				/>

				{/* Main Content */}
				<div className="flex-1 flex flex-col overflow-hidden">
					<AppHeader
						sidebarOpen={sidebarOpen}
						onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
						title={activeNav}
						description={`Welcome back, ${
							currentUser?.username?.split(" ")[0] || "Admin"
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
			</div>
		</>
	);
}
