# NBA API Reference

**Base URL:** `http://localhost/nba/api/`  
**Authentication:** All endpoints (except login) require: `Authorization: Bearer <jwt_token>`

---

## Table of Contents

1. [Authentication & Common](#authentication--common) - 6 endpoints
2. [Admin Endpoints](#admin-endpoints) - 11 endpoints
3. [HOD Endpoints](#hod-endpoints) - 9 endpoints
4. [Faculty Endpoints](#faculty-endpoints) - 1 endpoint
5. [Staff Endpoints](#staff-endpoints) - 3 endpoints
6. [Dean Endpoints](#dean-endpoints) - 7 endpoints
7. [Course Management](#course-management) - 2 endpoints
8. [Assessment Management](#assessment-management) - 2 endpoints
9. [Marks Management](#marks-management) - 6 endpoints
10. [Question Management](#question-management) - 2 endpoints
11. [Student Enrollment](#student-enrollment) - 3 endpoints
12. [Attainment Configuration](#attainment-configuration) - 4 endpoints
13. [Error Codes](#error-codes)

---

## Authentication & Common

### 1. Login

**POST** `/login`

```json
// REQUEST
{
  "employeeIdOrEmail": "admin@nba.edu",
  "password": "admin123"
}

// RESPONSE (200)
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "user": {
    "employee_id": 1,
    "username": "admin",
    "email": "admin@nba.edu",
    "role": "admin",
    "department_name": "Computer Science",  // null if admin
    "department_code": "CSE"                 // null if admin
  }
}

// ERROR (401)
{"success": false, "message": "Invalid credentials"}
```

---

### 2. Get Profile

**GET** `/profile`

```json
// RESPONSE (200)
{
	"success": true,
	"data": {
		"employee_id": 1,
		"username": "admin",
		"email": "admin@nba.edu",
		"role": "admin"
	}
}
```

---

### 3. Update Profile

**PUT** `/profile`

```json
// REQUEST (all optional)
{
  "username": "newusername",
  "email": "newemail@nba.edu",
  "password": "newpassword"
}

// RESPONSE (200)
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user */ }
}

// NOTE: Role changes are not allowed via this endpoint for security reasons
```

---

### 4. Logout

**POST** `/logout`

```json
// RESPONSE (200)
{ "success": true, "message": "Logout successful" }
```

---

### 4.1. Get User's Department

**GET** `/department`

```json
// RESPONSE (200)
{
	"success": true,
	"data": {
		"department_id": 1,
		"department_name": "CSE",
		"department_code": "CSE"
	}
}
```

---

### 4.2. Get All Departments

**GET** `/departments`

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{
			"department_id": 1,
			"department_name": "CSE",
			"department_code": "CSE"
		}
	]
}
```

---

## Admin Endpoints

**Role Required:** `admin`

### 5. Get Admin Stats

**GET** `/admin/stats`

```json
{
	"totalUsers": 50,
	"totalCourses": 25,
	"totalStudents": 500,
	"totalAssessments": 75
}
```

### 6. Manage Users

**GET** `/admin/users` | **POST** `/admin/users` | **DELETE** `/admin/users/{id}`

```json
// POST Request
{
	"employee_id": 5001,
	"username": "New User",
	"email": "user@tezu.edu",
	"password": "pass123",
	"role": "faculty",
	"department_id": 1  // Required if role is 'hod'
}

// ERROR (409) - HOD already exists
{"success": false, "message": "An HOD already exists for this department"}

// ERROR (409) - Dean already exists
{"success": false, "message": "A Dean already exists in the system"}

// ERROR (400) - HOD without department
{"success": false, "message": "Department ID is required for HOD role"}

// CONSTRAINTS:
// - Only one HOD per department allowed
// - Only one Dean allowed in the entire system
// - HOD role requires department_id
```

### 7. Manage Departments

**GET** `/admin/departments` | **POST** `/admin/departments` | **PUT** `/admin/departments/{id}` | **DELETE** `/admin/departments/{id}`

```json
// POST Request
{ "department_name": "AI & ML", "department_code": "AIML" }
```

### 8. View All Data

**GET** `/admin/courses` | **GET** `/admin/students` | **GET** `/admin/tests`

---

## HOD Endpoints

**Role Required:** `hod`

### 9. Get HOD Stats

**GET** `/hod/stats`

```json
{
	"totalCourses": 15,
	"totalFaculty": 8,
	"totalStudents": 200,
	"totalAssessments": 30
}
```

### 10. Manage Courses

**GET** `/hod/courses` | **POST** `/hod/courses` | **PUT** `/hod/courses/{id}` | **DELETE** `/hod/courses/{id}`

```json
// POST Request
{
	"course_code": "CS401",
	"name": "Machine Learning",
	"credit": 4,
	"faculty_id": 3001,
	"year": 2025,
	"semester": 1
}
```

### 11. Manage Department Users

**GET** `/hod/faculty` | **POST** `/hod/users` | **PUT** `/hod/users/{id}` | **DELETE** `/hod/users/{id}`

```json
// POST Request (faculty/staff only)
{
	"employee_id": 3020,
	"username": "Dr. New Faculty",
	"email": "faculty@tezu.edu",
	"password": "pass123",
	"role": "faculty"
}
```

---

## Faculty Endpoints

**Role Required:** `faculty` or `hod`

### 12. Get Faculty Stats

**GET** `/faculty/stats`

```json
{
	"totalCourses": 3,
	"totalAssessments": 9,
	"totalStudents": 120,
	"averageAttainment": 72.5
}
```

### 12.1. Delete Test

**DELETE** `/tests/{id}`

```json
// RESPONSE (200)
{ "success": true, "message": "Test deleted successfully" }
```

---

## Staff Endpoints

**Role Required:** `staff`

### 13. Get Staff Stats

**GET** `/staff/stats`

```json
{ "totalCourses": 20, "totalStudents": 300, "totalEnrollments": 450 }
```

### 14. View Department Data

**GET** `/staff/courses` | **GET** `/staff/students`

---

## Dean Endpoints

**Role Required:** `dean` (Read-only access to all data)

### 15. Get Dean Stats

**GET** `/dean/stats`

```json
{
	"totalDepartments": 7,
	"totalUsers": 50,
	"totalCourses": 80,
	"totalStudents": 1200,
	"totalAssessments": 240,
	"usersByRole": { "hod": 7, "faculty": 35, "staff": 8 }
}
```

### 16. View All Data

**GET** `/dean/departments` | **GET** `/dean/users` | **GET** `/dean/courses` | **GET** `/dean/students` | **GET** `/dean/tests`

### 17. Department Analytics

**GET** `/dean/analytics`

```json
[
	{
		"department_id": 1,
		"department_name": "CSE",
		"total_courses": 25,
		"total_tests": 75,
		"total_students": 400,
		"total_enrollments": 600
	}
]
```

---

## Course Management

### 18. Get Faculty Courses

**GET** `/courses`

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{
			"id": 1,
			"course_code": "CS101",
			"course_name": "Data Structures",
			"year": 2024,
			"semester": 3,
			"faculty_name": "Dr. Kumar"
		}
	]
}
```

---

### 19. Get Course Tests

**GET** `/course-tests?course_id=1`

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{
			"id": 1,
			"name": "Mid Semester",
			"full_marks": 50,
			"pass_marks": 20,
			"question_count": 10
		}
	]
}
```

---

## Assessment Management

### 20. Create Assessment

**POST** `/assessment`

```json
// REQUEST
{
  "course_id": 1,
  "name": "Mid Semester",
  "full_marks": 50,
  "pass_marks": 20,
  "question_paper_pdf": "base64_string...",  // optional
  "questions": [
    {
      "question_number": 1,
      "sub_question": null,     // or "a", "b", etc.
      "co": 1,                  // 1-6
      "max_marks": 10.0,
      "is_optional": false
    }
  ]
}

// RESPONSE (201)
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "test_id": 1,
    "test_name": "Mid Semester",
    "question_paper_filename": "CS101_2024_3_MidSemester.pdf",
    "questions": [ /* array */ ]
  }
}

// NOTE: Filename format: courseCode_year_semester_testName.pdf
```

---

### 21. Get Assessment Details

**GET** `/assessment?test_id=1`

```json
// RESPONSE (200)
{
	"success": true,
	"data": {
		"test": {
			"id": 1,
			"name": "Mid Semester",
			"full_marks": 50,
			"question_paper_filename": "CS101_2024_3_MidSemester.pdf"
		},
		"course": {
			"id": 1,
			"course_code": "CS101",
			"course_name": "Data Structures"
		},
		"questions": [
			{
				"id": 1,
				"question_number": 1,
				"sub_question": null,
				"question_identifier": "1",
				"co": 1,
				"max_marks": 10.0,
				"is_optional": false
			}
		]
	}
}
```

---

## Marks Management

### 22. Save Marks by Question

**POST** `/marks/by-question`

```json
// REQUEST
{
  "test_id": 1,
  "student_id": "CS101",
  "marks": [
    {"question_id": 1, "marks": 8.5},
    {"question_id": 2, "marks": 4.0}
  ]
}

// RESPONSE (200)
{
  "success": true,
  "message": "Marks saved successfully",
  "co_totals": {
    "CO1": 17.5,
    "CO2": 12.0
  }
}

// NOTE: CO totals auto-calculated
```

---

### 23. Save Marks by CO

**POST** `/marks/by-co`

```json
// REQUEST
{
  "test_id": 1,
  "student_id": "CS101",
  "CO1": 17.5,
  "CO2": 12.0,
  "CO3": 8.5,
  "CO4": 0,
  "CO5": 0,
  "CO6": 0
}

// RESPONSE (200)
{
  "success": true,
  "message": "Marks saved successfully"
}
```

---

### 24. Bulk Save Marks

**POST** `/marks/bulk`

```json
// REQUEST
{
  "test_id": 1,
  "marks_entries": [
    {
      "student_rollno": "CS101",
      "question_number": 1,
      "sub_question": null,
      "marks_obtained": 8.5
    }
  ]
}

// RESPONSE (200)
{
  "success": true,
  "message": "Marks entry completed: 1 successful, 0 failed",
  "data": {
    "successful": [ /* entries */ ],
    "failed": [ /* entries with reasons */ ],
    "total": 1,
    "success_count": 1,
    "failure_count": 0
  }
}

// NOTE: Handles partial failures
```

---

### 25. Get Student Marks

**GET** `/marks?test_id=1&student_id=CS101`

```json
// RESPONSE (200)
{
	"success": true,
	"data": {
		"marks": {
			"CO1": 17.5,
			"CO2": 12.0
		},
		"raw_marks": [
			{
				"question_number": 1,
				"marks_obtained": 8.5
			}
		]
	}
}
```

---

### 26. Get Test Marks (All Students)

**GET** `/marks/test?test_id=1&include_raw=true`

```json
// RESPONSE (200)
{
	"success": true,
	"data": {
		"test": { "test_name": "Mid Semester" },
		"course": { "course_code": "CS101" },
		"students": [
			{
				"student_rollno": "CS101",
				"student_name": "John Doe",
				"marks": { "CO1": 17.5, "CO2": 12.0 },
				"raw_marks": [
					/* if include_raw=true */
				]
			}
		]
	}
}

// NOTE: Use ?include_raw=true for per-question marks
```

---

### 27. Update Raw Marks Entry

**PUT** `/marks/raw/{id}`

```json
// REQUEST
{
  "marks_obtained": 8.5
}

// RESPONSE (200)
{
  "success": true,
  "message": "Marks updated successfully",
  "data": {
    "raw_marks_id": 789,
    "marks_obtained": 8.5
  }
}

// ERROR (400)
{"success": false, "message": "Marks cannot exceed maximum"}

// NOTE: CO totals auto-recalculated
```

---

### 28. Delete Raw Marks Entry

**DELETE** `/marks/raw/{id}`

```json
// RESPONSE (200)
{ "success": true, "message": "Marks entry deleted successfully" }

// NOTE: CO totals auto-recalculated
```

---

### 29. Delete All Student Marks

**DELETE** `/marks/student/{testId}/{studentId}`

```json
// RESPONSE (200)
{
	"success": true,
	"message": "All marks for student deleted successfully",
	"data": {
		"raw_marks_deleted": 10,
		"co_marks_deleted": 6
	}
}

// NOTE: Deletes both raw and aggregated marks
```

---

## Question Management

### 30. Update Question

**PUT** `/questions/{id}`

```json
// REQUEST (all optional)
{
  "co_number": 3,
  "max_marks": 10.0,
  "is_optional": false
}

// RESPONSE (200)
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "question_id": 123,
    "co_number": 3,
    "max_marks": 10.0
  }
}
```

---

### 31. Delete Question

**DELETE** `/questions/{id}`

```json
// RESPONSE (200)
{ "success": true, "message": "Question deleted successfully" }

// ⚠️ WARNING: Cascade deletes all raw marks
```

---

## Student Enrollment

### 32. Bulk Enroll Students

**POST** `/courses/{courseId}/enroll`

```json
// REQUEST
{
  "students": [
    {"rollno": "CS101", "name": "John Doe"},
    {"rollno": "CS102", "name": "Jane Smith"}
  ]
}

// RESPONSE (200)
{
  "success": true,
  "message": "Enrollment completed: 2 successful, 0 failed",
  "data": {
    "successful": [ /* entries */ ],
    "failed": [ /* entries with reasons */ ],
    "total": 2,
    "success_count": 2,
    "failure_count": 0
  }
}

// NOTE: Auto-creates students if they don't exist
```

---

### 33. Get Course Enrollments

**GET** `/courses/{courseId}/enrollments?test_id={testId}`

```json
// RESPONSE (200)
{
	"success": true,
	"data": {
		"course_id": 1,
		"course_code": "CS101",
		"enrollment_count": 3,
		"enrollments": [
			{
				"student_rollno": "CS101",
				"student_name": "John Doe",
				"enrolled_at": "2025-11-04 10:30:00"
			}
		],
		"test_info": {
			// only if test_id provided
			"test_id": 5,
			"test_name": "Mid Semester",
			"questions": [
				/* array */
			]
		}
	}
}

// NOTE: Include test_id to get questions for marks entry
```

---

### 33.1. Remove Enrollment

**DELETE** `/courses/{courseId}/enroll/{rollno}`

```json
// RESPONSE (200)
{ "success": true, "message": "Enrollment removed successfully" }
```

---

## Attainment Configuration

### 34. Get Attainment Config

**GET** `/courses/{courseId}/attainment-config`

```json
// RESPONSE (200)
{
	"course_id": 1,
	"co_threshold": 40.0,
	"passing_threshold": 60.0,
	"attainment_thresholds": [
		{ "id": 1, "level": 0, "percentage": 0.0 },
		{ "id": 2, "level": 1, "percentage": 40.0 },
		{ "id": 3, "level": 2, "percentage": 60.0 },
		{ "id": 4, "level": 3, "percentage": 80.0 }
	]
}
```

---

### 35. Save Attainment Config

**POST** `/courses/{courseId}/attainment-config`

```json
// REQUEST
{
  "co_threshold": 40.0,
  "passing_threshold": 60.0,
  "attainment_thresholds": [
    {"id": 1, "percentage": 0.0},
    {"id": 2, "percentage": 40.0}
  ]
}

// RESPONSE (200)
{"success": true, "message": "Configuration saved successfully"}
```

---

### 36. Get CO-PO Matrix

**GET** `/courses/{courseId}/copo-matrix`

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{ "co_name": "CO1", "po_name": "PO1", "value": 3 },
		{ "co_name": "CO1", "po_name": "PO2", "value": 2 }
	]
}
```

---

### 37. Save CO-PO Matrix

**POST** `/courses/{courseId}/copo-matrix`

```json
// REQUEST
{
  "matrix": [
    {"co": "CO1", "po": "PO1", "value": 3},
    {"co": "CO1", "po": "PO2", "value": 2}
  ]
}

// RESPONSE (200)
{"success": true, "message": "CO-PO mapping saved successfully"}
```

---

## Error Codes

| Code | Meaning      | Common Fix                     |
| ---- | ------------ | ------------------------------ |
| 200  | Success      | -                              |
| 400  | Bad Request  | Check input format             |
| 401  | Unauthorized | Add valid JWT token            |
| 403  | Forbidden    | Use account that owns resource |
| 404  | Not Found    | Check resource ID              |
| 409  | Conflict     | Resource already exists        |
| 500  | Server Error | Check database connection      |

---

## Total Endpoints: 40+ | Version: 2.1 | Last Updated: February 11, 2026

### Success

```json
{
	"success": true,
	"message": "Operation description",
	"data": {
		/* response data */
	}
}
```

### Error

```json
{
	"success": false,
	"message": "Error description"
}
```

### Validation Error

```json
{
	"success": false,
	"message": "Validation failed",
	"errors": ["Field X required", "Field Y invalid"]
}
```

---

## Important Notes

- **Authentication**: JWT token required (except login)
- **Authorization**: Faculty can only modify their own courses
- **CO Aggregation**: Automatic after marks changes
- **Cascade Deletes**: Database handles related deletions
- **Bulk Operations**: Partial failures don't stop operation
- **PDF Filenames**: Format `courseCode_year_semester_testName.pdf`
- **Question IDs**: Format `"1"` (main) or `"2a"` (sub-question)

---

**Version**: 2.1 | **Last Updated**: February 11, 2026
