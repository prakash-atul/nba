// Authentication Types
export interface LoginCredentials {
	employeeIdOrEmail: string;
	password: string;
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginationMeta {
	next_cursor: string | null;
	prev_cursor: string | null;
	has_more: boolean;
	total: number;
	limit: number;
}

export interface PaginatedResponse<T> {
	success: boolean;
	message: string;
	data: T[];
	pagination: PaginationMeta;
}

export interface PaginationParams {
	cursor?: string;
	limit?: number;
	sort?: string;
	sort_dir?: "ASC" | "DESC";
	search?: string;
	[key: string]: string | number | undefined;
}

// ─── Auth / Users ────────────────────────────────────────────────────────────

export interface User {
	employee_id: number;
	username: string;
	email: string;
	role: string;
	designation: string | null;
	phones?: string[];
	phone?: string | null;
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
	course_id: number;
	offering_id?: number; // offering_id from the database; use this as the identifier for API calls
	course_code: string;
	course_name: string;
	credit: number;
	syllabus: string | null;
	faculty_id: number;
	year: number;
	semester: string;
	is_active?: number;
	enrollment_count?: number;
	test_count?: number;
	avg_score_pct?: number | null;
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
	validate_marks?: boolean;
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
	validate_marks?: boolean;
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
	validate_marks?: boolean;
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
	department_id: number;
	batch_year: number;
	student_status: string;
	email: string | null;
	phones: string[];
	department_name: string;
	department_code: string;

	// Legacy support
	rollno?: string;
	name?: string;
	dept?: number;
}

export interface EnrolledStudent extends Student {
	enrolled_courses: string; // comma-separated "code: name (year/sem)" entries
}

export interface UpdateStudentRequest {
	student_name?: string;
	email?: string | null;
	phones?: string[];
	phone?: string | null;
	student_status?: string;
	batch_year?: number;
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
	created_at?: string;
	hod_employee_id?: number | null;
	hod_name?: string | null;
	faculty_count?: number;
	student_count?: number;
	course_count?: number;
	active_offerings_count?: number;
	latest_offering?: string | null;
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
	credit: number;
	department_id?: number | null;
	department_code?: string | null;
	department_name?: string | null;
	course_type?: string;
	course_level?: string;
	is_active?: number;
	created_at?: string;
	updated_at?: string;
	// Offering fields (latest offering per course)
	offering_id?: number | null;
	year?: number | null;
	semester?: string | null;
	co_threshold?: number | null;
	passing_threshold?: number | null;
	faculty_id?: number | null;
	faculty_name?: string | null;
	enrollment_count?: number;
	test_count?: number;
	// Legacy/Compat
	id?: number;
	name?: string;
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
	semester: string;
}

export interface CreateUserRequest {
	employee_id: number;
	username: string;
	email: string;
	password: string;
	role: "admin" | "faculty" | "hod" | "staff" | "dean";
	designation?: string | null;
	phones: string[];
	department_id?: number | null;
	school_id?: number | null;
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

export interface BaseCourse {
	course_id: number;
	course_code: string;
	course_name: string;
	credit: number;
	department_id?: number | null;
	course_type?: string;
	course_level?: string;
	is_active?: number;
}

export interface DepartmentCourse {
	course_id: number;
	course_code: string;
	course_name: string;
	credit: number;
	department_id?: number | null;
	course_type?: string;
	course_level?: string;
	is_active?: number;
	// Offering fields (latest offering per course)
	offering_id?: number | null;
	year?: number | null;
	semester?: string | null;
	co_threshold?: number | null;
	passing_threshold?: number | null;
	faculty_id?: number | null;
	faculty_name?: string | null;
	cfa_is_active?: number | null;
	enrollment_count?: number;
	test_count?: number;
	avg_score_pct?: number | null;
}

export interface TestAverage {
	test_id: number;
	test_name: string;
	test_type: string;
	full_marks: number;
	avg_marks: number | null;
	avg_pct: number | null;
	students_assessed: number;
}

export interface DepartmentFaculty {
	employee_id: number;
	username: string;
	email: string;
	designation: string | null;
	phones?: string[];
	phone?: string | null;
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
	semester: string;
	co_threshold?: number;
	passing_threshold?: number;
}

export interface UpdateCourseRequest {
	course_code?: string;
	name?: string;
	credit?: number;
	faculty_id?: number;
	year?: number;
	semester?: string;
}

export interface AppointHODRequest {
	employee_id: number;
	appointment_order: string;
}

export interface HODHistoryRecord {
	id: number;
	department_id: number;
	department_name: string;
	department_code: string;
	employee_id: number;
	username: string;
	email: string;
	designation: string | null;
	phones?: string[];
	phone?: string | null;
	start_date: string;
	end_date: string | null;
	is_current: number;
	appointment_order: string | null;
	created_at: string;
}

// HOD User Management Types
export interface HODCreateUserRequest {
	employee_id: number;
	username: string;
	email: string;
	password: string;
	role: "faculty" | "staff";
	designation: string | null;
	phones?: string[];
	phone?: string | null;
}

export interface HODUpdateUserRequest {
	username?: string;
	email?: string;
	password?: string;
	role?: "faculty" | "staff";
	designation?: string | null;
	phones?: string[];
	phone?: string | null;
}

export interface AdminUpdateUserRequest {
	username?: string;
	email?: string;
	password?: string;
	role?: "admin" | "dean" | "hod" | "faculty" | "staff";
	department_id?: number | null;
	school_id?: number | null;
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
	role: "dean";
	department_id?: number | null;
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

export interface CourseStats {
	totalAssessments: number;
	activeStudents: number;
	avgPerformance: number | null;
	marksCount: number;
}

// Staff Types
export interface StaffStats {
	totalCourses: number;
	totalStudents: number;
	totalEnrollments: number;
}

export interface StaffCourse {
	course_id: number;
	course_code: string;
	course_name: string;
	credit: number;
	department_id?: number | null;
	course_type?: string;
	course_level?: string;
	is_active?: number;
	offering_id?: number | null;
	year?: number | null;
	semester?: string | null;
	co_threshold?: number | null;
	passing_threshold?: number | null;
	faculty_id?: number | null;
	faculty_name?: string | null;
	enrollment_count?: number;
	test_count?: number;
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
	phones?: string[];
	phone?: string | null;

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
	department_id?: number | null;
	department_name?: string;
	department_code?: string;
	course_type?: string;
	course_level?: string;
	is_active?: number;
	// Offering fields (latest offering per course)
	offering_id?: number | null;
	year?: number | null;
	semester?: string | null;
	co_threshold?: number | null;
	passing_threshold?: number | null;
	faculty_id?: number | null;
	faculty_name?: string | null;
	enrollment_count?: number;
	test_count?: number;
}

export interface DeanStudent {
	roll_no: string;
	student_name: string;
	department_id: number;
	department_name: string;
	department_code: string;
	batch_year: number | null;
	student_status: string;
	email: string | null;
	phones: string[];
}

export interface DeanTest {
	test_id: number;
	offering_id: number;
	test_name: string;
	test_type?: string | null;
	full_marks: number;
	pass_marks: number;
	course_code: string;
	course_name: string;
	year?: number | null;
	semester?: string | null;
	faculty_name?: string | null;
	department_name?: string | null;
	department_code?: string | null;
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
