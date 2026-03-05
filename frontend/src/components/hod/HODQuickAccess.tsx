import { QuickAccessGrid, type QuickAccessItem } from "@/components/shared";
import { BookOpen, Users, GraduationCap } from "lucide-react";

type HODPage = "dashboard" | "courses" | "faculty" | "students";

interface HODQuickAccessProps {
	onNavigate: (page: HODPage) => void;
}

export function HODQuickAccess({ onNavigate }: HODQuickAccessProps) {
	const quickAccessItems: QuickAccessItem[] = [
		{
			id: "courses",
			title: "Manage Courses",
			description: "Add, edit, or remove department courses",
			icon: BookOpen,
			gradient: "from-emerald-500 to-teal-600",
		},
		{
			id: "faculty",
			title: "Faculty & Staff",
			description: "Manage department members",
			icon: Users,
			gradient: "from-cyan-500 to-blue-600",
		},
		{
			id: "students",
			title: "Students",
			description: "View and manage department students",
			icon: GraduationCap,
			gradient: "from-purple-500 to-pink-600",
		},
	];

	return (
		<QuickAccessGrid
			items={quickAccessItems}
			onItemClick={(id) => onNavigate(id as HODPage)}
			variant="elevated"
			columns={3}
		/>
	);
}
