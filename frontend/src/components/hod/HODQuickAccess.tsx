import { QuickAccessGrid, type QuickAccessItem } from "@/components/shared";
import {
	BookOpen,
	ClipboardList,
	FileCheck,
	Network,
	Users,
} from "lucide-react";

type HODPage =
	| "dashboard"
	| "courses"
	| "faculty"
	| "students"
	| "assessments"
	| "marks"
	| "copo";

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
			id: "assessments",
			title: "Create Assessment",
			description: "Create new tests and exams",
			icon: ClipboardList,
			gradient: "from-blue-500 to-indigo-600",
		},
		{
			id: "marks",
			title: "Enter Marks",
			description: "Record student assessment scores",
			icon: FileCheck,
			gradient: "from-purple-500 to-pink-600",
		},
		{
			id: "copo",
			title: "CO-PO Mapping",
			description: "View course outcome attainment",
			icon: Network,
			gradient: "from-orange-500 to-red-600",
		},
	];

	return (
		<QuickAccessGrid
			items={quickAccessItems}
			onItemClick={(id) => onNavigate(id as HODPage)}
			variant="elevated"
			columns={5}
		/>
	);
}
