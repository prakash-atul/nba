import { COPOMapping } from "@/components/copo";
import type { Course, User } from "@/services/api";

interface FacultyCOPOProps {
	selectedCourse: Course | null;
	user: User;
}

export function FacultyCOPO({ selectedCourse, user }: FacultyCOPOProps) {
	if (!selectedCourse) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<h3 className="text-lg font-medium text-gray-900 dark:text-white">
						No Course Selected
					</h3>
					<p className="text-gray-500 dark:text-gray-400 mt-1">
						Please select a course from the top menu to view CO-PO
						mapping.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto p-8">
			<COPOMapping
				courseCode={selectedCourse.course_code}
				courseName={selectedCourse.name}
				courseId={selectedCourse.id}
				facultyName={user.username}
				departmentName={user.department_name || "Not Assigned"}
				year={selectedCourse.year}
				semester={selectedCourse.semester}
			/>
		</div>
	);
}
