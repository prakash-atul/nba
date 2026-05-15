import { useOutletContext } from "react-router-dom";
import { HODProgrammesView } from "@/components/hod/HODProgrammesView";
import { AppHeader } from "@/components/layout";

export function HODProgrammes() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Programmes"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6">
				<HODProgrammesView />
			</div>
		</div>
	);
}
