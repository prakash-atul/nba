import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { apiService } from "@/services/api";
import type { HODStats } from "@/services/api";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
	StatsGrid,
	QuickAccessGrid,
	type QuickAccessItem,
} from "@/features/shared";
import { createHODStats } from "@/features/shared/statsFactory";
import { AppHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GraduationCap, History } from "lucide-react";

export function HODHome() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();
	const [stats, setStats] = useState<HODStats>({
		totalFaculty: 0,
		totalCourses: 0,
		totalStudents: 0,
		totalAssessments: 0,
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadStats();
	}, []);

	const loadStats = async () => {
		setIsLoading(true);
		try {
			const statsData = await apiService.getHODStats();
			setStats(statsData);
		} catch (error) {
			console.error("Failed to load HOD stats:", error);
			toast.error("Failed to load statistics");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="HOD Dashboard"
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
							Department Overview
						</h1>
						<p className="text-muted-foreground">
							Manage your department's faculty, students, and
							courses.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={loadStats}
						disabled={isLoading}
						className="hidden sm:flex"
					>
						<RefreshCw
							className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center h-64">
						<RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
					</div>
				) : (
					<>
						<StatsGrid
							stats={createHODStats({
								departmentCourses: stats.totalCourses,
								facultyMembers: stats.totalFaculty,
								students: stats.totalStudents,
								assessments: stats.totalAssessments,
							})}
							isLoading={isLoading}
							variant="solid"
							columns={4}
						/>
						<QuickAccessGrid
							items={
								[
									{
										id: "courses",
										title: "Manage Courses",
										description:
											"Add, edit, or remove department courses",
										icon: BookOpen,
									},
									{
										id: "faculty",
										title: "Faculty & Staff",
										description:
											"Manage department members",
										icon: Users,
									},
									{
										id: "students",
										title: "Students",
										description:
											"View and manage department students",
										icon: GraduationCap,
									},
									{
										id: "logs",
										title: "Audit Logs",
										description:
											"View recent activity logs in your department",
										icon: History,
									},
								] as QuickAccessItem[]
							}
							onItemClick={(nav) =>
								(window.location.href = `/hod/${nav}`)
							}
							variant="elevated"
							columns={4}
						/>
					</>
				)}
			</div>
		</div>
	);
}
