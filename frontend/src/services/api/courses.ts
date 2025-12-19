import { API_BASE_URL, apiGet, tokenManager } from "./base";
import type {
	Course,
	Test,
	AttainmentConfig,
	SaveAttainmentConfigRequest,
	CourseEnrollmentsResponse,
} from "./types";

export const coursesApi = {
	async getCourses(): Promise<Course[]> {
		return apiGet<Course[]>("/courses");
	},

	async getCourseTests(courseId: number): Promise<Test[]> {
		const response = await fetch(
			`${API_BASE_URL}/course-tests?course_id=${courseId}`,
			{
				headers: tokenManager.getAuthHeaders(),
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch tests");
		}

		// API returns { success: true, message: "...", data: { course: {...}, tests: [...] } }
		if (data.data && data.data.tests && Array.isArray(data.data.tests)) {
			return data.data.tests;
		}

		return [];
	},

	async getCourseEnrollments(
		courseId: number,
		testId?: number
	): Promise<CourseEnrollmentsResponse["data"]> {
		const url = testId
			? `/courses/${courseId}/enrollments?test_id=${testId}`
			: `/courses/${courseId}/enrollments`;

		return apiGet<CourseEnrollmentsResponse["data"]>(url);
	},

	async getAttainmentConfig(courseId: number): Promise<AttainmentConfig> {
		return apiGet<AttainmentConfig>(
			`/courses/${courseId}/attainment-config`
		);
	},

	async saveAttainmentConfig(
		config: SaveAttainmentConfigRequest
	): Promise<{ success: boolean; message: string }> {
		const response = await fetch(
			`${API_BASE_URL}/courses/${config.course_id}/attainment-config`,
			{
				method: "POST",
				headers: tokenManager.getJsonHeaders(),
				body: JSON.stringify(config),
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.message || "Failed to save attainment configuration"
			);
		}

		return data;
	},
};
