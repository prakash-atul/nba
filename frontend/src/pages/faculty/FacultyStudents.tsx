import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { FacultyStudentsPage } from "./FacultyStudentsPage";

export function FacultyStudents() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Students"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					window.location.href = "/login";
				}}
			/>
			<div className="flex-1 overflow-auto p-4 md:p-6 italic">
				<FacultyStudentsPage />
			</div>
		</div>
	);
}
