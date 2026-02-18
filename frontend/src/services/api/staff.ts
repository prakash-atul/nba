import type {
	StaffStats,
	StaffCourse,
	Enrollment,
	Student,
	PaginatedResponse,
	PaginationParams,
} from "./types";
import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from "./base";

export const staffApi = {
	/**
	 * Get staff dashboard statistics
	 */
	async getStats(): Promise<StaffStats> {
		return apiGet<StaffStats>("/staff/stats");
	},

	/**
	 * Get all courses for the staff's department — paginated
	 */
	async getDepartmentCourses(
		params?: PaginationParams,
	): Promise<PaginatedResponse<StaffCourse>> {
		return apiGetPaginated<StaffCourse>("/staff/courses", params);
	},

	/**
	 * Get all students in the department — paginated
	 */
	async getDepartmentStudents(
		params?: PaginationParams,
	): Promise<PaginatedResponse<Student>> {
		return apiGetPaginated<Student>("/staff/students", params);
	},

	/**
	 * Get enrollments for a specific course
	 */
	async getCourseEnrollments(courseId: number): Promise<{
		course_id: number;
		course_code: string;
		course_name: string;
		enrollment_count: number;
		enrollments: Enrollment[];
	}> {
		return apiGet<{
			course_id: number;
			course_code: string;
			course_name: string;
			enrollment_count: number;
			enrollments: Enrollment[];
		}>(`/staff/courses/${courseId}/enrollments`);
	},

	/**
	 * Bulk enroll students in a course
	 */
	async bulkEnrollStudents(
		courseId: number,
		students: Array<{ rollno: string; name: string }>,
	): Promise<{
		success_count: number;
		failure_count: number;
		successful: Array<{ rollno: string; name: string }>;
		failed: Array<{ rollno: string; name: string; reason: string }>;
	}> {
		return apiPost<
			{ students: Array<{ rollno: string; name: string }> },
			{
				success_count: number;
				failure_count: number;
				successful: Array<{ rollno: string; name: string }>;
				failed: Array<{ rollno: string; name: string; reason: string }>;
			}
		>(`/staff/courses/${courseId}/enroll`, { students });
	},

	/**
	 * Remove a student from a course
	 */
	async removeEnrollment(courseId: number, rollno: string): Promise<void> {
		return apiDelete(`/staff/courses/${courseId}/enroll/${rollno}`);
	},

	/**
	 * Get department faculty list — paginated
	 */
	async getDepartmentFaculty(
		params?: PaginationParams,
	): Promise<
		PaginatedResponse<{
			employee_id: string;
			username: string;
			email: string;
			role: string;
		}>
	> {
		return apiGetPaginated<{
			employee_id: string;
			username: string;
			email: string;
			role: string;
		}>("/staff/faculty", params);
	},

	/**
	 * Create a new course
	 */
	async createCourse(courseData: {
		course_code: string;
		name: string;
		credit: number;
		faculty_id: string;
		year: number;
		semester: string;
		co_threshold?: number;
		passing_threshold?: number;
	}): Promise<StaffCourse> {
		return apiPost<
			{
				course_code: string;
				name: string;
				credit: number;
				faculty_id: string;
				year: number;
				semester: string;
				co_threshold?: number;
				passing_threshold?: number;
			},
			StaffCourse
		>("/staff/courses", courseData);
	},

	/**
	 * Update an existing course
	 */
	async updateCourse(
		courseId: number,
		courseData: {
			course_code?: string;
			name?: string;
			credit?: number;
			faculty_id?: string;
			year?: number;
			semester?: string;
		},
	): Promise<StaffCourse> {
		return apiPut<
			{
				course_code?: string;
				name?: string;
				credit?: number;
				faculty_id?: string;
				year?: number;
				semester?: string;
			},
			StaffCourse
		>(`/staff/courses/${courseId}`, courseData);
	},

	/**
	 * Delete a course
	 */
	async deleteCourse(courseId: number): Promise<void> {
		return apiDelete(`/staff/courses/${courseId}`);
	},
};
