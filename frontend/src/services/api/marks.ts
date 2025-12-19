import { API_BASE_URL, apiGet, apiPost, tokenManager } from "./base";
import type {
	Course,
	Test,
	SaveMarksByQuestionRequest,
	SaveMarksByCORequest,
	COTotals,
	MarksRecord,
	StudentMarks,
	BulkMarksSaveRequest,
	BulkMarksSaveResponse,
} from "./types";

export const marksApi = {
	async saveMarksByQuestion(
		marksData: SaveMarksByQuestionRequest
	): Promise<{ student_id: string; test_id: number; co_totals: COTotals }> {
		return apiPost<
			SaveMarksByQuestionRequest,
			{ student_id: string; test_id: number; co_totals: COTotals }
		>("/marks/by-question", marksData);
	},

	async saveMarksByCO(marksData: SaveMarksByCORequest): Promise<MarksRecord> {
		return apiPost<SaveMarksByCORequest, MarksRecord>(
			"/marks/by-co",
			marksData
		);
	},

	async saveBulkMarks(
		bulkMarksData: BulkMarksSaveRequest
	): Promise<BulkMarksSaveResponse> {
		const response = await fetch(`${API_BASE_URL}/marks/bulk`, {
			method: "POST",
			headers: tokenManager.getJsonHeaders(),
			body: JSON.stringify(bulkMarksData),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to save bulk marks");
		}

		return data;
	},

	async getStudentMarks(
		testId: number,
		studentId: string
	): Promise<StudentMarks> {
		return apiGet<StudentMarks>(
			`/marks?test_id=${testId}&student_id=${studentId}`
		);
	},

	async getTestMarks(testId: number): Promise<{
		test: Test;
		course: Course;
		marks: Array<{
			student_id: string;
			student_name: string;
			CO1: string | number;
			CO2: string | number;
			CO3: string | number;
			CO4: string | number;
			CO5: string | number;
			CO6: string | number;
		}>;
	}> {
		return apiGet<{
			test: Test;
			course: Course;
			marks: Array<{
				student_id: string;
				student_name: string;
				CO1: string | number;
				CO2: string | number;
				CO3: string | number;
				CO4: string | number;
				CO5: string | number;
				CO6: string | number;
			}>;
		}>(`/marks/test?test_id=${testId}`);
	},
};
