import { useOutletContext } from "react-router-dom";
import { FacultyManagement } from "@/components/hod";
import { AppHeader } from "@/components/layout";
import { apiService } from "@/services/api";

export function HODFaculty() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Faculty Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					await apiService.logout();
					window.location.href = "/login";
				}}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 italic">
				<FacultyManagement />
			</div>
		</div>
	);
}
