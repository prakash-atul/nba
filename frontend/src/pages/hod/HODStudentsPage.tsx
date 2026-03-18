import { hodApi } from "@/services/api/hod";
import type { UpdateStudentRequest } from "@/services/api";
import { StudentList } from "@/features/users";

export function HODStudentsPage() {
	const handleStudentUpdate = async (
		rollNo: string,
		data: UpdateStudentRequest,
	) => {
		try {
			await hodApi.updateStudent(rollNo, data);
		} catch (error) {
			console.error("Failed to update student:", error);
			throw error;
		}
	};

	return (
		<StudentList
			fetchFn={(params) => hodApi.getDepartmentStudents(params)}
			permissions={{
				canEdit: true,
			}}
			title="Department Students"
			showPhone={true}
			availableFilters={["batch", "status", "course"]}
			onStudentUpdate={handleStudentUpdate}
		/>
	);
}
