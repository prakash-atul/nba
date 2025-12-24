import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	StatsGrid,
	StatsGridSkeleton,
	type StatItem,
} from "@/components/shared";
import {
	Building2,
	Users,
	BookOpen,
	GraduationCap,
	ClipboardList,
	UserCheck,
} from "lucide-react";
import type { DeanStats } from "@/services/api";

interface DeanStatsCardsProps {
	stats: DeanStats;
	isLoading?: boolean;
}

export function DeanStatsCards({ stats, isLoading }: DeanStatsCardsProps) {
	if (isLoading) {
		return <StatsGridSkeleton count={5} />;
	}

	const statItems: StatItem[] = [
		{
			label: "Departments",
			value: stats.totalDepartments,
			icon: Building2,
			color: "text-purple-500",
			bgColor: "bg-purple-50 dark:bg-purple-950",
		},
		{
			label: "Total Users",
			value: stats.totalUsers,
			icon: Users,
			color: "text-blue-500",
			bgColor: "bg-blue-50 dark:bg-blue-950",
		},
		{
			label: "Total Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			color: "text-emerald-500",
			bgColor: "bg-emerald-50 dark:bg-emerald-950",
		},
		{
			label: "Total Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			color: "text-orange-500",
			bgColor: "bg-orange-50 dark:bg-orange-950",
		},
		{
			label: "Assessments",
			value: stats.totalAssessments,
			icon: ClipboardList,
			color: "text-pink-500",
			bgColor: "bg-pink-50 dark:bg-pink-950",
		},
	];

	return (
		<div className="space-y-6">
			<StatsGrid stats={statItems} variant="outline" columns={5} />

			{/* Users by Role Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserCheck className="w-5 h-5 text-purple-500" />
						Users by Role
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
							<div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
								<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
									{stats.usersByRole?.hod || 0}
								</p>
								<p className="text-sm text-emerald-600 dark:text-emerald-400">
									HODs
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
							<div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
								<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
									{stats.usersByRole?.faculty || 0}
								</p>
								<p className="text-sm text-blue-600 dark:text-blue-400">
									Faculty
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
							<div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
								<Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
							</div>
							<div>
								<p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
									{stats.usersByRole?.staff || 0}
								</p>
								<p className="text-sm text-orange-600 dark:text-orange-400">
									Staff
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
