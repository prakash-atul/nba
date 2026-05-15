import { useOutletContext } from "react-router-dom";
import { SchoolsView, DeanHistoryView } from "@/components/admin";
import { AppHeader } from "@/components/layout";
import { apiService } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, History } from "lucide-react";

export function AdminSchools() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="School Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					await apiService.logout();
					window.location.href = "/login";
				}}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6">
				<Tabs defaultValue="management" className="space-y-4">
					<TabsList>
						<TabsTrigger value="management">
							<Building2 className="w-4 h-4 mr-2" />
							Schools & Deans
						</TabsTrigger>
						<TabsTrigger value="history">
							<History className="w-4 h-4 mr-2" />
							Dean Assignment History
						</TabsTrigger>
					</TabsList>

					<TabsContent value="management" className="space-y-4">
						<SchoolsView />
					</TabsContent>

					<TabsContent value="history" className="space-y-4">
						<DeanHistoryView />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
