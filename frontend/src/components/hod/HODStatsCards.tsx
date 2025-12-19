import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, GraduationCap, ClipboardList } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import type { HODStats } from "@/services/api";

interface HODStatsCardsProps {
	stats: HODStats;
	isLoading: boolean;
}

export function HODStatsCards({ stats, isLoading }: HODStatsCardsProps) {
	const statsData = [
		{
			title: "Department Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			gradient: "from-emerald-500 to-teal-600",
			bgGradient:
				"from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
		},
		{
			title: "Faculty Members",
			value: stats.totalFaculty,
			icon: Users,
			gradient: "from-blue-500 to-indigo-600",
			bgGradient:
				"from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
		},
		{
			title: "Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			gradient: "from-purple-500 to-pink-600",
			bgGradient:
				"from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
		},
		{
			title: "Assessments",
			value: stats.totalAssessments,
			icon: ClipboardList,
			gradient: "from-orange-500 to-red-600",
			bgGradient:
				"from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{statsData.map((stat) => (
				<Card
					key={stat.title}
					className={`bg-linear-to-br ${stat.bgGradient} border-0 shadow-sm hover:shadow-md transition-shadow`}
				>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
							{stat.title}
						</CardTitle>
						<div
							className={`w-10 h-10 rounded-lg bg-linear-to-br ${stat.gradient} flex items-center justify-center`}
						>
							<stat.icon className="w-5 h-5 text-white" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-gray-900 dark:text-white">
							{isLoading ? (
								<span className="animate-pulse">--</span>
							) : (
								<NumberTicker value={stat.value} />
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
