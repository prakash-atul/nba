import { StatsGrid, type StatItem } from "@/components/shared";
import { Users, BookOpen, GraduationCap, ClipboardList } from "lucide-react";
import type { AdminStats } from "@/services/api";

interface StatsCardsProps {
	stats: AdminStats;
	isLoading?: boolean;
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
	const statItems: StatItem[] = [
		{
			label: "Total Users",
			value: stats.totalUsers,
			icon: Users,
			gradient: "from-blue-500 to-blue-600",
			description: "All registered users",
		},
		{
			label: "Total Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			gradient: "from-purple-500 to-purple-600",
			description: "Active courses",
		},
		{
			label: "Total Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			gradient: "from-green-500 to-green-600",
			description: "Enrolled students",
		},
		{
			label: "Assessments",
			value: stats.totalAssessments,
			icon: ClipboardList,
			gradient: "from-orange-500 to-orange-600",
			description: "Tests created",
		},
	];

	return (
		<StatsGrid
			stats={statItems}
			isLoading={isLoading}
			variant="gradient"
			columns={4}
		/>
	);
}
