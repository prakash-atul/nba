// Re-export all types
export * from "./types";

// Import individual API modules
import { authApi } from "./auth";
import { coursesApi } from "./courses";
import { assessmentsApi } from "./assessments";
import { marksApi } from "./marks";
import { adminApi } from "./admin";
import { hodApi } from "./hod";

// Create a unified API service that maintains backward compatibility
class ApiService {
	// Auth methods
	login = authApi.login;
	logout = authApi.logout;
	getProfile = authApi.getProfile;
	getStoredUser = authApi.getStoredUser;
	getToken = authApi.getToken;
	setToken = authApi.setToken;
	clearToken = authApi.clearToken;

	// Course methods
	getCourses = coursesApi.getCourses;
	getCourseTests = coursesApi.getCourseTests;
	getCourseEnrollments = coursesApi.getCourseEnrollments;
	getAttainmentConfig = coursesApi.getAttainmentConfig;
	saveAttainmentConfig = coursesApi.saveAttainmentConfig;

	// Assessment methods
	createAssessment = assessmentsApi.createAssessment;
	getAssessment = assessmentsApi.getAssessment;

	// Marks methods
	saveMarksByQuestion = marksApi.saveMarksByQuestion;
	saveMarksByCO = marksApi.saveMarksByCO;
	saveBulkMarks = marksApi.saveBulkMarks;
	getStudentMarks = marksApi.getStudentMarks;
	getTestMarks = marksApi.getTestMarks;

	// Admin methods
	getAdminStats = adminApi.getStats;
	getAllUsers = adminApi.getAllUsers;
	createUser = adminApi.createUser;
	deleteUser = adminApi.deleteUser;
	getAllDepartments = adminApi.getAllDepartments;
	getAllCoursesAdmin = adminApi.getAllCourses;
	getAllStudentsAdmin = adminApi.getAllStudents;
	getAllTestsAdmin = adminApi.getAllTests;

	// HOD methods
	getHODStats = hodApi.getStats;
	getDepartmentCourses = hodApi.getDepartmentCourses;
	getDepartmentFaculty = hodApi.getDepartmentFaculty;
	createCourse = hodApi.createCourse;
	updateCourse = hodApi.updateCourse;
	deleteCourse = hodApi.deleteCourse;
}

// Export a singleton instance for backward compatibility
export const apiService = new ApiService();

// Also export individual API modules for direct use
export { authApi, coursesApi, assessmentsApi, marksApi, adminApi, hodApi };
