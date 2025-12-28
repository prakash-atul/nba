import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import type { User } from "@/services/api";

export interface NavItem {
	id: string;
	label: string;
	icon: React.ElementType;
}

interface AppSidebarProps {
	user: User;
	sidebarOpen: boolean;
	items: NavItem[];
	activeId: string;
	onNavigate: (id: string) => void;
	onLogout: () => void;
	title?: string;
	subtitle?: string;
}

export function AppSidebar({
	user,
	sidebarOpen,
	items,
	activeId,
	onNavigate,
	onLogout,
	title = "Tezpur University",
	subtitle,
}: AppSidebarProps) {
	return (
		<aside
			className={`${
				sidebarOpen ? "w-64" : "w-0"
			} transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden flex-shrink-0`}
		>
			<div className="flex flex-col h-full">
				{/* Header / Logo */}
				<div className="p-6 border-b border-gray-200 dark:border-gray-800">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
							<img
								src="/tulogo.png"
								alt="Tezpur University Logo"
								className="w-full h-full object-contain"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
								{title}
							</h2>
							<p className="text-xs text-gray-600 dark:text-gray-400 truncate">
								{subtitle || user.department_name || user.role}
							</p>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<ScrollArea className="flex-1 px-3 py-4">
					<nav className="space-y-1">
						{items.map((item) => {
							const Icon = item.icon;
							const isActive = activeId === item.id;
							return (
								<button
									key={item.id}
									onClick={() => onNavigate(item.id)}
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

					{/* Logout */}
					<div className="space-y-1">
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
							<AvatarFallback className="bg-blue-100 text-blue-600">
								{user.username.substring(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
								{user.username}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
								{user.email}
							</p>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
