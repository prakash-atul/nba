import { StatsGrid, type StatItem } from "@/features/shared";
import {
	BookOpen,
	ClipboardList,
	GraduationCap,
	TrendingUp,
} from "lucide-react";
import type { FacultyStats } from "@/services/api";

interface FacultyStatsCardsProps {
	stats: FacultyStats;
	isLoading: boolean;
}

export function FacultyStatsCards({
	stats,
	isLoading,
}: FacultyStatsCardsProps) {
	const statItems: StatItem[] = [
		{
			label: "My Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			gradient: "from-blue-500 to-indigo-600",
			bgGradient:
				"from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
		},
		{
			label: "Assessments Created",
			value: stats.totalAssessments,
			icon: ClipboardList,
			gradient: "from-purple-500 to-pink-600",
			bgGradient:
				"from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
		},
		{
			label: "Total Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			gradient: "from-emerald-500 to-teal-600",
			bgGradient:
				"from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
		},
		{
			label: "Avg. Attainment",
			value: stats.averageAttainment,
			suffix: "%",
			icon: TrendingUp,
			gradient: "from-orange-500 to-red-600",
			bgGradient:
				"from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30",
		},
	];

	return (
		<StatsGrid
			stats={statItems}
			isLoading={isLoading}
			variant="solid"
			columns={4}
		/>
	);
}
