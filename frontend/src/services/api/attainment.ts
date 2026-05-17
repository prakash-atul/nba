import { apiGet, apiPost } from "./base";
import { debugLogger } from "@/lib/debugLogger";
import type {
	CourseLevelProgrammeAttainmentResponse,
	OfferingAttainmentSnapshotInfo,
	ProgrammeAttainmentResponse,
} from "./types";

async function getOfferingAttainment(
	offeringId: number,
): Promise<OfferingAttainmentSnapshotInfo> {
	debugLogger.info("attainmentApi", "getOfferingAttainment called", {
		offeringId,
	});
	const response = await apiGet<OfferingAttainmentSnapshotInfo>(
		`/offerings/${offeringId}/attainment`,
	);
	debugLogger.info("attainmentApi", "getOfferingAttainment response", {
		offeringId,
		has_co_data: (response.co_attainment?.length ?? 0) > 0,
		has_po_data: (response.po_attainment?.length ?? 0) > 0,
		co_count: response.co_attainment?.length ?? 0,
		po_count: response.po_attainment?.length ?? 0,
		co_threshold: response.co_threshold,
		passing_threshold: response.passing_threshold,
		co_attainment: response.co_attainment?.map((c) => ({
			co: c.co_name,
			pct: c.attainment_percentage,
			level: c.attainment_level,
		})),
		po_attainment: response.po_attainment?.map((p) => ({
			po: p.po_name,
			value: p.attainment_value,
		})),
	});
	return response;
}

async function getCourseLevelProgrammeAttainment(
	programmeId: number,
	batchYear: number,
): Promise<CourseLevelProgrammeAttainmentResponse> {
	debugLogger.info(
		"attainmentApi",
		"getCourseLevelProgrammeAttainment called",
		{ programmeId, batchYear },
	);
	const response = await apiGet<CourseLevelProgrammeAttainmentResponse>(
		`/programmes/${programmeId}/attainment/courses?batch_year=${encodeURIComponent(String(batchYear))}`,
	);
	debugLogger.info(
		"attainmentApi",
		"getCourseLevelProgrammeAttainment response",
		{
			programmeId,
			batch_year: response.batch_year,
			po_count: response.po_list?.length ?? 0,
			course_count: response.courses?.length ?? 0,
		},
	);
	return response;
}

async function calculateProgrammeAttainment(
	programmeId: number,
	batchYear: number,
): Promise<ProgrammeAttainmentResponse> {
	debugLogger.info("attainmentApi", "calculateProgrammeAttainment called", {
		programmeId,
		batchYear,
	});
	const response = await apiPost<object, ProgrammeAttainmentResponse>(
		`/programmes/${programmeId}/attainment?batch_year=${encodeURIComponent(String(batchYear))}`,
		{},
	);
	debugLogger.info("attainmentApi", "calculateProgrammeAttainment response", {
		programmeId,
		batch_year: response.batch_year,
		count: response.po_attainment?.length ?? 0,
		po_attainment: response.po_attainment?.map((p) => ({
			po: p.po_name,
			direct: p.direct_attainment_value,
			indirect: p.indirect_attainment_value,
			final: p.final_attainment_value,
		})),
	});
	return response;
}

async function getProgrammeAttainment(
	programmeId: number,
	batchYear?: number,
): Promise<ProgrammeAttainmentResponse> {
	debugLogger.info("attainmentApi", "getProgrammeAttainment called", {
		programmeId,
		batchYear,
	});
	const query =
		typeof batchYear === "number"
			? `?batch_year=${encodeURIComponent(String(batchYear))}`
			: "";
	const response = await apiGet<ProgrammeAttainmentResponse>(
		`/programmes/${programmeId}/attainment${query}`,
	);
	debugLogger.info("attainmentApi", "getProgrammeAttainment response", {
		programmeId,
		batch_year: response.batch_year,
		count: response.po_attainment?.length ?? 0,
		po_attainment: response.po_attainment?.map((p) => ({
			po: p.po_name,
			value: p.attainment_value,
		})),
	});
	return response;
}

export const attainmentApi = {
	getOfferingAttainment,
	getProgrammeAttainment,
	calculateProgrammeAttainment,
	getCourseLevelProgrammeAttainment,
};
