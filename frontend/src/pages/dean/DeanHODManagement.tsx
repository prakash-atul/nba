import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { HODManagement } from "@/components/dean";
import { apiService } from "@/services/api";
import type { DeanDepartment } from "@/services/api";
import { toast } from "sonner";

export function DeanHODManagement() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	const [departments, setDepartments] = useState<DeanDepartment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchDepartments = async () => {
		setIsLoading(true);
		try {
			const deptData = await apiService.getDeanDepartments();
			setDepartments(deptData.data);
		} catch (error) {
			toast.error("Failed to load departments");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDepartments();
	}, []);

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="HOD Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<HODManagement
					departments={departments}
					isLoading={isLoading}
					onSuccess={fetchDepartments}
				/>
			</div>
		</div>
	);
}
