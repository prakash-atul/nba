import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { HODStudentsPage } from "./HODStudentsPage";
import { debugLogger } from "@/lib/debugLogger";
import { useEffect } from "react";

export function HODStudents() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	useEffect(() => {
		debugLogger.info("HODStudents", "Component mounted");
	}, []);

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Students Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<HODStudentsPage />
			</div>
		</div>
	);
}
