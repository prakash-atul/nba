import { useOutletContext } from "react-router-dom";
import { ProgrammeAttainmentDashboard } from "@/features/programmes/ProgrammeAttainmentDashboard";
import { AppHeader } from "@/components/layout";

export function HODProgrammeAttainment() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Programme Attainment"
				description="Batch-wise attainment matrix with KPI summaries, course-level PO/PSO breakdown, and comparison charts."
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6">
				<ProgrammeAttainmentDashboard />
			</div>
		</div>
	);
}
