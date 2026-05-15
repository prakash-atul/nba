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

	async getCourseTests(offeringId: number): Promise<Test[]> {
		debugLogger.info("coursesApi", "getCourseTests called");
		const response = await apiGetFull<{
			course: Course;
			tests: Test[];
		}>(`/course-tests?offering_id=${offeringId}`);

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
		offeringId: number,
		testId?: number,
	): Promise<CourseEnrollmentsResponse["data"]> {
		debugLogger.info("coursesApi", "getCourseEnrollments called");
		const url = testId
			? `/offerings/${offeringId}/enrollments?test_id=${testId}`
			: `/offerings/${offeringId}/enrollments`;

		return apiGet<CourseEnrollmentsResponse["data"]>(url);
	},

	async getAttainmentConfig(offeringId: number): Promise<AttainmentConfig> {
		debugLogger.info("coursesApi", "getAttainmentConfig called");
		return apiGet<AttainmentConfig>(
			`/offerings/${offeringId}/attainment-config`,
		);
	},

	async saveAttainmentConfig(
		config: SaveAttainmentConfigRequest,
	): Promise<{ success: boolean; message: string }> {
		debugLogger.info("coursesApi", "saveAttainmentConfig called");
		return apiPostFull<SaveAttainmentConfigRequest, void>(
			`/offerings/${config.offering_id}/attainment-config`,
			config,
		);
	},

	async getCoPoMatrix(offeringId: number): Promise<CoPoMappingRow[]> {
		debugLogger.info("coursesApi", "getCoPoMatrix called");
		return apiGet<CoPoMappingRow[]>(`/offerings/${offeringId}/copo-matrix`);
	},

	async saveCoPoMatrix(
		offeringId: number,
		mappings: SaveCoPoMatrixRequest["mappings"],
	): Promise<void> {
		debugLogger.info("coursesApi", "saveCoPoMatrix called");
		return apiPost<SaveCoPoMatrixRequest, void>(
			`/offerings/${offeringId}/copo-matrix`,
			{ mappings },
		);
	},

	async enrollStudents(
		offeringId: number,
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
		>(`/offerings/${offeringId}/enroll`, { students });
	},
};
