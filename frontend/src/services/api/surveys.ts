import { apiGet, apiPost, apiDelete } from "./base";
import { debugLogger } from "@/lib/debugLogger";
import type {
	CourseExitSurveyConfig,
	CourseSurveyQuestion,
	CourseExitSurveyImportRequest,
	CourseExitSurveyImportResponse,
	CourseExitSurveyResultsResponse,
	CourseExitEnrollmentsResponse,
	ManualEntryResponse,
	StakeholderSurveyImportRequest,
	StakeholderSurveyImportResponse,
	StakeholderSurveyResultsResponse,
	StakeholderSurveyConfigResponse,
	StakeholderSurveyQuestion,
} from "./types";

async function getCourseExitSurvey(offeringId: number): Promise<CourseExitSurveyConfig | null> {
	debugLogger.info("surveyApi", "getCourseExitSurvey called", { offeringId });
	const response = await apiGet<CourseExitSurveyConfig | null>(`/offerings/${offeringId}/survey/course-exit`);
	return response;
}

async function saveCourseExitQuestions(offeringId: number, questions: CourseSurveyQuestion[]): Promise<void> {
	debugLogger.info("surveyApi", "saveCourseExitQuestions called", { offeringId, questionsCount: questions.length });
	await apiPost(`/offerings/${offeringId}/survey/course-exit/questions`, { questions });
}

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

async function getCourseExitEnrollments(
	offeringId: number,
): Promise<CourseExitEnrollmentsResponse> {
	debugLogger.info("surveyApi", "getCourseExitEnrollments called", { offeringId });
	const response = await apiGet<CourseExitEnrollmentsResponse>(
		`/offerings/${offeringId}/survey/course-exit/enrollments`,
	);
	return response;
}

async function saveManualResponses(
	offeringId: number,
	responses: ManualEntryResponse[],
): Promise<{ imported_count: number }> {
	debugLogger.info("surveyApi", "saveManualResponses called", { offeringId, count: responses.length });
	const response = await apiPost<{ responses: ManualEntryResponse[] }, { imported_count: number }>(
		`/offerings/${offeringId}/survey/course-exit/responses/manual`,
		{ responses },
	);
	return response;
}

// ─── Stakeholder Survey API ───────────────────────────────────────────────────

async function importStakeholderCsv(
	programmeId: number,
	data: StakeholderSurveyImportRequest,
): Promise<StakeholderSurveyImportResponse> {
	debugLogger.info("surveyApi", "importStakeholderCsv called", {
		programmeId,
		type: data.stakeholder_type,
		batch: data.batch_year,
		count: data.responses.length,
	});
	const response = await apiPost<StakeholderSurveyImportRequest, StakeholderSurveyImportResponse>(
		`/programmes/${programmeId}/survey/stakeholder/import`,
		data,
	);
	return response;
}

async function getStakeholderResults(
	programmeId: number,
	batchYear: number,
	stakeholderType?: string,
): Promise<StakeholderSurveyResultsResponse> {
	const params = new URLSearchParams({ batch_year: String(batchYear) });
	if (stakeholderType) params.set("stakeholder_type", stakeholderType);
	debugLogger.info("surveyApi", "getStakeholderResults called", {
		programmeId,
		batchYear,
		stakeholderType,
	});
	const response = await apiGet<StakeholderSurveyResultsResponse>(
		`/programmes/${programmeId}/survey/stakeholder/results?${params}`,
	);
	return response;
}

async function clearStakeholder(
	programmeId: number,
	batchYear: number,
	stakeholderType?: string,
): Promise<void> {
	const params = new URLSearchParams({ batch_year: String(batchYear) });
	if (stakeholderType) params.set("stakeholder_type", stakeholderType);
	debugLogger.info("surveyApi", "clearStakeholder called", {
		programmeId,
		batchYear,
		stakeholderType,
	});
	await apiDelete(`/programmes/${programmeId}/survey/stakeholder?${params}`);
}

async function getStakeholderSurvey(
	programmeId: number,
	batchYear: number,
	stakeholderType: string,
): Promise<StakeholderSurveyConfigResponse | null> {
	const params = new URLSearchParams({
		batch_year: String(batchYear),
		stakeholder_type: stakeholderType,
	});
	debugLogger.info("surveyApi", "getStakeholderSurvey called", {
		programmeId,
		batchYear,
		stakeholderType,
	});
	const response = await apiGet<StakeholderSurveyConfigResponse | null>(
		`/programmes/${programmeId}/survey/stakeholder?${params}`,
	);
	return response;
}

async function saveStakeholderQuestions(
	programmeId: number,
	batchYear: number,
	stakeholderType: string,
	questions: StakeholderSurveyQuestion[],
): Promise<void> {
	debugLogger.info("surveyApi", "saveStakeholderQuestions called", {
		programmeId,
		batchYear,
		stakeholderType,
		count: questions.length,
	});
	await apiPost(`/programmes/${programmeId}/survey/stakeholder/questions`, {
		batch_year: batchYear,
		stakeholder_type: stakeholderType,
		questions,
	});
}

export const surveyApi = {
	getCourseExitSurvey,
	saveCourseExitQuestions,
	importCourseExitCsv,
	getCourseExitResults,
	clearCourseExit,
	getCourseExitEnrollments,
	saveManualResponses,
	importStakeholderCsv,
	getStakeholderSurvey,
	saveStakeholderQuestions,
	getStakeholderResults,
	clearStakeholder,
};
