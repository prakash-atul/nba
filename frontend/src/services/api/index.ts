// Re-export all types
export * from "./types";

// Import individual API modules
import { authApi } from "./auth";
import { coursesApi } from "./courses";
import { assessmentsApi } from "./assessments";
import { marksApi } from "./marks";
import { adminApi } from "./admin";
import { hodApi } from "./hod";
import { staffApi } from "./staff";
import { deanApi } from "./dean";
import { facultyApi } from "./faculty";

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
  getCoPoMatrix = coursesApi.getCoPoMatrix;
  saveCoPoMatrix = coursesApi.saveCoPoMatrix;
  enrollStudents = coursesApi.enrollStudents;

  // Assessment methods
  createAssessment = assessmentsApi.createAssessment;
  getAssessment = assessmentsApi.getAssessment;
  deleteTest = assessmentsApi.deleteTest;

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
  createDepartment = adminApi.createDepartment;
  updateDepartment = adminApi.updateDepartment;
  deleteDepartment = adminApi.deleteDepartment;
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
  createDepartmentUser = hodApi.createUser;
  updateDepartmentUser = hodApi.updateUser;
  deleteDepartmentUser = hodApi.deleteUser;

  // Faculty methods
  getFacultyStats = facultyApi.getStats;

  // Staff methods
  getStaffStats = staffApi.getStats;
  getStaffDepartmentCourses = staffApi.getDepartmentCourses;
  getStaffDepartmentStudents = staffApi.getDepartmentStudents;
  getStaffCourseEnrollments = staffApi.getCourseEnrollments;
  staffBulkEnrollStudents = staffApi.bulkEnrollStudents;
  staffRemoveEnrollment = staffApi.removeEnrollment;

  // Dean methods (read-only)
  getDeanStats = deanApi.getStats;
  getDeanDepartments = deanApi.getAllDepartments;
  getDeanUsers = deanApi.getAllUsers;
  getDeanCourses = deanApi.getAllCourses;
  getDeanStudents = deanApi.getAllStudents;
  getDeanTests = deanApi.getAllTests;
  getDepartmentAnalytics = deanApi.getDepartmentAnalytics;
}

// Export a singleton instance for backward compatibility
export const apiService = new ApiService();

// Also export individual API modules for direct use
export {
  authApi,
  coursesApi,
  assessmentsApi,
  marksApi,
  adminApi,
  hodApi,
  facultyApi,
  staffApi,
  deanApi,
};
