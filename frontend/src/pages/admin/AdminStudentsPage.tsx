import { adminApi } from "@/services/api/admin";
import { StudentList } from "@/features/users";

export function AdminStudentsPage() {
	return (
		<StudentList
			fetchFn={(params) => adminApi.getAllStudents(params)}
			permissions={{
				canViewDepartment: true,
				allowDepartmentFilter: true,
			}}
			title="All Students"
			showPhone={false}
			showEnrolledCourses={true}
			availableFilters={["department", "batch", "status", "course"]}
		/>
	);
}
