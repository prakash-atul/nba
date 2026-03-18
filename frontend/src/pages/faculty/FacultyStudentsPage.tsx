import { facultyApi } from "@/services/api/faculty";
import type { UpdateStudentRequest } from "@/services/api";
import { StudentList } from "@/features/users";

export function FacultyStudentsPage() {
	const handleStudentUpdate = async (
		rollNo: string,
		data: UpdateStudentRequest,
	) => {
		try {
			await facultyApi.updateStudent(rollNo, data);
		} catch (error) {
			console.error("Failed to update student:", error);
			throw error;
		}
	};

	const handleStudentDelete = async (rollNo: string) => {
		try {
			await facultyApi.removeStudentEnrollment(rollNo);
		} catch (error) {
			console.error("Failed to delete student:", error);
			throw error;
		}
	};

	return (
		<StudentList
			fetchFn={async () => {
				const students = await facultyApi.getEnrolledStudents();
				return {
					success: true,
					message: "ok",
					data: students,
					pagination: {
						next_cursor: null,
						prev_cursor: null,
						has_more: false,
						total: students.length,
						limit: students.length,
					},
				};
			}}
			paginationMode="client"
			permissions={{
				canEdit: true,
				canDelete: true,
			}}
			title="Enrolled Students"
			showPhone={true}
			showEnrolledCourses={true}
			availableFilters={["batch", "status", "course"]}
			onStudentUpdate={handleStudentUpdate}
			onStudentDelete={handleStudentDelete}
		/>
	);
}
