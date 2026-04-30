import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { adminApi, apiService } from "@/services/api";
import { CourseList } from "@/features/courses/CourseList";
import { usePaginatedData } from "@/lib/usePaginatedData";
import type {
	PaginationParams,
	PaginatedResponse,
	AdminCourse,
	Department,
} from "@/services/api";

export function AdminCourses() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	const { data: departments } = usePaginatedData<Department>({
		fetchFn: (params) => adminApi.getAllDepartments(params),
		limit: 100,
		defaultSort: "d.department_code",
	});

	const fetchCourses = async (
		params: PaginationParams,
	): Promise<PaginatedResponse<AdminCourse>> => {
		return adminApi.getAllCourses(params);
	};

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Courses Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					await apiService.logout();
					window.location.href = "/login";
				}}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<CourseList
					fetchFn={fetchCourses}
					title="Courses"
					permissions={{
						canCreate: false,
						canEdit: false,
						canDelete: false,
						canViewDepartment: true,
						allowDepartmentFilter: true,
					}}
					availableFilters={[
						"department",
						"semester",
						"year",
						"status",
						"type",
					]}
					showType={true}
					showStatus={true}
					showLevel={true}
					departments={departments}
				/>
			</div>
		</div>
	);
}
