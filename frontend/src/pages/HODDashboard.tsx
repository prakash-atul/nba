import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type { User, HODStats } from "@/services/api";
import {
	HODStatsCards,
	HODQuickAccess,
	CoursesManagement,
	FacultyManagement,
	HODStudents,
	type HODPage,
} from "@/components/hod";
import { AppSidebar, AppHeader, type NavItem } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
	LayoutDashboard,
	BookOpen,
	Users,
	GraduationCap,
	RefreshCw,
} from "lucide-react";

const hodNavItems: NavItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "courses", label: "Manage Courses", icon: BookOpen },
	{ id: "faculty", label: "Faculty & Staff", icon: Users },
	{ id: "students", label: "Students", icon: GraduationCap },
];

export function HODDashboard() {
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [currentPage, setCurrentPage] = useState<HODPage>("dashboard");
	const [isLoading, setIsLoading] = useState(false);

	// Dashboard stats
	const [stats, setStats] = useState<HODStats>({
		totalCourses: 0,
		totalFaculty: 0,
		totalStudents: 0,
		totalAssessments: 0,
	});

	const navigate = useNavigate();

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		if (!storedUser) {
			navigate("/login");
			return;
		}
		if (storedUser.role !== "hod") {
			if (storedUser.role === "admin") {
				navigate("/dashboard");
			} else if (storedUser.is_dean) {
				navigate("/dean");
			} else if (storedUser.role === "faculty") {
				navigate("/faculty");
			} else if (storedUser.role === "staff") {
				navigate("/staff");
			} else {
				navigate("/login");
			}
			return;
		}
		setUser(storedUser);
		loadStats();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigate]);

	const loadStats = async () => {
		setIsLoading(true);
		try {
			const statsData = await apiService.getHODStats();
			setStats(statsData);
		} catch (error) {
			toast.error("Failed to load dashboard data");
			console.error(error);
		} finally {
			setIsLoading(false);
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
				return <CoursesManagement />;

			case "faculty":
				return <FacultyManagement />;

			case "students":
				return <HODStudents />;

			default:
				return null;
		}
	};

	return (
		<>
			<Toaster />
			<div className="flex h-screen bg-background">
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
					>
						<Button
							variant="outline"
							size="icon"
							onClick={loadStats}
							disabled={isLoading}
						>
							<RefreshCw
								className={`w-4 h-4 ${
									isLoading ? "animate-spin" : ""
								}`}
							/>
						</Button>
					</AppHeader>

					{/* Content */}
					<main className="flex-1 overflow-y-auto">
						{currentPage === "students" ? (
							<div className="h-full">{renderContent()}</div>
						) : (
							<div className="p-6">{renderContent()}</div>
						)}
					</main>
				</div>
			</div>
		</>
	);
}
