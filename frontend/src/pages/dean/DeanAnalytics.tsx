import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { AnalyticsView } from "@/components/dean";
import { apiService } from "@/services/api";
import type { DepartmentAnalytics } from "@/services/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function DeanAnalytics() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	const [analytics, setAnalytics] = useState<DepartmentAnalytics[]>([]);
	const [analyticsLoading, setAnalyticsLoading] = useState(true);

	useEffect(() => {
		apiService
			.getDepartmentAnalytics()
			.then((data) => {
				setAnalytics(data);
			})
			.catch(() => toast.error("Failed to load analytics"))
			.finally(() => setAnalyticsLoading(false));
	}, []);

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Global Analytics"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				{analyticsLoading ? (
					<div className="flex items-center justify-center h-full">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<AnalyticsView
						analytics={analytics}
						isLoading={analyticsLoading}
					/>
				)}
			</div>
		</div>
	);
}
