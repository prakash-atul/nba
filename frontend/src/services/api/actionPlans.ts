import { apiGet, apiPost, apiPut, apiDelete } from "./base";
import { debugLogger } from "@/lib/debugLogger";
import type {
	ActionPlan,
	CreateActionPlanRequest,
	SetTargetsRequest,
} from "./types";

async function listByProgramme(
	programmeId: number,
	batchYear?: number,
): Promise<ActionPlan[]> {
	const params = batchYear ? `?batch_year=${batchYear}` : "";
	debugLogger.info("actionPlanApi", "listByProgramme", { programmeId, batchYear });
	const response = await apiGet<ActionPlan[]>(
		`/programmes/${programmeId}/action-plans${params}`,
	);
	return response;
}

async function create(
	programmeId: number,
	data: CreateActionPlanRequest,
): Promise<ActionPlan> {
	debugLogger.info("actionPlanApi", "create", { programmeId, data });
	const response = await apiPost<CreateActionPlanRequest, ActionPlan>(
		`/programmes/${programmeId}/action-plans`,
		data,
	);
	return response;
}

async function update(
	id: number,
	data: Partial<CreateActionPlanRequest>,
): Promise<ActionPlan> {
	debugLogger.info("actionPlanApi", "update", { id, data });
	const response = await apiPut<Partial<CreateActionPlanRequest>, ActionPlan>(
		`/action-plans/${id}`,
		data,
	);
	return response;
}

async function remove(id: number): Promise<void> {
	debugLogger.info("actionPlanApi", "delete", { id });
	await apiDelete(`/action-plans/${id}`);
}

async function setTargets(
	programmeId: number,
	data: SetTargetsRequest,
): Promise<void> {
	debugLogger.info("actionPlanApi", "setTargets", { programmeId, data });
	await apiPost<SetTargetsRequest, { success: boolean; message: string }>(
		`/programmes/${programmeId}/attainment/targets`,
		data,
	);
}

async function getTargets(
	programmeId: number,
	batchYear: number,
): Promise<Record<string, number>> {
	debugLogger.info("actionPlanApi", "getTargets", { programmeId, batchYear });
	const response = await apiGet<{ programme_id: number; batch_year: number; targets: Record<string, number> }>(
		`/programmes/${programmeId}/attainment/targets?batch_year=${batchYear}`,
	);
	return response.targets;
}

export const actionPlanApi = {
	listByProgramme,
	create,
	update,
	delete: remove,
	setTargets,
	getTargets,
};
