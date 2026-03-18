import { QuickAccessGrid, type QuickAccessItem } from "@/features/shared";
import { ClipboardList, FileCheck, Network } from "lucide-react";

type FacultyPage = "dashboard" | "assessments" | "marks" | "copo";

interface FacultyQuickAccessProps {
	onNavigate: (page: FacultyPage) => void;
}

export function FacultyQuickAccess({ onNavigate }: FacultyQuickAccessProps) {
	const quickAccessItems: QuickAccessItem[] = [
		{
			id: "assessments",
			title: "Manage Assessments",
			description: "Create and manage course assessments",
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
			title: "CO-PO Analysis",
			description: "View course outcome attainment",
			icon: Network,
			gradient: "from-emerald-500 to-teal-600",
		},
	];

	return (
		<QuickAccessGrid
			items={quickAccessItems}
			onItemClick={(id) => onNavigate(id as FacultyPage)}
			variant="elevated"
			columns={3}
		/>
	);
}
