import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { UserList } from "@/features/users";
import { adminApi } from "@/services/api/admin";
import { apiService } from "@/services/api";

export function AdminUsers() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="User Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					await apiService.logout();
					window.location.href = "/login";
				}}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<UserList
					fetchFn={(params) => adminApi.getAllUsers(params)}
					title="User Management"
					permissions={{
						canCreate: true,
						canEdit: true,
						canDelete: true,
						canViewDepartment: true,
					}}
					availableFilters={["role"]}
					showRole={true}
					showDepartment={true}
					showPhone={true}
					showDesignation={true}
					showEmail={true}
					showDeanStatus={true}
				/>
			</div>
		</div>
	);
}
