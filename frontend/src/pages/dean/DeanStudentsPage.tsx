import { deanApi } from "@/services/api/dean";
import { StudentList } from "@/features/users";
import { useState, useEffect } from "react";
import type { PaginatedResponse } from "@/services/api";
import type { Student } from "@/services/api";

export function DeanStudentsPage() {
	const [departments, setDepartments] = useState<
		{ id: number; name: string }[]
	>([]);
	const [courses, setCourses] = useState<
		{ id: number; course_code: string; course_name: string }[]
	>([]);

	useEffect(() => {
		deanApi
			.getAllDepartments()
			.then((res) => {
				setDepartments(
					res.data.map((d) => ({
						id: d.department_id,
						name: d.department_name,
					})),
				);
			})
			.catch(console.error);

		deanApi
			.getAllCourses()
			.then((res) => {
				setCourses(
					res.data.map((c) => ({
						id: c.course_id,
						course_code: c.course_code,
						course_name: c.course_name,
					})),
				);
			})
			.catch(console.error);
	}, []);

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
			availableFilters={["department", "batch", "status", "course"]}
			departments={departments}
			courses={courses}
		/>
	);
}
