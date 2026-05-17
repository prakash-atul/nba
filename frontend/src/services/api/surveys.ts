import { apiGet, apiPost, apiDelete } from "./base";
import { debugLogger } from "@/lib/debugLogger";
import type {
	CourseExitSurveyImportRequest,
	CourseExitSurveyImportResponse,
	CourseExitSurveyResultsResponse,
	StakeholderSurveyImportRequest,
	StakeholderSurveyImportResponse,
	StakeholderSurveyResultsResponse,
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

export const surveyApi = {
	importCourseExitCsv,
	getCourseExitResults,
	clearCourseExit,
	importStakeholderCsv,
	getStakeholderResults,
	clearStakeholder,
};
