import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	LayoutDashboard,
	Users,
	BookOpen,
	GraduationCap,
	FileText,
	Settings,
	LogOut,
} from "lucide-react";
import type { User } from "@/services/api";

export type NavItem = {
	id: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
};

export const navItems: NavItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "users", label: "Users", icon: Users },
	{ id: "courses", label: "Courses", icon: BookOpen },
	{ id: "students", label: "Students", icon: GraduationCap },
	{ id: "tests", label: "Tests", icon: FileText },
];

interface AdminSidebarProps {
	sidebarOpen: boolean;
	activeNav: string;
	currentUser: User | null;
	onNavChange: (navId: string) => void;
	onLogout: () => void;
}

export function AdminSidebar({
	sidebarOpen,
	activeNav,
	currentUser,
	onNavChange,
	onLogout,
}: AdminSidebarProps) {
	return (
		<aside
			className={`${
				sidebarOpen ? "w-64" : "w-0"
			} transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden`}
		>
			<div className="flex flex-col h-full">
				{/* Logo */}
				<div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
							<GraduationCap className="w-5 h-5 text-white" />
						</div>
						<span className="font-bold text-lg text-gray-900 dark:text-white">
							NBA System
						</span>
					</div>
				</div>

				{/* Navigation */}
				<ScrollArea className="flex-1 px-3 py-4">
					<nav className="space-y-1">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = activeNav === item.id;
							return (
								<button
									key={item.id}
									onClick={() => onNavChange(item.id)}
									className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
										isActive
											? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
											: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
									}`}
								>
									<Icon className="w-5 h-5" />
									<span>{item.label}</span>
								</button>
							);
						})}
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
							<AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white">
								{currentUser?.username
									?.substring(0, 2)
									.toUpperCase() || "AD"}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
								{currentUser?.username || "Admin User"}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
								{currentUser?.email || "admin@nba.edu"}
							</p>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
