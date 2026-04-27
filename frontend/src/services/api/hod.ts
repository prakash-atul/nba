import { apiGet, apiPost, apiDelete, apiPut, apiGetPaginated } from "./base";
import { debugLogger } from "@/lib/debugLogger";
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
		debugLogger.info("hodApi", "getBaseCourses called");
		return apiGetPaginated<BaseCourse>("/hod/base-courses", params);
	},
	async getAllBaseCourses() {
		debugLogger.info("hodApi", "getAllBaseCourses called");
		return apiGet<BaseCourse[]>("/hod/base-courses/all");
	},
	async createBaseCourse(data: any): Promise<BaseCourse> {
		debugLogger.info("hodApi", "createBaseCourse called");
		return apiPost<any, BaseCourse>("/hod/base-courses", data);
	},

	async getStats(): Promise<HODStats> {
		debugLogger.info("hodApi", "getStats called");
		return apiGet<HODStats>("/hod/stats");
	},

	async updateBaseCourse(courseId: number, data: any): Promise<void> {
		debugLogger.info("hodApi", "updateBaseCourse called");
		return apiPut(`/hod/base-courses/${courseId}`, data);
	},
	async deleteBaseCourse(courseId: number): Promise<void> {
		debugLogger.info("hodApi", "deleteBaseCourse called");
		return apiDelete(`/hod/base-courses/${courseId}`);
	},
	async getDepartmentCourses(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DepartmentCourse>> {
		debugLogger.info("hodApi", "getDepartmentCourses called", params);
		return apiGetPaginated<DepartmentCourse>("/hod/courses", params);
	},

	async getDepartmentFaculty(
		params?: PaginationParams,
	): Promise<PaginatedResponse<DepartmentFaculty>> {
		debugLogger.info("hodApi", "getDepartmentFaculty called", params);
		return apiGetPaginated<DepartmentFaculty>("/hod/faculty", params);
	},

	async createCourse(
		courseData: CreateCourseRequest,
	): Promise<DepartmentCourse> {
		debugLogger.info("hodApi", "getDepartmentCourses called");
		return apiPost<CreateCourseRequest, DepartmentCourse>(
			"/hod/courses",
			courseData,
		);
	},

	async updateCourse(
		offeringId: number,
		courseData: UpdateCourseRequest,
	): Promise<DepartmentCourse> {
		debugLogger.info("hodApi", "updateCourse called");
		return apiPut<UpdateCourseRequest, DepartmentCourse>(
			`/hod/courses/${offeringId}`,
			courseData,
		);
	},

async deleteCourse(offeringId: number): Promise<void> {
		debugLogger.info("hodApi", "deleteCourse called");
		return apiDelete(`/hod/courses/${offeringId}`);
	},

	async reopenCourseOffering(offeringId: number): Promise<void> {
		debugLogger.info("hodApi", "reopenCourseOffering called", { offeringId });
		return apiPost<any, any>(`/hod/offerings/${offeringId}/reopen`, {});
	},

	// User management
	async createUser(
		userData: HODCreateUserRequest,
	): Promise<DepartmentFaculty> {
		debugLogger.info("hodApi", "createUser called");
		return apiPost<HODCreateUserRequest, DepartmentFaculty>(
			"/hod/users",
			userData,
		);
	},

	async updateUser(
		employeeId: number,
		userData: HODUpdateUserRequest,
	): Promise<DepartmentFaculty> {
		debugLogger.info("hodApi", "updateUser called");
		return apiPut<HODUpdateUserRequest, DepartmentFaculty>(
			`/hod/users/${employeeId}`,
			userData,
		);
	},

	async deleteUser(employeeId: number): Promise<void> {
		debugLogger.info("hodApi", "deleteUser called");
		return apiDelete(`/hod/users/${employeeId}`);
	},

	// Student management
	async getDepartmentStudents(
		params?: PaginationParams,
	): Promise<PaginatedResponse<Student>> {
		debugLogger.info("hodApi", "getDepartmentStudents called", params);
		return apiGetPaginated<Student>("/hod/students", params);
	},

	async updateStudent(
		rollNo: string,
		data: UpdateStudentRequest,
	): Promise<void> {
		debugLogger.info("hodApi", "getDepartmentStudents called");
		return apiPut<UpdateStudentRequest, void>(
			`/hod/students/${encodeURIComponent(rollNo)}`,
			data,
		);
	},

	async getOfferingTestAverages(offeringId: number): Promise<TestAverage[]> {
		debugLogger.info("hodApi", "getOfferingTestAverages called");
		return apiGet<TestAverage[]>(
			`/hod/offerings/${offeringId}/test-averages`,
		);
	},
};
