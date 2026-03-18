import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { apiService } from "@/services/api";
import type { AdminStats } from "@/services/api";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
	StatsGrid,
	QuickAccessGrid,
	type QuickAccessItem,
} from "@/features/shared";
import { createAdminStats } from "@/features/shared/statsFactory";
import { AppHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, GraduationCap } from "lucide-react";

export function AdminHome() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();
	const [stats, setStats] = useState<AdminStats>({
		totalUsers: 0,
		totalCourses: 0,
		totalStudents: 0,
		totalAssessments: 0,
	});
	const [statsLoading, setStatsLoading] = useState(true);

	useEffect(() => {
		apiService
			.getAdminStats()
			.then(setStats)
			.catch(() => toast.error("Failed to load stats"))
			.finally(() => setStatsLoading(false));
	}, []);

	const handleRefreshStats = async () => {
		setStatsLoading(true);
		try {
			const statsData = await apiService.getAdminStats();
			setStats(statsData);
			toast.success("Stats refreshed");
		} catch {
			toast.error("Failed to refresh stats");
		} finally {
			setStatsLoading(false);
		}
	};

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Administrator Dashboard"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					await apiService.logout();
					window.location.href = "/login";
				}}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<div className="flex items-center justify-between mb-2">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							Overview
						</h1>
						<p className="text-muted-foreground">
							System-wide metrics and management.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefreshStats}
						disabled={statsLoading}
						className="hidden sm:flex"
					>
						<RefreshCw
							className={`w-4 h-4 mr-2 ${statsLoading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
				</div>

				{statsLoading ? (
					<div className="flex items-center justify-center h-64">
						<RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
					</div>
				) : (
					<>
						<StatsGrid
							stats={createAdminStats(stats)}
							isLoading={statsLoading}
							variant="gradient"
							columns={4}
						/>
						<QuickAccessGrid
							items={
								[
									{
										id: "users",
										title: "Manage Users",
										description:
											"View, add, or remove system users",
										icon: Users,
										value: `${stats.totalUsers} Users`,
									},
									{
										id: "courses",
										title: "View Courses",
										description:
											"Browse all courses in the system",
										icon: BookOpen,
										value: `${stats.totalCourses} Courses`,
									},
									{
										id: "students",
										title: "View Students",
										description:
											"Browse all registered students",
										icon: GraduationCap,
										value: `${stats.totalStudents} Students`,
									},
								] as QuickAccessItem[]
							}
							onItemClick={(nav) =>
								(window.location.href = `/dashboard/${nav}`)
							}
						/>
					</>
				)}
			</div>
		</div>
	);
}
