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
	cfa_is_active?: number | null;
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
	offering_id: number;
	course_id?: number; // legacy alias
	name: string;
	full_marks: number;
	pass_marks: number;
}

export interface CreateAssessmentRequest {
	offering_id: number;
	course_id?: number; // legacy alias
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
	student_name?: string;
	programme_id?: number;
	programme_name?: string;
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
	programme_id: number;
	batch_year: number;
	student_status: string;
	email: string | null;
	phones: string[];
	programme_name?: string;
	programme_code?: string;
	department_id?: number;
	department_name: string;
	department_code: string;
	enrolled_courses?: string; // comma-separated "code: name (year/sem)" entries

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
	programme_id?: number;
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
		offering_id: number;
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

export interface Programme {
	programme_id: number;
	department_id: number;
	programme_code: string;
	programme_name: string;
	degree_level: "UG" | "PG" | "Diploma" | "PhD";
	duration_years: number;
	created_at?: string;
	department_name?: string;
	department_code?: string;
	school_id?: number | null;
	school_name?: string | null;
	school_code?: string | null;
	student_count?: number;
	course_count?: number;
}

export interface ProgrammeWithBatch {
	programme_id: number;
	department_id: number;
	programme_code: string;
	programme_name: string;
	degree_level: "UG" | "PG" | "Diploma" | "PhD";
	duration_years: number;
	created_at?: string;
	batch_year: number;
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
	cfa_is_active?: number | null;
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
	offering_id: number;
	course_id?: number;
	co_threshold: number;
	passing_threshold: number;
	direct_weightage: number;
	indirect_weightage: number;
	attainment_thresholds: Array<{
		id: number;
		level: number;
		percentage: number;
	}>;
}

export interface SaveAttainmentConfigRequest {
	offering_id: number;
	co_threshold: number;
	passing_threshold: number;
	direct_weightage: number;
	indirect_weightage: number;
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

export interface OfferingAttainmentCO {
	co_name: string;
	attainment_percentage: number;           // Direct (backward-compatible)
	attainment_level: number;                 // Direct
	indirect_attainment_percentage?: number | null;
	indirect_attainment_level?: number | null;
	final_attainment_percentage?: number | null;
	final_attainment_level?: number | null;
}

export interface OfferingAttainmentPO {
	po_name: string;
	attainment_value: number;                // Final (backward-compatible)
	direct_attainment_value?: number | null;
	indirect_attainment_value?: number | null;
	final_attainment_value?: number | null;
}

export interface OfferingAttainmentSnapshotInfo {
	offering_id: number;
	co_threshold: number;
	passing_threshold: number;
	attainment_thresholds: Array<{ id: number; level: number; percentage: number }>;
	co_attainment: OfferingAttainmentCO[];
	po_attainment: OfferingAttainmentPO[];
}

export interface OfferingAttainmentResponse extends OfferingAttainmentSnapshotInfo {
}

export interface ProgrammeAttainmentResponse {
	programme_id: number;
	batch_year: number | null;
	po_attainment: OfferingAttainmentPO[];
}

export interface CoursePOAttainmentRow {
	offering_id: number;
	course_code: string;
	course_name: string;
	values: Record<string, number | null>;
}

export interface CourseLevelProgrammeAttainmentResponse {
	programme_id: number;
	batch_year: number | null;
	po_list: string[];
	courses: CoursePOAttainmentRow[];
	averages: Record<string, number>;
	finals: Record<string, number>;
	indirect: Record<string, number | null>;
	targets: Record<string, number>;
}

export interface SaveCoPoMatrixRequest {
	mappings: Array<{ co: string; po: string; value: number }>;
}

// Survey types
export interface CourseSurveyQuestion {
	question_id?: number;
	question_number: number;
	question_text: string;
	co_number: number;
	mapping_weight: number;
}

export interface CourseExitSurveyConfig {
	survey_id: number;
	offering_id: number;
	title: string;
	questions: CourseSurveyQuestion[];
}

export interface CourseExitSurveyRow {
	student_rollno: string;
	question_id: number;
	likert_rating: number;
}

export interface CourseExitSurveyRawRow {
	student_rollno: string;
	ratings: Record<string, number | null>;
}

export interface CourseExitSurveyImportRequest {
	responses: CourseExitSurveyRow[];
}

export interface CourseExitSurveyImportResponse {
	imported_count: number;
	error_count: number;
	errors: string[];
}

export interface CourseExitSurveyCoResult {
	co_number: number;
	co_name: string;
	average_rating: number | null;
	normalized_rating: number | null;
	respondent_count: number;
}

export interface CourseExitSurveyQuestionAnalysis {
	question_id: number;
	question_number: number;
	question_text: string;
	co_number: number;
	mapping_weight: number;
	average_rating: string | null;
	normalized_rating: number | null;
	rating_variance: string | null;
	respondent_count: number;
}

export interface CourseExitSurveyResultsResponse {
	offering_id: number;
	has_data: boolean;
	co_results: CourseExitSurveyCoResult[];
	question_analysis?: CourseExitSurveyQuestionAnalysis[];
	raw_responses: CourseExitSurveyRawRow[];
}

export interface SurveyEnrollment {
	roll_no: string;
	student_name: string;
	responses: Record<string, number>; // question_id -> likert_rating
}

export interface CourseExitEnrollmentsResponse {
	enrollments: SurveyEnrollment[];
	questions: CourseSurveyQuestion[];
}

export interface ManualEntryResponse {
	student_rollno: string;
	question_id: number;
	likert_rating: number;
}

// Stakeholder Survey Types
export interface StakeholderSurveyRow {
	po_name: string;
	likert_rating: number;
	respondent_identifier?: string | null;
	respondent_name?: string | null;
	qualification?: string | null;
}

export interface StakeholderSurveyImportRequest {
	batch_year: number;
	stakeholder_type: string;
	responses: StakeholderSurveyRow[];
}

export interface StakeholderSurveyImportResponse {
	imported_count: number;
	error_count: number;
	errors: string[];
}

export interface StakeholderPOAverage {
	po_name: string;
	average_rating: number;
	attainment_percentage: number;
	respondent_count: number;
}

export interface StakeholderByTypeRow {
	stakeholder_type: string;
	po_name: string;
	average_rating: number;
	respondent_count: number;
}

export interface StakeholderIndividualResponse {
	respondent_identifier: string | null;
	respondent_name: string | null;
	qualification: string | null;
	ratings: Record<string, number>;
}

export interface StakeholderSurveyResultsResponse {
	programme_id: number;
	batch_year: number;
	has_data: boolean;
	stakeholder_types: string[];
	averages: StakeholderPOAverage[];
	by_type: StakeholderByTypeRow[];
	individual: StakeholderIndividualResponse[];
}

export interface StakeholderSurveyQuestion {
	question_id?: number;
	question_number: number;
	question_text: string;
	po_name: string;
	mapping_weight: number;
}

export interface StakeholderSurveyConfigResponse {
	survey_id: number;
	programme_id: number;
	batch_year: number;
	stakeholder_type: string;
	title: string;
	questions: StakeholderSurveyQuestion[];
}

// Action Plan Types
export interface ActionPlan {
	id: number;
	programme_id: number | null;
	offering_id: number | null;
	batch_year: number | null;
	po_name: string | null;
	gap_description: string;
	action_text: string;
	responsible_person: string | null;
	target_date: string | null;
	status: "Open" | "In Progress" | "Completed";
	created_by: number | null;
	created_at: string;
	updated_at: string;
}

export interface CreateActionPlanRequest {
	batch_year?: number;
	po_name?: string;
	gap_description: string;
	action_text: string;
	responsible_person?: string;
	target_date?: string;
	status?: "Open" | "In Progress" | "Completed";
}

export interface SetTargetsRequest {
	batch_year: number;
	targets: Record<string, number>;
}

export interface OfferingAttainmentPO {
	po_name: string;
	attainment_value: number;
}

export interface OfferingAttainmentSnapshotInfo {
	offering_id: number;
	co_threshold: number;
	passing_threshold: number;
	attainment_thresholds: Array<{ id: number; level: number; percentage: number }>;
	co_attainment: OfferingAttainmentCO[];
	po_attainment: OfferingAttainmentPO[];
}

export interface OfferingAttainmentResponse extends OfferingAttainmentSnapshotInfo {
	// Extends the snapshot info (same shape returned by apiGet's .data field)
}



export interface ProgrammeAttainmentResponse {
	programme_id: number;
	batch_year: number | null;
	po_attainment: OfferingAttainmentPO[];
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
	department_code?: string | null;
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

export interface CreateProgrammeRequest {
	department_id?: number;
	programme_code: string;
	programme_name: string;
	degree_level?: "UG" | "PG" | "Diploma" | "PhD";
	duration_years?: number;
}

export interface UpdateProgrammeRequest {
	department_id?: number;
	programme_code?: string;
	programme_name?: string;
	degree_level?: "UG" | "PG" | "Diploma" | "PhD";
	duration_years?: number;
}

export interface ProgrammeBulkStudent {
	rollno: string;
	name: string;
	batch_year?: number;
}

export interface ProgrammeCourse {
	id: number;
	programme_id: number;
	course_id: number;
	course_code: string;
	course_name: string;
	credits: number | null;
	created_at: string;
}

export interface ProgrammeCourseResponse {
	courses: ProgrammeCourse[];
	available: Array<{
		course_id: number;
		course_code: string;
		course_name: string;
		credits: number | null;
	}>;
}

export interface ProgrammeBulkEnrollRequest {
	students: ProgrammeBulkStudent[];
	batch_year?: number;
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
	programme_id: number;
	programme_name?: string;
	programme_code?: string;
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
