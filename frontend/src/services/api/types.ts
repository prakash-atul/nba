// Authentication Types
export interface LoginCredentials {
	employeeIdOrEmail: string;
	password: string;
}

export interface User {
	employee_id: number;
	username: string;
	email: string;
	role: string;
	designation: string | null;
	phone: string | null;
	department_id: number | null;
	department_name?: string;
	department_code?: string;
	is_hod: boolean;
	is_dean: boolean;
	hod_department_id?: number | null;
	school_id?: number | null;
}

export interface LoginResponse {
	success: boolean;
	message: string;
	data: {
		token: string;
		user: User;
	};
}

export interface ApiError {
	success: false;
	message: string;
	error?: string;
	errors?: string[];
}

// Course Types
export interface Course {
	id: number;
	course_code: string;
	name: string;
	credit: number;
	syllabus: string | null;
	faculty_id: number;
	year: number;
	semester: number;
}

export interface CoursesResponse {
	success: boolean;
	message: string;
	data: Course[];
}

export interface CourseTestsResponse {
	success: boolean;
	message: string;
	data: Test[];
}

// Assessment/Test Types
export interface Question {
	question_number: number;
	sub_question?: string;
	is_optional?: boolean;
	co: number;
	max_marks: number;
}

export interface QuestionResponse extends Question {
	id: number;
	test_id: number;
	question_identifier: string;
}

export interface Test {
	id: number;
	course_id: number;
	name: string;
	full_marks: number;
	pass_marks: number;
}

export interface CreateAssessmentRequest {
	course_id: number;
	name: string;
	full_marks: number;
	pass_marks: number;
	questions: Question[];
}

export interface CreateAssessmentResponse {
	success: boolean;
	message: string;
	data: {
		test: Test;
		questions: QuestionResponse[];
	};
}

// Marks Types
export interface QuestionMarks {
	question_identifier: string;
	marks: number;
}

export interface SaveMarksByQuestionRequest {
	test_id: number;
	student_id: string;
	marks: QuestionMarks[];
}

export interface SaveMarksByCORequest {
	test_id: number;
	student_id: string;
	CO1?: number;
	CO2?: number;
	CO3?: number;
	CO4?: number;
	CO5?: number;
	CO6?: number;
}

export interface COTotals {
	CO1: number;
	CO2: number;
	CO3: number;
	CO4: number;
	CO5: number;
	CO6: number;
}

export interface MarksRecord {
	id: number;
	student_id: string;
	test_id: number;
	CO1: number;
	CO2: number;
	CO3: number;
	CO4: number;
	CO5: number;
	CO6: number;
}

export interface RawMarksRecord {
	question_identifier: string;
	marks: number;
	co: number;
}

export interface StudentMarks {
	marks: MarksRecord | null;
	raw_marks: RawMarksRecord[];
}

export interface BulkMarksEntry {
	student_rollno: string;
	question_number: number;
	sub_question: string | null;
	marks_obtained: number;
}

export interface BulkMarksSaveRequest {
	test_id: number;
	marks_entries: BulkMarksEntry[];
}

export interface BulkMarksSaveResponse {
	success: boolean;
	message: string;
	data: {
		successful: BulkMarksEntry[];
		failed: Array<BulkMarksEntry & { reason: string }>;
		total: number;
		success_count: number;
		failure_count: number;
	};
}

// Student & Enrollment Types
export interface Student {
	roll_no: string;
	student_name: string;
	rollno?: string; // Legacy
	name?: string; // Legacy
	department_id: number;
	dept?: number; // Legacy
	department_name?: string;
	department_code?: string;
}

export interface Enrollment {
	student_rollno: string;
	student_name: string;
	enrolled_at: string;
}

export interface CourseEnrollmentsResponse {
	success: boolean;
	data: {
		course_id: number;
		course_code: string;
		enrollment_count: number;
		enrollments: Enrollment[];
		test_info?: {
			test_id: number;
			test_name: string;
			questions: QuestionResponse[];
		};
	};
}

// Department Types
export interface Department {
	department_id: number;
	department_name: string;
	department_code: string;
	school_id?: number | null;
	school_name?: string;
	school_code?: string;
	description?: string;
}

// Admin Types
export interface AdminStats {
	totalUsers: number;
	totalCourses: number;
	totalStudents: number;
	totalAssessments: number;
}

export interface AdminCourse {
	course_id: number;
	course_code: string;
	course_name: string;
	id?: number; // compat
	name?: string; // compat
	credit: number;
	faculty_id: number;
	faculty_name: string;
	year: number;
	semester: number;
	co_threshold: number;
	passing_threshold: number;
}

export interface AdminTest {
	test_id: number;
	course_id: number;
	course_code: string;
	course_name: string;
	test_name: string;
	id?: number; // compat
	name?: string; // compat
	full_marks: number;
	pass_marks: number;
	year: number;
	semester: number;
}

export interface CreateUserRequest {
	employee_id: number;
	username: string;
	email: string;
	password: string;
	role: "admin" | "faculty" | "staff";
	designation?: string | null;
	phone?: string | null;
	department_id?: number | null;
}

// Attainment Types
export interface AttainmentConfig {
	course_id: number;
	co_threshold: number;
	passing_threshold: number;
	attainment_thresholds: Array<{
		id: number;
		level: number;
		percentage: number;
	}>;
}

export interface SaveAttainmentConfigRequest {
	course_id: number;
	co_threshold: number;
	passing_threshold: number;
	attainment_thresholds: Array<{
		id: number;
		percentage: number;
	}>;
}

export interface CoPoMappingRow {
	co_name: string;
	po_name: string;
	value: number;
}

export interface SaveCoPoMatrixRequest {
	mappings: Array<{ co: string; po: string; value: number }>;
}

// HOD Types
export interface HODStats {
	totalCourses: number;
	totalFaculty: number;
	totalStudents: number;
	totalAssessments: number;
}

export interface DepartmentCourse {
	id: number;
	course_code: string;
	name: string;
	credit: number;
	faculty_id: number;
	faculty_name: string;
	year: number;
	semester: number;
	co_threshold: number;
	passing_threshold: number;
}

export interface DepartmentFaculty {
	employee_id: number;
	username: string;
	email: string;
	designation: string | null;
	phone: string | null;
	role: string;
	department_id: number;
	is_hod?: boolean;
}

export interface CreateCourseRequest {
	course_code: string;
	name: string;
	credit: number;
	faculty_id: number;
	year: number;
	semester: number;
	co_threshold?: number;
	passing_threshold?: number;
}

export interface UpdateCourseRequest {
	course_code?: string;
	name?: string;
	credit?: number;
	faculty_id?: number;
	year?: number;
	semester?: number;
}

export interface AppointHODRequest {
	employee_id: number;
	appointment_order: string;
}

export interface CreateHODRequest extends AppointHODRequest {
	username: string;
	email: string;
	password: string;
	designation: string | null;
	phone: string | null;
}

// HOD User Management Types
export interface HODCreateUserRequest {
	employee_id: number;
	username: string;
	email: string;
	password: string;
	role: "faculty" | "staff";
	designation: string | null;
	phone: string | null;
}

export interface HODUpdateUserRequest {
	username?: string;
	email?: string;
	password?: string;
	role?: "faculty" | "staff";
	designation?: string | null;
	phone?: string | null;
}

// School Types
export interface School {
	school_id: number;
	school_code: string;
	school_name: string;
	description?: string;
	created_at?: string;
	dean: User | null;
	departments_count: number;
}

export interface CreateSchoolRequest {
	school_code: string;
	school_name: string;
	description?: string;
}

export interface UpdateSchoolRequest {
	school_code?: string;
	school_name?: string;
	description?: string;
}

export interface AppointDeanRequest {
	employee_id: number;
	appointment_order: string;
}

export interface CreateDeanRequest extends AppointDeanRequest {
	username: string;
	email: string;
	password: string;
	role: "faculty";
	department_id: number;
}

// Admin Department Management Types
export interface CreateDepartmentRequest {
	department_name: string;
	department_code: string;
	school_id?: number | null;
	description?: string;
}

export interface UpdateDepartmentRequest {
	department_name?: string;
	department_code?: string;
	school_id?: number | null;
	description?: string;
}

// Faculty Types
export interface FacultyStats {
	totalCourses: number;
	totalAssessments: number;
	totalStudents: number;
	averageAttainment: number;
}

// Staff Types
export interface StaffStats {
	totalCourses: number;
	totalStudents: number;
	totalEnrollments: number;
}

export interface StaffCourse {
	id: number;
	course_code: string;
	name: string;
	credit: number;
	faculty_id: string;
	faculty_name: string;
	year: number;
	semester: number;
	co_threshold: number;
	passing_threshold: number;
}

// Dean Types (read-only views)
export interface DeanStats {
	totalDepartments: number;
	totalUsers: number;
	totalCourses: number;
	totalStudents: number;
	totalAssessments: number;
	usersByRole: {
		hod?: number;
		faculty: number;
		staff: number;
	};
}

export interface DeanDepartment {
	department_id: number;
	department_name: string;
	department_code: string;
	hod_name: string | null;
	hod_employee_id?: number | null;
	faculty_count: number;
	staff_count: number;
	course_count: number;
	student_count: number;
}

export interface DeanUser {
	employee_id: number;
	username: string;
	email: string;
	designation: string | null;
	phone: string | null;
	role: string;
	department_id: number | null;
	department_name: string | null;
	department_code: string | null;
	is_hod?: boolean;
	is_dean?: boolean;
}

export interface DeanCourse {
	course_id: number;
	course_code: string;
	course_name: string;
	credit: number;
	faculty_id: number;
	faculty_name: string;
	year: number;
	semester: number;
	co_threshold: number;
	passing_threshold: number;
	department_name?: string;
	department_code?: string;
	enrollment_count: number;
	test_count: number;
}

export interface DeanStudent {
	roll_no: string;
	student_name: string;
	department_id: number;
	department_name: string;
	department_code: string;
}

export interface DeanTest {
	test_id: number;
	course_id: number;
	test_name: string;
	full_marks: number;
	pass_marks: number;
	course_code: string;
	course_name: string;
	faculty_name: string;
	department_name?: string;
	department_code?: string;
}

export interface DepartmentAnalytics {
	department_id: number;
	department_name: string;
	department_code: string;
	total_courses: number;
	total_tests: number;
	total_students: number;
	total_enrollments: number;
}
