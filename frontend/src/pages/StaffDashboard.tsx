import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { apiService, staffApi } from "@/services/api";
import type { User, StaffStats } from "@/services/api";
import {
	StaffStatsCards,
	StaffQuickAccess,
	CourseManagement,
	StaffEnrollmentView,
	type StaffPage,
} from "@/components/staff";
import { AppSidebar, AppHeader, type NavItem } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, UserPlus, RefreshCw } from "lucide-react";

const staffNavItems: NavItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "courses", label: "Courses", icon: BookOpen },
	{ id: "enrollments", label: "Student Enrollment", icon: UserPlus },
];

export function StaffDashboard() {
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [currentPage, setCurrentPage] = useState<StaffPage>("dashboard");
	const [isLoading, setIsLoading] = useState(false);

	// Dashboard stats
	const [stats, setStats] = useState<StaffStats>({
		totalCourses: 0,
		totalStudents: 0,
		totalEnrollments: 0,
	});

	const navigate = useNavigate();

	useEffect(() => {
		const storedUser = apiService.getStoredUser();
		if (!storedUser) {
			navigate("/login");
			return;
		}
		if (storedUser.role !== "staff") {
			// Redirect based on role
			if (storedUser.role === "admin") {
				navigate("/dashboard");
			} else if (storedUser.role === "hod") {
				navigate("/hod");
			} else if (storedUser.role === "faculty") {
				navigate("/faculty");
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
			const statsData = await staffApi.getStats();
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

	const handleNavigate = (page: StaffPage) => {
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
						<StaffStatsCards stats={stats} isLoading={isLoading} />
						<div>
							<h2 className="text-lg font-semibold mb-4">
								Quick Access
							</h2>
							<StaffQuickAccess onNavigate={handleNavigate} />
						</div>
					</div>
				);

			case "courses":
				return <CourseManagement />;

			case "enrollments":
				return <StaffEnrollmentView />;

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
					items={staffNavItems}
					activeId={currentPage}
					onNavigate={(id) => handleNavigate(id as StaffPage)}
					onLogout={handleLogout}
					title="Tezpur University"
					subtitle={user.department_name || "Department Staff"}
				/>

				{/* Main Content */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Header */}
					<AppHeader
						sidebarOpen={sidebarOpen}
						onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
						title={currentPage}
						description={`Welcome back, ${
							user.username.split(" ")[0]
						}!`}
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
						<div className="p-6">{renderContent()}</div>
					</main>
				</div>
			</div>
		</>
	);
}
