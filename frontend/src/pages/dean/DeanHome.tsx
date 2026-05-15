import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { apiService } from "@/services/api";
import type { DeanStats } from "@/services/api";
import { toast } from "sonner";
import { Loader2, UserCheck, Users } from "lucide-react";
import { StatsGrid } from "@/features/shared";
import { createDeanStats } from "@/features/shared/statsFactory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DeanHome() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	const [stats, setStats] = useState<DeanStats>({
		totalDepartments: 0,
		totalUsers: 0,
		totalCourses: 0,
		totalStudents: 0,
		totalAssessments: 0,
		usersByRole: { hod: 0, faculty: 0, staff: 0 },
	});
	const [statsLoading, setStatsLoading] = useState(true);

	useEffect(() => {
		apiService
			.getDeanStats()
			.then((statsData) => {
				setStats(statsData);
			})
			.catch(() => toast.error("Failed to load stats"))
			.finally(() => setStatsLoading(false));
	}, []);

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Dean Dashboard"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				{statsLoading ? (
					<div className="flex items-center justify-center h-full">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<>
						<StatsGrid
							stats={createDeanStats(stats)}
							isLoading={statsLoading}
							variant="outline"
							columns={5}
						/>

						{/* Users by Role Breakdown */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card className="border-l-4 border-l-emerald-500">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-medium flex items-center gap-2">
										<Users className="h-4 w-4 text-emerald-500" />
										Faculty
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-emerald-600">
										{stats?.usersByRole?.faculty || 0}
									</div>
								</CardContent>
							</Card>

							<Card className="border-l-4 border-l-blue-500">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-medium flex items-center gap-2">
										<UserCheck className="h-4 w-4 text-blue-500" />
										Staff
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-blue-600">
										{stats?.usersByRole?.staff || 0}
									</div>
								</CardContent>
							</Card>

							<Card className="border-l-4 border-l-orange-500">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-medium flex items-center gap-2">
										<Users className="h-4 w-4 text-orange-500" />
										Students
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-orange-600">
										{stats?.totalStudents || 0}
									</div>
								</CardContent>
							</Card>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
