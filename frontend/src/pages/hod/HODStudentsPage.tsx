import { hodApi } from "@/services/api/hod";
import type { UpdateStudentRequest } from "@/services/api";
import { StudentList } from "@/features/users";
import { debugLogger } from "@/lib/debugLogger";

export function HODStudentsPage() {
	const handleStudentUpdate = async (
		rollNo: string,
		data: UpdateStudentRequest,
	) => {
		debugLogger.info("HODStudentsPage", "handleStudentUpdate starting", {
			rollNo,
		});
		try {
			await hodApi.updateStudent(rollNo, data);
		} catch (error) {
			debugLogger.error(
				"HODStudentsPage",
				"handleStudentUpdate failed",
				error,
			);
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
			showEnrolledCourses={true}
			availableFilters={["batch", "status"]}
			onStudentUpdate={handleStudentUpdate}
		/>
	);
}

