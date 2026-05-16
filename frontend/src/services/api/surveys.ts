import { apiGet, apiPost, apiDelete } from "./base";
import { debugLogger } from "@/lib/debugLogger";
import type {
	CourseExitSurveyImportRequest,
	CourseExitSurveyImportResponse,
	CourseExitSurveyResultsResponse,
} from "./types";

async function importCourseExitCsv(
	offeringId: number,
	data: CourseExitSurveyImportRequest,
): Promise<CourseExitSurveyImportResponse> {
	debugLogger.info("surveyApi", "importCourseExitCsv called", {
		offeringId,
		responseCount: data.responses.length,
	});
	const response = await apiPost<CourseExitSurveyImportRequest, CourseExitSurveyImportResponse>(
		`/offerings/${offeringId}/survey/course-exit/import`,
		data,
	);
	debugLogger.info("surveyApi", "importCourseExitCsv response", {
		offeringId,
		imported: response.imported_count,
		errors: response.error_count,
	});
	return response;
}

async function getCourseExitResults(
	offeringId: number,
): Promise<CourseExitSurveyResultsResponse> {
	debugLogger.info("surveyApi", "getCourseExitResults called", {
		offeringId,
	});
	const response = await apiGet<CourseExitSurveyResultsResponse>(
		`/offerings/${offeringId}/survey/course-exit/results`,
	);
	debugLogger.info("surveyApi", "getCourseExitResults response", {
		offeringId,
		has_data: response.has_data,
	});
	return response;
}

async function clearCourseExit(offeringId: number): Promise<void> {
	debugLogger.info("surveyApi", "clearCourseExit called", { offeringId });
	await apiDelete(`/offerings/${offeringId}/survey/course-exit`);
}

export const surveyApi = {
	importCourseExitCsv,
	getCourseExitResults,
	clearCourseExit,
};
