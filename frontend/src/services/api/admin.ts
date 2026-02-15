import { apiGet, apiPost, apiPut, apiDelete } from "./base";
import type {
	User,
	Student,
	Department,
	AdminStats,
	AdminCourse,
	AdminTest,
	CreateUserRequest,
	CreateDepartmentRequest,
	UpdateDepartmentRequest,
	School,
	CreateSchoolRequest,
	UpdateSchoolRequest,
	AppointDeanRequest,
	CreateDeanRequest,
} from "./types";

export const adminApi = {
	async getStats(): Promise<AdminStats> {
		return apiGet<AdminStats>("/admin/stats");
	},

	async getAllUsers(): Promise<User[]> {
		return apiGet<User[]>("/admin/users");
	},

	async createUser(userData: CreateUserRequest): Promise<User> {
		return apiPost<CreateUserRequest, User>("/admin/users", userData);
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
		data: UpdateSchoolRequest
	): Promise<School> {
		return apiPut<UpdateSchoolRequest, School>(
			`/admin/schools/${schoolId}`,
			data
		);
	},

	async deleteSchool(schoolId: number): Promise<void> {
		return apiDelete(`/admin/schools/${schoolId}`);
	},

	// Dean Management
	async appointDean(
		schoolId: number,
		data: AppointDeanRequest | CreateDeanRequest
	): Promise<User> {
		return apiPost<AppointDeanRequest | CreateDeanRequest, User>(
			`/admin/schools/${schoolId}/dean`,
			data
		);
	},

	async demoteDean(employeeId: number): Promise<void> {
		return apiDelete(`/admin/dean/${employeeId}`);
	},

	async getAllDepartments(): Promise<Department[]> {
		return apiGet<Department[]>("/departments");
	},

	async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
		return apiPost<CreateDepartmentRequest, Department>(
			"/admin/departments",
			data
		);
	},

	async updateDepartment(
		departmentId: number,
		data: UpdateDepartmentRequest
	): Promise<Department> {
		return apiPut<UpdateDepartmentRequest, Department>(
			`/admin/departments/${departmentId}`,
			data
		);
	},

	async deleteDepartment(departmentId: number): Promise<void> {
		return apiDelete(`/admin/departments/${departmentId}`);
	},

	async getAllCourses(): Promise<AdminCourse[]> {
		return apiGet<AdminCourse[]>("/admin/courses");
	},

	async getAllStudents(): Promise<Student[]> {
		return apiGet<Student[]>("/admin/students");
	},

	async getAllTests(): Promise<AdminTest[]> {
		return apiGet<AdminTest[]>("/admin/tests");
	},
};
