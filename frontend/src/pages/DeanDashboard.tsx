import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import type {
	User,
	DeanStats,
	DeanDepartment,
	DepartmentAnalytics,
} from "@/services/api";
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

	const [stats, setStats] = useState<DeanStats>({
		totalDepartments: 0,
		totalUsers: 0,
		totalCourses: 0,
		totalStudents: 0,
		totalAssessments: 0,
		usersByRole: { hod: 0, faculty: 0, staff: 0 },
	});
	const [departments, setDepartments] = useState<DeanDepartment[]>([]);
	const [analytics, setAnalytics] = useState<DepartmentAnalytics[]>([]);
	const [analyticsLoading, setAnalyticsLoading] = useState(false);
	const [statsLoading, setStatsLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		if (!storedUser) {
			navigate("/login");
			return;
		}
		if (!storedUser.is_dean) {
			if (storedUser.role === "admin") navigate("/dashboard");
			else if (storedUser.role === "hod") navigate("/hod");
			else if (storedUser.role === "faculty") navigate("/faculty");
			else if (storedUser.role === "staff") navigate("/staff");
			else navigate("/login");
			return;
		}
		setCurrentUser(storedUser);
		Promise.all([
			apiService.getDeanStats(),
			apiService.getDeanDepartments(),
		])
			.then(([statsData, deptData]) => {
				setStats(statsData);
				setDepartments(deptData.data);
			})
			.catch(() => toast.error("Failed to load stats"))
			.finally(() => setStatsLoading(false));
	}, [navigate]);

	const handleLogout = async () => {
		await apiService.logout();
		navigate("/login");
	};

	const handlePageChange = (page: DeanPage) => {
		setCurrentPage(page);
		if (page === "analytics") {
			setAnalyticsLoading(true);
			apiService
				.getDepartmentAnalytics()
				.then(setAnalytics)
				.catch(() => toast.error("Failed to load analytics"))
				.finally(() => setAnalyticsLoading(false));
		}
	};

	const renderContent = () => {
		if (statsLoading) {
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
						<DeanStatsCards stats={stats} isLoading={false} />
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
				return <DepartmentsView />;
			case "hod-management":
				return (
					<HODManagement
						departments={departments}
						isLoading={false}
						onSuccess={() =>
							apiService
								.getDeanDepartments()
								.then((res) => setDepartments(res.data))
								.catch(() => {})
						}
					/>
				);
			case "users":
				return <UsersView />;
			case "courses":
				return <CoursesView />;
			case "students":
				return <StudentsView />;
			case "assessments":
				return <TestsView />;
			case "analytics":
				return (
					<AnalyticsView
						analytics={analytics}
						isLoading={analyticsLoading}
					/>
				);
			default:
				return <DeanStatsCards stats={stats} isLoading={false} />;
		}
	};

	if (!currentUser) return null;

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
			<div className="flex-1 flex flex-col overflow-hidden">
				<AppHeader
					sidebarOpen={sidebarOpen}
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
					title={currentPage}
					description={`Welcome back, ${currentUser?.username?.split(" ")[0] || "Dean"}!`}
				/>
				<main className="flex-1 overflow-y-auto">
					<div className="p-6">{renderContent()}</div>
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
