import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ClipboardList, FileCheck, Network } from "lucide-react";
import type { HODPage } from "./HODSidebar";

interface HODQuickAccessProps {
	onNavigate: (page: HODPage) => void;
}

export function HODQuickAccess({ onNavigate }: HODQuickAccessProps) {
	const quickAccessItems = [
		{
			title: "Manage Courses",
			description: "Add, edit, or remove department courses",
			icon: BookOpen,
			page: "courses" as HODPage,
			gradient: "from-emerald-500 to-teal-600",
		},
		{
			title: "Create Assessment",
			description: "Create new tests and exams",
			icon: ClipboardList,
			page: "assessments" as HODPage,
			gradient: "from-blue-500 to-indigo-600",
		},
		{
			title: "Enter Marks",
			description: "Record student assessment scores",
			icon: FileCheck,
			page: "marks" as HODPage,
			gradient: "from-purple-500 to-pink-600",
		},
		{
			title: "CO-PO Mapping",
			description: "View course outcome attainment",
			icon: Network,
			page: "copo" as HODPage,
			gradient: "from-orange-500 to-red-600",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{quickAccessItems.map((item) => (
				<Card
					key={item.title}
					className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
					onClick={() => onNavigate(item.page)}
				>
					<CardHeader className="pb-2">
						<div
							className={`w-12 h-12 rounded-lg bg-linear-to-br ${item.gradient} flex items-center justify-center mb-3`}
						>
							<item.icon className="w-6 h-6 text-white" />
						</div>
						<CardTitle className="text-lg">{item.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							{item.description}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
