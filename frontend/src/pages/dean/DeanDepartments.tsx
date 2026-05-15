import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { DepartmentsView } from "@/components/dean";

export function DeanDepartments() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Departments Overview"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<DepartmentsView />
			</div>
		</div>
	);
}
