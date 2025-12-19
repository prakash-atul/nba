import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	LayoutDashboard,
	BookOpen,
	ClipboardList,
	FileCheck,
	Network,
	LogOut,
	Settings,
} from "lucide-react";
import type { User } from "@/services/api";

export type HODPage =
	| "dashboard"
	| "courses"
	| "assessments"
	| "marks"
	| "copo";

interface HODSidebarProps {
	user: User;
	sidebarOpen: boolean;
	currentPage: HODPage;
	onNavigate: (page: HODPage) => void;
	onLogout: () => void;
}

export function HODSidebar({
	user,
	sidebarOpen,
	currentPage,
	onNavigate,
	onLogout,
}: HODSidebarProps) {
	const navItems = [
		{
			id: "dashboard" as HODPage,
			label: "Dashboard",
			icon: LayoutDashboard,
		},
		{ id: "courses" as HODPage, label: "Manage Courses", icon: BookOpen },
		{
			id: "assessments" as HODPage,
			label: "Assessments",
			icon: ClipboardList,
		},
		{ id: "marks" as HODPage, label: "Marks Entry", icon: FileCheck },
		{ id: "copo" as HODPage, label: "CO-PO Mapping", icon: Network },
	];

	return (
		<aside
			className={`${
				sidebarOpen ? "w-64" : "w-0"
			} transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden`}
		>
			<div className="flex flex-col h-full">
				{/* University Info */}
				<div className="p-6 border-b border-gray-200 dark:border-gray-800">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
							TU
						</div>
						<div className="flex-1 min-w-0">
							<h2 className="text-sm font-bold text-gray-900 dark:text-white">
								Tezpur University
							</h2>
							<p className="text-xs text-gray-600 dark:text-gray-400 truncate">
								{user.department_name || "Department"}
							</p>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<ScrollArea className="flex-1 px-3 py-4">
					<nav className="space-y-1">
						{navItems.map((item) => (
							<button
								key={item.id}
								onClick={() => onNavigate(item.id)}
								className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
									currentPage === item.id
										? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
										: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
								}`}
							>
								<item.icon className="w-5 h-5" />
								<span>{item.label}</span>
							</button>
						))}
					</nav>

					<Separator className="my-4" />

					{/* Settings & Logout */}
					<div className="space-y-1">
						<button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
							<Settings className="w-5 h-5" />
							<span>Settings</span>
						</button>
						<button
							onClick={onLogout}
							className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
						>
							<LogOut className="w-5 h-5" />
							<span>Logout</span>
						</button>
					</div>
				</ScrollArea>

				{/* User Profile */}
				<div className="p-4 border-t border-gray-200 dark:border-gray-800">
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarFallback className="bg-linear-to-br from-emerald-500 to-teal-600 text-white">
								{user.username
									.split(" ")
									.map((n) => n[0])
									.join("")
									.toUpperCase()
									.slice(0, 2)}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
								{user.username}
							</p>
							<p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
								Head of Department
							</p>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
