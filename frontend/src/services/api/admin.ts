import { apiGet, apiPost, apiPut, apiDelete, apiGetPaginated } from "./base";
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
		return apiGet<AdminStats>("/admin/stats");
	},

	async getAllUsers(
		params?: PaginationParams,
	): Promise<PaginatedResponse<User>> {
		return apiGetPaginated<User>("/admin/users", params);
	},

	async createUser(userData: CreateUserRequest): Promise<User> {
		return apiPost<CreateUserRequest, User>("/admin/users", userData);
	},

	async updateUser(
		employeeId: number,
		userData: AdminUpdateUserRequest,
	): Promise<User> {
		return apiPut<AdminUpdateUserRequest, User>(
			`/admin/users/${employeeId}`,
			userData,
		);
	},

	async deleteUser(employeeId: number): Promise<void> {
		return apiDelete(`/admin/users/${employeeId}`);
	},

	// School Management
	async getAllSchools(): Promise<School[]> {
		return apiGet<School[]>("/admin/schools");
	},

	async createSchool(data: CreateSchoolRequest): Promise<School> {
		return apiPost<CreateSchoolRequest, School>("/admin/schools", data);
	},

	async updateSchool(
		schoolId: number,
		data: UpdateSchoolRequest,
	): Promise<School> {
		return apiPut<UpdateSchoolRequest, School>(
			`/admin/schools/${schoolId}`,
			data,
		);
	},

	async deleteSchool(schoolId: number): Promise<void> {
		return apiDelete(`/admin/schools/${schoolId}`);
	},

	// Dean Management
	async appointDean(
		schoolId: number,
		data: AppointDeanRequest | CreateDeanRequest,
	): Promise<User> {
		return apiPost<AppointDeanRequest | CreateDeanRequest, User>(
			`/admin/schools/${schoolId}/dean`,
			data,
		);
	},

	async demoteDean(employeeId: number): Promise<void> {
		return apiDelete(`/admin/dean/${employeeId}`);
	},

	async getDeanHistory(): Promise<any> {
		return apiGet("/admin/dean/history");
	},

	async getAllDepartments(
		params?: PaginationParams,
	): Promise<PaginatedResponse<Department>> {
		return apiGetPaginated<Department>("/admin/departments", params);
	},

	async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
		return apiPost<CreateDepartmentRequest, Department>(
			"/admin/departments",
			data,
		);
	},

	async updateDepartment(
		departmentId: number,
		data: UpdateDepartmentRequest,
	): Promise<Department> {
		return apiPut<UpdateDepartmentRequest, Department>(
			`/admin/departments/${departmentId}`,
			data,
		);
	},

	async deleteDepartment(departmentId: number): Promise<void> {
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
