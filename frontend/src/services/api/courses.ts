import { apiGet, apiGetFull, apiPost, apiPostFull } from "./base";
import { debugLogger } from "@/lib/debugLogger";
import type {
	Course,
	Test,
	AttainmentConfig,
	SaveAttainmentConfigRequest,
	CourseEnrollmentsResponse,
	CoPoMappingRow,
	SaveCoPoMatrixRequest,
} from "./types";

export const coursesApi = {
	async getCourses(): Promise<Course[]> {
		debugLogger.info("coursesApi", "getCourses called");
		return apiGet<Course[]>("/courses");
	},

	async getCourseTests(courseId: number): Promise<Test[]> {
		debugLogger.info("coursesApi", "getCourseTests called");
		const response = await apiGetFull<{
			course: Course;
			tests: Test[];
		}>(`/course-tests?course_id=${courseId}`);

		// API returns { success: true, message: "...", data: { course: {...}, tests: [...] } }
		if (
			response.data &&
			response.data.tests &&
			Array.isArray(response.data.tests)
		) {
			return response.data.tests;
		}

		return [];
	},

	async getCourseEnrollments(
		courseId: number,
		testId?: number,
	): Promise<CourseEnrollmentsResponse["data"]> {
		debugLogger.info("coursesApi", "getCourseEnrollments called");
		const url = testId
			? `/offerings/${courseId}/enrollments?test_id=${testId}`
			: `/offerings/${courseId}/enrollments`;

		return apiGet<CourseEnrollmentsResponse["data"]>(url);
	},

	async getAttainmentConfig(courseId: number): Promise<AttainmentConfig> {
		debugLogger.info("coursesApi", "getAttainmentConfig called");
		return apiGet<AttainmentConfig>(
			`/courses/${courseId}/attainment-config`,
		);
	},

	async saveAttainmentConfig(
		config: SaveAttainmentConfigRequest,
	): Promise<{ success: boolean; message: string }> {
		debugLogger.info("coursesApi", "saveAttainmentConfig called");
		return apiPostFull<SaveAttainmentConfigRequest, void>(
			`/courses/${config.course_id}/attainment-config`,
			config,
		);
	},

	async getCoPoMatrix(courseId: number): Promise<CoPoMappingRow[]> {
		debugLogger.info("coursesApi", "getCoPoMatrix called");
		return apiGet<CoPoMappingRow[]>(`/courses/${courseId}/copo-matrix`);
	},

	async saveCoPoMatrix(
		courseId: number,
		mappings: SaveCoPoMatrixRequest["mappings"],
	): Promise<void> {
		debugLogger.info("coursesApi", "saveCoPoMatrix called");
		return apiPost<SaveCoPoMatrixRequest, void>(
			`/courses/${courseId}/copo-matrix`,
			{ mappings },
		);
	},

	async enrollStudents(
		courseId: number,
		students: Array<{ rollno: string; name: string }>,
	): Promise<{
		success_count: number;
		failure_count: number;
		successful: Array<{ rollno: string; name: string }>;
		failed: Array<{
			rollno: string;
			name: string;
			reason: string;
		}>;
	}> {
		return apiPost<
			{ students: Array<{ rollno: string; name: string }> },
			{
				success_count: number;
				failure_count: number;
				successful: Array<{ rollno: string; name: string }>;
				failed: Array<{
					rollno: string;
					name: string;
					reason: string;
				}>;
			}
		>(`/offerings/${courseId}/enroll`, { students });
	},
};
