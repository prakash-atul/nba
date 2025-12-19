import { Menu, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import type { HODPage } from "./HODSidebar";

interface HODHeaderProps {
	sidebarOpen: boolean;
	onToggleSidebar: () => void;
	currentPage: HODPage;
	onRefresh?: () => void;
	isLoading?: boolean;
}

const pageTitles: Record<HODPage, string> = {
	dashboard: "HOD Dashboard",
	courses: "Manage Courses",
	assessments: "Assessments",
	marks: "Marks Entry",
	copo: "CO-PO Mapping",
};

export function HODHeader({
	sidebarOpen,
	onToggleSidebar,
	currentPage,
	onRefresh,
	isLoading,
}: HODHeaderProps) {
	return (
		<header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-4 gap-4">
			<Button
				variant="ghost"
				size="icon"
				onClick={onToggleSidebar}
				className="shrink-0"
			>
				{sidebarOpen ? (
					<X className="h-5 w-5" />
				) : (
					<Menu className="h-5 w-5" />
				)}
			</Button>

			<div className="flex-1">
				<h1 className="text-xl font-semibold text-gray-900 dark:text-white">
					{pageTitles[currentPage]}
				</h1>
			</div>

			<div className="flex items-center gap-2">
				{onRefresh && (
					<Button
						variant="outline"
						size="sm"
						onClick={onRefresh}
						disabled={isLoading}
						className="gap-2"
					>
						<RefreshCw
							className={`h-4 w-4 ${
								isLoading ? "animate-spin" : ""
							}`}
						/>
						Refresh
					</Button>
				)}
				<AnimatedThemeToggler />
			</div>
		</header>
	);
}
