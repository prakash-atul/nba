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
} from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
	AdminSidebar,
	AdminHeader,
	StatsCards,
	QuickAccessCards,
	UsersView,
	CoursesView,
	StudentsView,
	TestsView,
} from "@/components/admin";

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
			// Redirect based on role
			if (storedUser.role === "hod") {
				navigate("/hod");
			} else if (storedUser.role === "faculty") {
				navigate("/assessments");
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
		<div className="flex h-screen bg-gray-50 dark:bg-gray-950">
			<AdminSidebar
				sidebarOpen={sidebarOpen}
				activeNav={activeNav}
				currentUser={currentUser}
				onNavChange={handleNavChange}
				onLogout={handleLogout}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<AdminHeader
					sidebarOpen={sidebarOpen}
					activeNav={activeNav}
					currentUser={currentUser}
					refreshing={refreshing}
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
					onRefresh={handleRefresh}
				/>

				{/* Dashboard Content */}
				<main className="flex-1 overflow-auto">
					<ScrollArea className="h-full">
						<div className="p-6">{renderContent()}</div>
					</ScrollArea>
				</main>
			</div>
		</div>
	);
}
