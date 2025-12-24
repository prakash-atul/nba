import { QuickAccessGrid, type QuickAccessItem } from "@/components/shared";
import { Users, BookOpen, GraduationCap, FileText } from "lucide-react";
import type { AdminStats } from "@/services/api";

interface QuickAccessCardsProps {
	stats: AdminStats;
	onNavChange: (navId: string) => void;
}

export function QuickAccessCards({
	stats,
	onNavChange,
}: QuickAccessCardsProps) {
	const items: QuickAccessItem[] = [
		{
			id: "users",
			title: "Manage Users",
			description: "View, add, or remove system users",
			icon: Users,
			value: `${stats.totalUsers} Users`,
		},
		{
			id: "courses",
			title: "View Courses",
			description: "Browse all courses in the system",
			icon: BookOpen,
			value: `${stats.totalCourses} Courses`,
		},
		{
			id: "students",
			title: "View Students",
			description: "Browse all registered students",
			icon: GraduationCap,
			value: `${stats.totalStudents} Students`,
		},
		{
			id: "tests",
			title: "View Tests",
			description: "Browse all assessments/tests",
			icon: FileText,
			value: `${stats.totalAssessments} Tests`,
		},
	];

	return (
		<QuickAccessGrid
			items={items}
			onItemClick={onNavChange}
			variant="default"
			columns={2}
			accentColor="blue"
		/>
	);
}
