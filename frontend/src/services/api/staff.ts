import type {
	StaffStats,
	StaffCourse,
	Enrollment,
	Student,
	PaginatedResponse,
	PaginationParams,
} from "./types";
import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from "./base";
import { debugLogger } from "@/lib/debugLogger";

export const staffApi = {
	/**
	 * Get staff dashboard statistics
	 */
	async getStats(): Promise<StaffStats> {
		debugLogger.info("staffApi", "getStats called");
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
	 * Get enrollments for a specific course offering
	 */
	async getCourseEnrollments(offeringId: number): Promise<{
		offering_id: number;
		course_id: number;
		course_code: string;
		course_name: string;
		enrollment_count: number;
		enrollments: Enrollment[];
	}> {
		debugLogger.info("staffApi", "getDepartmentCourses called");
		return apiGet<{
			offering_id: number;
			course_id: number;
			course_code: string;
			course_name: string;
			enrollment_count: number;
			enrollments: Enrollment[];
		}>(`/staff/courses/${offeringId}/enrollments`);
	},

	/**
	 * Bulk enroll students in a course offering
	 */
	async bulkEnrollStudents(
		offeringId: number,
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
		>(`/staff/courses/${offeringId}/enrollments`, { students });
	},

	/**
	 * Remove a student from a course offering
	 */
	async removeEnrollment(offeringId: number, rollno: string): Promise<void> {
		debugLogger.info("staffApi", "bulkEnrollStudents called");
		return apiDelete(`/staff/courses/${offeringId}/enrollments/${rollno}`);
	},

	/**
	 * Get department faculty list — paginated
	 */
	async getDepartmentFaculty(params?: PaginationParams): Promise<
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
		debugLogger.info("staffApi", "getDepartmentFaculty called");
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
		offeringId: number,
		courseData: {
			course_code?: string;
			name?: string;
			credit?: number;
			faculty_id?: string;
			year?: number;
			semester?: string;
		},
	): Promise<StaffCourse> {
		debugLogger.info("staffApi", "updateCourse called");
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
		>(`/staff/courses/${offeringId}`, courseData);
	},

	/**
	 * Delete a course
	 */
	async deleteCourse(offeringId: number): Promise<void> {
		debugLogger.info("staffApi", "deleteCourse called");
		return apiDelete(`/staff/courses/${offeringId}`);
	},
};
