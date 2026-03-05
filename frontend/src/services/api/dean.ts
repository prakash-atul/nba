import { apiGet, apiPost, apiDelete, apiGetPaginated } from "./base";
import type {
	DeanStats,
	DeanDepartment,
	DeanUser,
	DeanCourse,
	DeanStudent,
	DeanTest,
	DepartmentAnalytics,
	AppointHODRequest,
	HODHistoryRecord,
	PaginatedResponse,
	PaginationParams,
} from "./types";

export const deanApi = {
	async getStats(): Promise<DeanStats> {
		return apiGet<DeanStats>("/dean/stats");
	},

	async getAllDepartments(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DeanDepartment>> {
		return apiGetPaginated<DeanDepartment>("/dean/departments", params);
	},

	async getAllUsers(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DeanUser>> {
		return apiGetPaginated<DeanUser>("/dean/users", params);
	},

	async getAllCourses(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DeanCourse>> {
		return apiGetPaginated<DeanCourse>("/dean/courses", params);
	},

	async getAllStudents(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DeanStudent>> {
		return apiGetPaginated<DeanStudent>("/dean/students", params);
	},

	async getAllTests(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DeanTest>> {
		return apiGetPaginated<DeanTest>("/dean/tests", params);
	},

	async getDepartmentAnalytics(): Promise<DepartmentAnalytics[]> {
		return apiGet<DepartmentAnalytics[]>("/dean/analytics");
	},

	// HOD Management
	async getDepartmentFaculty(departmentId: number): Promise<DeanUser[]> {
		return apiGet<DeanUser[]>(`/dean/departments/${departmentId}/faculty`);
	},

	async appointHOD(
		departmentId: number,
		data: AppointHODRequest,
	): Promise<DeanUser> {
		return apiPost<AppointHODRequest, DeanUser>(
			`/dean/departments/${departmentId}/hod`,
			data,
		);
	},

	async demoteHOD(employeeId: number): Promise<DeanUser> {
		return apiDelete<DeanUser>(`/dean/hod/${employeeId}`);
	},

	async getHODHistory(): Promise<HODHistoryRecord[]> {
		return apiGet<HODHistoryRecord[]>("/dean/hod/history");
	},
};
