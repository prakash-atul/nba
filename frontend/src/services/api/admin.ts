import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from "./base";
import { debugLogger } from "@/lib/debugLogger";
import type {
	User,
	Student,
	Department,
	AdminStats,
	AdminCourse,
	AdminTest,
	CreateUserRequest,
	AdminUpdateUserRequest,
	CreateDepartmentRequest,
	UpdateDepartmentRequest,
	School,
	CreateSchoolRequest,
	UpdateSchoolRequest,
	AppointDeanRequest,
	CreateDeanRequest,
	PaginatedResponse,
	PaginationParams,
} from "./types";

export const adminApi = {
	async getStats(): Promise<AdminStats> {
		debugLogger.info("adminApi", "getStats called");
		return apiGet<AdminStats>("/admin/stats");
	},

	async getAllUsers(
		params?: PaginationParams,
	): Promise<PaginatedResponse<User>> {
		return apiGetPaginated<User>("/admin/users", params);
	},

	async createUser(userData: CreateUserRequest): Promise<User> {
		debugLogger.info("adminApi", "getAllUsers called");
		return apiPost<CreateUserRequest, User>("/admin/users", userData);
	},

	async updateUser(
		employeeId: number,
		userData: AdminUpdateUserRequest,
	): Promise<User> {
		debugLogger.info("adminApi", "updateUser called");
		return apiPut<AdminUpdateUserRequest, User>(
			`/admin/users/${employeeId}`,
			userData,
		);
	},

	async deleteUser(employeeId: number): Promise<void> {
		debugLogger.info("adminApi", "deleteUser called");
		return apiDelete(`/admin/users/${employeeId}`);
	},

	async getUserPhones(employeeId: number): Promise<string[]> {
		debugLogger.info("adminApi", "getUserPhones called");
		return apiGet<string[]>(`/users/${employeeId}/phones`);
	},

	// School Management
	async getAllSchools(): Promise<School[]> {
		debugLogger.info("adminApi", "getAllSchools called");
		return apiGet<School[]>("/admin/schools");
	},

	async createSchool(data: CreateSchoolRequest): Promise<School> {
		debugLogger.info("adminApi", "createSchool called");
		return apiPost<CreateSchoolRequest, School>("/admin/schools", data);
	},

	async updateSchool(
		schoolId: number,
		data: UpdateSchoolRequest,
	): Promise<School> {
		debugLogger.info("adminApi", "updateSchool called");
		return apiPut<UpdateSchoolRequest, School>(
			`/admin/schools/${schoolId}`,
			data,
		);
	},

	async deleteSchool(schoolId: number): Promise<void> {
		debugLogger.info("adminApi", "deleteSchool called");
		return apiDelete(`/admin/schools/${schoolId}`);
	},

	// Dean Management
	async appointDean(
		schoolId: number,
		data: AppointDeanRequest | CreateDeanRequest,
	): Promise<User> {
		debugLogger.info("adminApi", "appointDean called");
		return apiPost<AppointDeanRequest | CreateDeanRequest, User>(
			`/admin/schools/${schoolId}/dean`,
			data,
		);
	},

	async demoteDean(employeeId: number): Promise<void> {
		debugLogger.info("adminApi", "demoteDean called");
		return apiDelete(`/admin/dean/${employeeId}`);
	},

	async getDeanHistory(): Promise<any> {
		debugLogger.info("adminApi", "getDeanHistory called");
		return apiGet("/admin/dean/history");
	},

	async getAllDepartments(
		params?: PaginationParams,
	): Promise<PaginatedResponse<Department>> {
		return apiGetPaginated<Department>("/admin/departments", params);
	},

	async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
		debugLogger.info("adminApi", "getAllDepartments called");
		return apiPost<CreateDepartmentRequest, Department>(
			"/admin/departments",
			data,
		);
	},

	async updateDepartment(
		departmentId: number,
		data: UpdateDepartmentRequest,
	): Promise<Department> {
		debugLogger.info("adminApi", "updateDepartment called");
		return apiPut<UpdateDepartmentRequest, Department>(
			`/admin/departments/${departmentId}`,
			data,
		);
	},

	async deleteDepartment(departmentId: number): Promise<void> {
		debugLogger.info("adminApi", "deleteDepartment called");
		return apiDelete(`/admin/departments/${departmentId}`);
	},

	async getAllCourses(
		params?: PaginationParams,
	): Promise<PaginatedResponse<AdminCourse>> {
		return apiGetPaginated<AdminCourse>("/admin/courses", params);
	},

	async getAllStudents(
		params?: PaginationParams,
	): Promise<PaginatedResponse<Student>> {
		return apiGetPaginated<Student>("/admin/students", params);
	},

	async getAllTests(
		params?: PaginationParams,
	): Promise<PaginatedResponse<AdminTest>> {
		return apiGetPaginated<AdminTest>("/admin/tests", params);
	},
};
