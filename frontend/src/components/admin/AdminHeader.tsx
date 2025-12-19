import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Menu, X, RefreshCw } from "lucide-react";
import type { User } from "@/services/api";

interface AdminHeaderProps {
	sidebarOpen: boolean;
	activeNav: string;
	currentUser: User | null;
	refreshing: boolean;
	onToggleSidebar: () => void;
	onRefresh: () => void;
}

export function AdminHeader({
	sidebarOpen,
	activeNav,
	currentUser,
	refreshing,
	onToggleSidebar,
	onRefresh,
}: AdminHeaderProps) {
	return (
		<header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={onToggleSidebar}
					className="text-gray-700 dark:text-gray-300"
				>
					{sidebarOpen ? (
						<X className="w-5 h-5" />
					) : (
						<Menu className="w-5 h-5" />
					)}
				</Button>
				<div>
					<h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
						{activeNav}
					</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Welcome back,{" "}
						{currentUser?.username?.split(" ")[0] || "Admin"}!
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="icon"
					onClick={onRefresh}
					disabled={refreshing}
				>
					<RefreshCw
						className={`w-4 h-4 ${
							refreshing ? "animate-spin" : ""
						}`}
					/>
				</Button>
				<AnimatedThemeToggler />
			</div>
		</header>
	);
}
