import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { apiService } from "@/services/api";
import { AuditLogsView } from "../../features/audit/AuditLogsView";

export function AdminLogs() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="System Audit Logs"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					await apiService.logout();
					window.location.href = "/login";
				}}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<AuditLogsView />
			</div>
		</div>
	);
}
