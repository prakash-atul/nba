import { deanApi } from "@/services/api/dean";
import { StudentList } from "@/features/users";
import type { PaginatedResponse } from "@/services/api";
import type { Student } from "@/services/api";

export function DeanStudentsPage() {
	return (
		<StudentList
			fetchFn={async (params) => {
				const response = await deanApi.getAllStudents(params);
				return {
					...response,
					data: response.data as Student[],
				} as PaginatedResponse<Student>;
			}}
			permissions={{
				canViewDepartment: true,
				allowDepartmentFilter: true,
			}}
			title="All Students"
			showPhone={true}
			showEnrolledCourses={true}
			availableFilters={["department", "batch", "status"]}
		/>
	);
}

