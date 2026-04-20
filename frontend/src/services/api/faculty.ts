import { apiGet, apiPut, apiDelete, apiPost, apiGetPaginated } from "./base";
import type {
	FacultyStats,
	CourseStats,
	Course,
	PaginatedResponse,
	PaginationParams,
	EnrolledStudent,
	UpdateStudentRequest,
} from "./types";

async function getStats(): Promise<FacultyStats> {
	return apiGet<FacultyStats>("/faculty/stats");
}

async function getCourses(
	params?: PaginationParams,
): Promise<PaginatedResponse<Course>> {
	return apiGetPaginated<Course>("/courses", params as any);
}

async function getEnrolledStudents(
	params?: PaginationParams,
): Promise<PaginatedResponse<EnrolledStudent>> {
	return apiGetPaginated<EnrolledStudent>("/faculty/students", params);
}

async function updateStudent(
	rollNo: string,
	data: UpdateStudentRequest,
): Promise<void> {
	return apiPut<UpdateStudentRequest, void>(
		`/faculty/students/${encodeURIComponent(rollNo)}`,
		data,
	);
}

async function removeStudentEnrollment(rollNo: string): Promise<void> {
	return apiDelete(`/faculty/students/${encodeURIComponent(rollNo)}`);
}

async function getOfferingTestAverages(offeringId: number): Promise<any[]> {
	return apiGet<any[]>(`/faculty/courses/${offeringId}/test-averages`);
}

async function getCourseStats(offeringId: number): Promise<CourseStats> {
	return apiGet<CourseStats>(`/faculty/courses/${offeringId}/stats`);
}

async function concludeCourse(offeringId: number): Promise<void> {
	return apiPost<any, void>(`/faculty/courses/${offeringId}/conclude`, {});
}

async function checkCourseCompletionStatus(offeringId: number): Promise<{
	can_conclude: boolean;
	incomplete_tests: string[];
	total_tests: number;
}> {
	return apiGet<{
		can_conclude: boolean;
		incomplete_tests: string[];
		total_tests: number;
	}>(`/faculty/courses/${offeringId}/check-completion`);
}

export const facultyApi = {
	getStats,
	getCourses,
	getEnrolledStudents,
	updateStudent,
	removeStudentEnrollment,
	getCourseStats,
	concludeCourse,
	checkCourseCompletionStatus,
	getOfferingTestAverages,
};
