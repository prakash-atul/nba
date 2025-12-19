const API_BASE_URL = "http://localhost/nba/api";

export interface LoginCredentials {
	employeeIdOrEmail: string;
	password: string;
}

export interface User {
	employee_id: number;
	username: string;
	email: string;
	role: string;
	department_id: number | null;
	department_name?: string;
	department_code?: string;
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

export interface Student {
	rollno: string;
	name: string;
	dept: number;
	department_name?: string;
	department_code?: string;
}

export interface Department {
	department_id: number;
	department_name: string;
	department_code: string;
}

export interface AdminStats {
	totalUsers: number;
	totalCourses: number;
	totalStudents: number;
	totalAssessments: number;
}

export interface AdminCourse {
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

export interface AdminTest {
	id: number;
	course_id: number;
	course_code: string;
	course_name: string;
	name: string;
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
	role: "admin" | "dean" | "hod" | "faculty" | "staff";
	department_id?: number | null;
}

export interface Enrollment {
	student_rollno: string;
	student_name: string;
	enrolled_at: string;
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

class ApiService {
	private token: string | null = null;

	constructor() {
		// Load token from localStorage on initialization
		this.token = localStorage.getItem("auth_token");
	}

	setToken(token: string) {
		this.token = token;
		localStorage.setItem("auth_token", token);
	}

	clearToken() {
		this.token = null;
		localStorage.removeItem("auth_token");
		localStorage.removeItem("user");
	}

	getToken(): string | null {
		return this.token;
	}

	async login(credentials: LoginCredentials): Promise<LoginResponse> {
		const response = await fetch(`${API_BASE_URL}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(credentials),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Login failed");
		}

		if (data.success) {
			this.setToken(data.data.token);
			localStorage.setItem("user", JSON.stringify(data.data.user));
		}

		return data;
	}

	async logout(): Promise<void> {
		if (this.token) {
			try {
				await fetch(`${API_BASE_URL}/logout`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.token}`,
					},
				});
			} catch (error) {
				console.error("Logout error:", error);
			}
		}
		this.clearToken();
	}

	async getProfile(): Promise<User> {
		const response = await fetch(`${API_BASE_URL}/profile`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch profile");
		}

		return data.data;
	}

	getStoredUser(): User | null {
		const userStr = localStorage.getItem("user");
		if (userStr) {
			return JSON.parse(userStr);
		}
		return null;
	}

	// Assessment APIs
	async getCourses(): Promise<Course[]> {
		const response = await fetch(`${API_BASE_URL}/courses`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch courses");
		}

		return data.data;
	}

	async getCourseTests(courseId: number): Promise<Test[]> {
		const response = await fetch(
			`${API_BASE_URL}/course-tests?course_id=${courseId}`,
			{
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch tests");
		}

		// API returns { success: true, message: "...", data: { course: {...}, tests: [...] } }
		// We need to extract the tests array from data.data.tests
		if (data.data && data.data.tests && Array.isArray(data.data.tests)) {
			return data.data.tests;
		}

		// Fallback: ensure we always return an array
		return [];
	}

	async createAssessment(
		assessment: CreateAssessmentRequest
	): Promise<CreateAssessmentResponse> {
		const response = await fetch(`${API_BASE_URL}/assessment`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.token}`,
			},
			body: JSON.stringify(assessment),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.errors
					? data.errors.join(", ")
					: data.message || "Failed to create assessment"
			);
		}

		return data;
	}

	async getAssessment(testId: number): Promise<{
		test: Test;
		course: Course;
		questions: QuestionResponse[];
	}> {
		const response = await fetch(
			`${API_BASE_URL}/assessment?test_id=${testId}`,
			{
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch assessment");
		}

		return data.data;
	}

	// Marks Management APIs

	async saveMarksByQuestion(
		marksData: SaveMarksByQuestionRequest
	): Promise<{ student_id: string; test_id: number; co_totals: COTotals }> {
		const response = await fetch(`${API_BASE_URL}/marks/by-question`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.token}`,
			},
			body: JSON.stringify(marksData),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to save marks");
		}

		return data.data;
	}

	async saveMarksByCO(marksData: SaveMarksByCORequest): Promise<MarksRecord> {
		const response = await fetch(`${API_BASE_URL}/marks/by-co`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.token}`,
			},
			body: JSON.stringify(marksData),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to save marks");
		}

		return data.data;
	}

	async saveBulkMarks(
		bulkMarksData: BulkMarksSaveRequest
	): Promise<BulkMarksSaveResponse> {
		const response = await fetch(`${API_BASE_URL}/marks/bulk`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.token}`,
			},
			body: JSON.stringify(bulkMarksData),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to save bulk marks");
		}

		return data;
	}

	async getCourseEnrollments(
		courseId: number,
		testId?: number
	): Promise<CourseEnrollmentsResponse["data"]> {
		const url = testId
			? `${API_BASE_URL}/courses/${courseId}/enrollments?test_id=${testId}`
			: `${API_BASE_URL}/courses/${courseId}/enrollments`;

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch enrollments");
		}

		return data.data;
	}

	async getStudentMarks(
		testId: number,
		studentId: string
	): Promise<StudentMarks> {
		const response = await fetch(
			`${API_BASE_URL}/marks?test_id=${testId}&student_id=${studentId}`,
			{
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch marks");
		}

		return data.data;
	}

	async getTestMarks(testId: number): Promise<{
		test: Test;
		course: Course;
		marks: Array<{
			student_id: string;
			student_name: string;
			CO1: string | number;
			CO2: string | number;
			CO3: string | number;
			CO4: string | number;
			CO5: string | number;
			CO6: string | number;
		}>;
	}> {
		const response = await fetch(
			`${API_BASE_URL}/marks/test?test_id=${testId}`,
			{
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch test marks");
		}

		return data.data;
	}

	async getAttainmentConfig(courseId: number): Promise<{
		course_id: number;
		co_threshold: number;
		passing_threshold: number;
		attainment_thresholds: Array<{
			id: number;
			level: number;
			percentage: number;
		}>;
	}> {
		const response = await fetch(
			`${API_BASE_URL}/courses/${courseId}/attainment-config`,
			{
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.message || "Failed to fetch attainment configuration"
			);
		}

		return data.data;
	}

	async saveAttainmentConfig(config: {
		course_id: number;
		co_threshold: number;
		passing_threshold: number;
		attainment_thresholds: Array<{
			id: number;
			percentage: number;
		}>;
	}): Promise<{ success: boolean; message: string }> {
		const response = await fetch(
			`${API_BASE_URL}/courses/${config.course_id}/attainment-config`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.token}`,
				},
				body: JSON.stringify(config),
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.message || "Failed to save attainment configuration"
			);
		}

		return data;
	}

	// Admin APIs

	async getAdminStats(): Promise<AdminStats> {
		const response = await fetch(`${API_BASE_URL}/admin/stats`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch admin stats");
		}

		return data.data;
	}

	async getAllUsers(): Promise<User[]> {
		const response = await fetch(`${API_BASE_URL}/admin/users`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch users");
		}

		return data.data;
	}

	async createUser(userData: CreateUserRequest): Promise<User> {
		const response = await fetch(`${API_BASE_URL}/admin/users`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.token}`,
			},
			body: JSON.stringify(userData),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to create user");
		}

		return data.data;
	}

	async deleteUser(employeeId: number): Promise<void> {
		const response = await fetch(
			`${API_BASE_URL}/admin/users/${employeeId}`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to delete user");
		}
	}

	async getAllDepartments(): Promise<Department[]> {
		const response = await fetch(`${API_BASE_URL}/departments`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch departments");
		}

		return data.data;
	}

	async getAllCoursesAdmin(): Promise<AdminCourse[]> {
		const response = await fetch(`${API_BASE_URL}/admin/courses`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch courses");
		}

		return data.data;
	}

	async getAllStudentsAdmin(): Promise<Student[]> {
		const response = await fetch(`${API_BASE_URL}/admin/students`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch students");
		}

		return data.data;
	}

	async getAllTestsAdmin(): Promise<AdminTest[]> {
		const response = await fetch(`${API_BASE_URL}/admin/tests`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || "Failed to fetch tests");
		}

		return data.data;
	}
}

export const apiService = new ApiService();
