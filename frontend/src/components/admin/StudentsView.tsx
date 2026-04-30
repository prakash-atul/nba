import { StudentList } from "@/features/users/StudentList";
import { adminApi } from "@/services/api/admin";

export function StudentsView() {
	return (
		<StudentList
			title="All Students"
			fetchFn={(params) => adminApi.getAllStudents(params)}
			permissions={{
				canEdit: true,
				canDelete: true,
				canViewDepartment: true,
				allowDepartmentFilter: true,
			}}
			availableFilters={["department", "batch", "status", "course"]}
			showEnrolledCourses={true}
		/>
	);
}
