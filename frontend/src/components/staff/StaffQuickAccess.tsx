import { QuickAccessGrid, type QuickAccessItem } from "@/components/shared";
import { BookOpen, UserPlus } from "lucide-react";

type StaffPage = "courses" | "enrollments";

interface StaffQuickAccessProps {
	onNavigate: (page: StaffPage) => void;
}

export function StaffQuickAccess({ onNavigate }: StaffQuickAccessProps) {
	const quickAccessItems: QuickAccessItem[] = [
		{
			id: "courses",
			title: "View Courses",
			description: "Browse all department courses and their details",
			icon: BookOpen,
			gradient: "from-blue-500 to-indigo-600",
		},
		{
			id: "enrollments",
			title: "Enroll Students",
			description: "Add students to courses via CSV upload",
			icon: UserPlus,
			gradient: "from-emerald-500 to-teal-600",
		},
	];

	return (
		<QuickAccessGrid
			items={quickAccessItems}
			onItemClick={(id) => onNavigate(id as StaffPage)}
			variant="elevated"
			columns={2}
		/>
	);
}
