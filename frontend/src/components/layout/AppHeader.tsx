import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

interface AppHeaderProps {
	sidebarOpen: boolean;
	onToggleSidebar: () => void;
	title: string;
	description?: string;
	onLogout?: () => void;
	children?: React.ReactNode; // For custom actions like Refresh, Course Selector
}

export function AppHeader({
	sidebarOpen,
	onToggleSidebar,
	title,
	description,
	onLogout,
	children,
}: AppHeaderProps) {
	return (
		<header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={onToggleSidebar}
					className="text-gray-700 dark:text-gray-300"
				>
					{sidebarOpen ? (
						<ChevronLeft className="w-5 h-5" />
					) : (
						<ChevronRight className="w-5 h-5" />
					)}
				</Button>
				<div>
					<h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
						{title}
					</h1>
					{description && (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							{description}
						</p>
					)}
				</div>
			</div>

			<div className="flex items-center gap-3">
				{children}
				<AnimatedThemeToggler />
				{onLogout && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onLogout}
						className="text-gray-700 dark:text-gray-300 ml-2"
						title="Logout"
					>
						<LogOut className="w-5 h-5" />
					</Button>
				)}
			</div>
		</header>
	);
}
