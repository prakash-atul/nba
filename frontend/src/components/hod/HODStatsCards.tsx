import { StatsGrid, type StatItem } from "@/components/shared";
import { BookOpen, Users, GraduationCap, ClipboardList } from "lucide-react";
import type { HODStats } from "@/services/api";

interface HODStatsCardsProps {
	stats: HODStats;
	isLoading: boolean;
}

export function HODStatsCards({ stats, isLoading }: HODStatsCardsProps) {
	const statItems: StatItem[] = [
		{
			label: "Department Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			gradient: "from-emerald-500 to-teal-600",
			bgGradient:
				"from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
		},
		{
			label: "Faculty Members",
			value: stats.totalFaculty,
			icon: Users,
			gradient: "from-blue-500 to-indigo-600",
			bgGradient:
				"from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
		},
		{
			label: "Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			gradient: "from-purple-500 to-pink-600",
			bgGradient:
				"from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
		},
		{
			label: "Assessments",
			value: stats.totalAssessments,
			icon: ClipboardList,
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
