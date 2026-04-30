import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { AdminStudentsPage } from "./AdminStudentsPage";

export function AdminStudents() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="All Students"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<AdminStudentsPage />
			</div>
		</div>
	);
}
