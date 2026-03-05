import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import type { User, AdminStats } from "@/services/api";
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

	const [stats, setStats] = useState<AdminStats>({
		totalUsers: 0,
		totalCourses: 0,
		totalStudents: 0,
		totalAssessments: 0,
	});
	const [statsLoading, setStatsLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		if (!storedUser) {
			navigate("/login");
			return;
		}
		if (storedUser.role !== "admin") {
			if (storedUser.is_dean) navigate("/dean");
			else if (storedUser.role === "hod") navigate("/hod");
			else if (storedUser.role === "faculty") navigate("/faculty");
			else if (storedUser.role === "staff") navigate("/staff");
			else navigate("/login");
			return;
		}
		setCurrentUser(storedUser);
		apiService
			.getAdminStats()
			.then(setStats)
			.catch(() => toast.error("Failed to load stats"))
			.finally(() => setStatsLoading(false));
	}, [navigate]);

	const handleRefreshStats = async () => {
		try {
			const statsData = await apiService.getAdminStats();
			setStats(statsData);
			toast.success("Stats refreshed");
		} catch {
			toast.error("Failed to refresh stats");
		}
	};

	const handleLogout = async () => {
		await apiService.logout();
		navigate("/login");
	};

	const renderContent = () => {
		if (statsLoading) {
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
							onNavChange={setActiveNav}
						/>
					</div>
				);
			case "departments":
				return <DepartmentsView />;
			case "users":
				return <UsersView currentUser={currentUser} />;
			case "courses":
				return <CoursesView />;
			case "students":
				return <StudentsView />;
			case "tests":
				return <TestsView />;
			case "schools":
				return <SchoolsView />;
			default:
				return (
					<div className="space-y-6">
						<StatsCards stats={stats} />
						<QuickAccessCards
							stats={stats}
							onNavChange={setActiveNav}
						/>
					</div>
				);
		}
	};

	if (!currentUser) return null;

	return (
		<>
			<Toaster />
			<div className="flex h-screen bg-gray-50 dark:bg-gray-950">
				<AppSidebar
					user={currentUser}
					sidebarOpen={sidebarOpen}
					items={adminNavItems}
					activeId={activeNav}
					onNavigate={setActiveNav}
					onLogout={handleLogout}
					title="NBA System"
					subtitle="Administrator"
				/>
				<div className="flex-1 flex flex-col overflow-hidden">
					<AppHeader
						sidebarOpen={sidebarOpen}
						onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
						title={activeNav}
						description={`Welcome back, ${currentUser?.username?.split(" ")[0] || "Admin"}!`}
					>
						<Button
							variant="outline"
							size="icon"
							onClick={handleRefreshStats}
						>
							<RefreshCw className="w-4 h-4" />
						</Button>
					</AppHeader>
					<main className="flex-1 overflow-y-auto">
						<div className="p-6">{renderContent()}</div>
					</main>
				</div>
			</div>
		</>
	);
}
