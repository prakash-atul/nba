import { apiGet, apiPostFull } from "./base";
import type {
	Course,
	Test,
	QuestionResponse,
	CreateAssessmentRequest,
	CreateAssessmentResponse,
} from "./types";

export const assessmentsApi = {
	async createAssessment(
		assessment: CreateAssessmentRequest
	): Promise<CreateAssessmentResponse> {
		const result = await apiPostFull<
			CreateAssessmentRequest,
			{ test: Test; questions: QuestionResponse[] }
		>("/assessment", assessment);

		return {
			success: result.success,
			message: result.message,
			data: result.data,
		};
	},

	async getAssessment(testId: number): Promise<{
		test: Test;
		course: Course;
		questions: QuestionResponse[];
	}> {
		return apiGet<{
			test: Test;
			course: Course;
			questions: QuestionResponse[];
		}>(`/assessment?test_id=${testId}`);
	},
};
