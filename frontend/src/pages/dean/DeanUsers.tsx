import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { UserList } from "@/features/users";
import { deanApi } from "@/services/api/dean";

export function DeanUsers() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="All Users"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<UserList
					fetchFn={(params) => deanApi.getAllUsers(params)}
					title="All Users"
					permissions={{
						canViewDepartment: true,
					}}
					availableFilters={["role"]}
					showRole={true}
					showDepartment={true}
					showPhone={false}
					showDesignation={true}
					showEmail={true}
					showDeanStatus={false}
				/>
			</div>
		</div>
	);
}
