import { StatsGrid, type StatItem } from "@/components/shared";
import { BookOpen, GraduationCap, UserPlus } from "lucide-react";
import type { StaffStats } from "@/services/api";

interface StaffStatsCardsProps {
	stats: StaffStats;
	isLoading: boolean;
}

export function StaffStatsCards({ stats, isLoading }: StaffStatsCardsProps) {
	const statItems: StatItem[] = [
		{
			label: "Department Courses",
			value: stats.totalCourses,
			icon: BookOpen,
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
			label: "Total Enrollments",
			value: stats.totalEnrollments,
			icon: UserPlus,
			gradient: "from-emerald-500 to-teal-600",
			bgGradient:
				"from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
		},
	];

	return (
		<StatsGrid
			stats={statItems}
			isLoading={isLoading}
			variant="solid"
			columns={3}
		/>
	);
}
