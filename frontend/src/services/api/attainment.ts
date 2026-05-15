import { apiGet } from "./base";
import { debugLogger } from "@/lib/debugLogger";
import type {
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
};
