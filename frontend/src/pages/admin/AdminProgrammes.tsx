import { useOutletContext } from "react-router-dom";
import { ProgrammesView } from "@/components/admin";
import { AppHeader } from "@/components/layout";
import { apiService } from "@/services/api";

export function AdminProgrammes() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Programme Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					await apiService.logout();
					window.location.href = "/login";
				}}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6">
				<ProgrammesView />
			</div>
		</div>
	);
}
