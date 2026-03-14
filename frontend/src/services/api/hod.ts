import { apiGet, apiPost, apiDelete, apiPut, apiGetPaginated } from "./base";
import type {
	BaseCourse,
	HODStats,
	DepartmentCourse,
	DepartmentFaculty,
	TestAverage,
	CreateCourseRequest,
	UpdateCourseRequest,
	HODCreateUserRequest,
	HODUpdateUserRequest,
	PaginatedResponse,
	PaginationParams,
	Student,
	UpdateStudentRequest,
} from "./types";

export const hodApi = {
	async getBaseCourses(params?: PaginationParams) {
		return apiGetPaginated<BaseCourse>("/hod/base-courses", params);
	},
	async getAllBaseCourses() {
		return apiGet<BaseCourse[]>("/hod/base-courses/all");
	},
	async createBaseCourse(data: any): Promise<BaseCourse> {
		return apiPost<any, BaseCourse>("/hod/base-courses", data);
	},

	async getStats(): Promise<HODStats> {
		return apiGet<HODStats>("/hod/stats");
	},

		async updateBaseCourse(courseId: number, data: any): Promise<void> {
		return apiPut(`/hod/base-courses/${courseId}`, data);
	},
	async deleteBaseCourse(courseId: number): Promise<void> {
		return apiDelete(`/hod/base-courses/${courseId}`);
	},
async getDepartmentCourses(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DepartmentCourse>> {
		return apiGetPaginated<DepartmentCourse>("/hod/courses", params);
	},

	async getDepartmentFaculty(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DepartmentFaculty>> {
		return apiGetPaginated<DepartmentFaculty>("/hod/faculty", params);
	},

	async createCourse(
		courseData: CreateCourseRequest,
	): Promise<DepartmentCourse> {
		return apiPost<CreateCourseRequest, DepartmentCourse>(
			"/hod/courses",
			courseData,
		);
	},

	async updateCourse(
		courseId: number,
		courseData: UpdateCourseRequest,
	): Promise<DepartmentCourse> {
		return apiPut<UpdateCourseRequest, DepartmentCourse>(
			`/hod/courses/${courseId}`,
			courseData,
		);
	},

	async deleteCourse(courseId: number): Promise<void> {
		return apiDelete(`/hod/courses/${courseId}`);
	},

	// User management
	async createUser(
		userData: HODCreateUserRequest,
	): Promise<DepartmentFaculty> {
		return apiPost<HODCreateUserRequest, DepartmentFaculty>(
			"/hod/users",
			userData,
		);
	},

	async updateUser(
		employeeId: number,
		userData: HODUpdateUserRequest,
	): Promise<DepartmentFaculty> {
		return apiPut<HODUpdateUserRequest, DepartmentFaculty>(
			`/hod/users/${employeeId}`,
			userData,
		);
	},

	async deleteUser(employeeId: number): Promise<void> {
		return apiDelete(`/hod/users/${employeeId}`);
	},

	// Student management
	async getDepartmentStudents(
		params?: PaginationParams,
	): Promise<PaginatedResponse<Student>> {
		return apiGetPaginated<Student>("/hod/students", params);
	},

	async updateStudent(
		rollNo: string,
		data: UpdateStudentRequest,
	): Promise<void> {
		return apiPut<UpdateStudentRequest, void>(
			`/hod/students/${encodeURIComponent(rollNo)}`,
			data,
		);
	},

	async getOfferingTestAverages(
		offeringId: number,
	): Promise<TestAverage[]> {
		return apiGet<TestAverage[]>(
			`/hod/offerings/${offeringId}/test-averages`,
		);
	},
};
