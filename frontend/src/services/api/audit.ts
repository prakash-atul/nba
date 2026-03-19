import { apiGetFull } from "./base";

export interface AuditLog {
	id: number;
	user_id: number | null;
	username: string | null;
	action: string;
	entity_type: string;
	entity_id: string;
	old_values: any | null;
	new_values: any | null;
	ip_address: string | null;
	created_at: string;
}

export interface AuditLogFilters {
	page?: number;
	limit?: number;
	user_id?: string;
	action?: string;
	entity_type?: string;
	date_from?: string;
	date_to?: string;
}

export const auditApi = {
	getLogs: (filters: AuditLogFilters = {}) => {
		const queryParams = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== "") {
				queryParams.append(key, String(value));
			}
		});
		return apiGetFull(`/admin/logs?${queryParams.toString()}`);
	},
	getHodLogs: (filters: AuditLogFilters = {}) => {
		const queryParams = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== "") {
				queryParams.append(key, String(value));
			}
		});
		return apiGetFull(`/hod/logs?${queryParams.toString()}`);
	},
	getFacultyLogs: (filters: AuditLogFilters = {}) => {
		const queryParams = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== "") {
				queryParams.append(key, String(value));
			}
		});
		return apiGetFull(`/faculty/logs?${queryParams.toString()}`);
	},
};
