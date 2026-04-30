# NBA API Reference

**Base URL:** `http://localhost/nba/api/`  
**Authentication:** All endpoints (except login) require: `Authorization: Bearer <jwt_token>`
**Version:** 5.1 (Offering-Scoped CO-PO & Attainment)

---

## 🔑 Role Architecture (v3.0+)

In version 3.0+, roles are handled via **assignments** rather than just a fixed database column.
- **Fixed Roles:** `admin`, `faculty`, `staff`
- **Dynamic Status:** `is_hod`, `is_dean` (Determined by active assignments in `hod_assignments` and `dean_assignments` tables).

JWT tokens now include these flags. The frontend should check `user.is_hod` and `user.is_dean` for dashboard access.

---

## Table of Contents

1. [Authentication & Common](#authentication--common) - 6 endpoints
2. [Admin Endpoints](#admin-endpoints) - 14 endpoints (Includes Dean Management)
3. [HOD Endpoints](#hod-endpoints) - 9 endpoints 
4. [Faculty Endpoints](#faculty-endpoints) - 1 endpoint
5. [Staff Endpoints](#staff-endpoints) - 3 endpoints
6. [Dean Endpoints](#dean-endpoints) - 9 endpoints (Includes HOD Management)
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
  "employeeIdOrEmail": "hod_cse@tezu.ac.in",
  "password": "password123"
}

// RESPONSE (200)
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "user": {
    "employee_id": 2001,
    "username": "HOD CSE",
    "email": "hod_cse@tezu.ac.in",
    "role": "faculty",
    "is_hod": true,
    "is_dean": false,
    "hod_department_id": 1,
    "school_id": null,
    "department_name": "Computer Science & Engineering",
    "department_code": "CSE"
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
		"employee_id": 2001,
		"username": "HOD CSE",
		"email": "hod_cse@tezu.ac.in",
		"role": "faculty",
		"is_hod": true,
		"is_dean": false,
		"hod_department_id": 1,
		"school_id": null
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
	"employee_id": 3020,
	"username": "New User",
	"email": "user@tezu.edu",
	"password": "pass123",
	"role": "faculty",  // admin, faculty, staff
	"department_id": 1
}

// CONSTRAINTS:
// - HOD and Dean status are managed via separate endpoints (see below)
// - Creating a user with role 'faculty' or 'staff' does NOT make them HOD/Dean
```

### 6.1. Manage Deans (Admin only)

**POST** `/admin/schools/{schoolId}/dean` | **DELETE** `/admin/dean/{employeeId}`

**A. Appoint/Create Dean**
```json
// Scenario 1: Assign existing faculty/staff as Dean
{
	"employee_id": 3001,
	"appointment_order": "ORD/DEAN/2026/01"
}

// Scenario 2: Create new user and assign as Dean
{
	"employee_id": 5001,
	"username": "DEAN_SOE",
	"email": "dean_soe@tezu.ac.in",
	"password": "password123",
	"role": "faculty",
	"department_id": 1,
	"appointment_order": "ORD/DEAN/2026/01"
}
```

**B. Demote Dean**
`DELETE /admin/dean/5001`

---

### 7. Manage Departments

**GET** `/admin/departments` | **POST** `/admin/departments` | **PUT** `/admin/departments/{id}` | **DELETE** `/admin/departments/{id}`

```json
// POST Request
{ 
	"department_name": "AI & ML", 
	"department_code": "AIML",
	"school_id": 1 
}
```

### 7.1. Manage Schools

**GET** `/admin/schools` | **POST** `/admin/schools`

---

### 8. View All Data

**GET** `/admin/courses` | **GET** `/admin/students` | **GET** `/admin/tests`

---

## HOD Endpoints

**Status Required:** `is_hod: true`

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

### 10. Manage Courses (Create Course & Offering)

**GET** `/hod/courses` | **POST** `/hod/courses` | **PUT** `/hod/courses/{id}` | **DELETE** `/hod/courses/{id}`

```json
// POST Request
{
	"course_code": "CS401",
	"name": "Machine Learning",
	"credit": 4,
	"faculty_id": 3001,
	"year": 2025,
	"semester": 1,
    "co_threshold": 40.0,
    "passing_threshold": 60.0
}

// NOTE: This creates a Course Template (if needed) AND a Course Offering for the specific year/sem.
```

### 11. Manage Department Users

**GET** `/hod/faculty` | **POST** `/hod/users` | **PUT** `/hod/users/{id}` | **DELETE** `/hod/users/{id}`

```json
// POST Request (faculty/staff only)
{
	"employee_id": 3020,
	"username": "New Faculty",
	"email": "faculty@tezu.edu",
	"password": "password",
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
	"totalTests": 12,
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

**Status Required:** `role: staff` (including users with `is_dean: true` if their base role is staff)

### 13. Get Staff Stats

**GET** `/staff/stats`

```json
{ "totalCourses": 20, "totalStudents": 300, "totalEnrollments": 450 }
```

### 14. View Department Data

**GET** `/staff/courses` | **GET** `/staff/students`

---

## Dean Endpoints

**Status Required:** `is_dean: true` (Read-only access to all data + HOD management)

### 15. Get Dean Stats

**GET** `/dean/stats`

```json
{
	"totalDepartments": 7,
	"totalStudents": 1500,
	"totalCourses": 45,
	"usersByRole": { "faculty": 42, "staff": 8 } 
}
```

### 16. View All Data

**GET** `/dean/departments` | **GET** `/dean/users` | **GET** `/dean/courses` | **GET** `/dean/students` | **GET** `/dean/tests`

### 17. Department Analytics

**GET** `/dean/analytics`

```json
[
	{
		"department_name": "CSE",
		"avg_attainment": 75.2
	}
]
```

---

### 18. Get Department Faculty

**GET** `/dean/departments/{departmentId}/faculty`

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{ "employee_id": 3001, "username": "Faculty Name", ... }
	]
}
```

---

### 19. Appoint HOD

**POST** `/dean/departments/{departmentId}/hod`

```json
// REQUEST (Scenario 1: Promote existing faculty)
{
	"employee_id": 3001,
	"appointment_order": "ORD/HOD/2026/01"
}

// REQUEST (Scenario 2: Create new HOD)
{
	"employee_id": 2005,
	"username": "New HOD",
	"email": "hod_new@tezu.ac.in",
	"password": "password123",
	"role": "faculty",
	"appointment_order": "ORD/HOD/2026/01"
}

// RESPONSE (200/201)
{
	"success": true,
	"message": "HOD appointed successfully"
}
```

---

### 20. Demote HOD

**DELETE** `/dean/hod/{employeeId}`

```json
// RESPONSE (200)
{
	"success": true,
	"message": "HOD demoted successfully"
}
```

---

## Course Management

### 21. Get Faculty Courses (Offerings)

**GET** `/courses`

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{
			"offering_id": 1,
            "course_id": 1,
			"course_code": "CS101",
			"course_name": "Intro to Programming",
			"year": 2025,
			"semester": 1,
            "assignment_type": "Primary"
		}
	]
}
```

---

## Assessment Management

### 23. Create Assessment (v5.0+)

**POST** `/assessment`

```json
// REQUEST
{
  "offering_id": 1,
  "name": "Mid Semester Exam",
  "test_type": "Mid Sem",
  "full_marks": 50,
  "pass_marks": 20,
  "questions": [
    { "question_number": 1, "co": 1, "max_marks": 10 },
    { "question_number": 2, "co": 2, "max_marks": 10 }
  ]
}

// NOTE: `offering_id` refers to the specific Course Offering (year/sem), NOT the generic course template ID.
// RESPONSE (201)
{
  "success": true,
  "message": "Assessment created successfully"
}
```

---

### 24. Get Assessment Details

**GET** `/assessment?test_id=1`

```json
// RESPONSE (200)
{
	"success": true,
	"data": {
		"test_id": 1,
		"offering_id": 5,
        "test_name": "Mid Sem",
        "questions": [...]
	}
}
```

---

### 22. Get Course Tests (v5.0+)

**GET** `/course-tests?offering_id=1`

**Note:** `offering_id` param (v5.0+). Legacy alias `course_id` accepted for backward compatibility but deprecated.

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{ "test_id": 1, "offering_id": 1, "test_name": "Mid Sem", ... }
	]
}
```

---

## Marks Management

### 25. Save Marks by Question

**POST** `/marks/by-question`

```json
// REQUEST
{
  "test_id": 1,
  "student_id": "CS101", // Roll No
  "question_id": 5,
  "marks_obtained": 8.5
}

// RESPONSE (200)
{
  "success": true,
  "message": "Marks saved successfully"
}

// NOTE: CO totals auto-calculated
```

---

### 26. Save Marks by CO

**POST** `/marks/by-co`

```json
// REQUEST
{
  "test_id": 1,
  "student_roll_no": "CS101",
  "CO1": 10,
  "CO2": 8,
  "CO3": 5,
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

### 27. Bulk Save Marks

**POST** `/marks/bulk`

```json
// REQUEST
{
  "test_id": 1,
  "marks": [
     { "student_id": "CS001", "question_id": 1, "marks_obtained": 5 },
     { "student_id": "CS001", "question_id": 2, "marks_obtained": 4 }
  ]
}

// RESPONSE (200)
{
  "success": true,
  "message": "Bulk marks saved",
  "data": { "success_count": 2, "fail_count": 0 }
}
```

---

### 28. Get Student Marks

**GET** `/marks?test_id=1&student_id=CS101`

```json
// RESPONSE (200)
{
	"success": true,
	"data": {
		"CO1": 10,
        "CO2": 15,
        ...
	}
}
```

---

### 29. Get Test Marks (All Students)

**GET** `/marks/test?test_id=1&include_raw=true`

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{ "student_roll_no": "CS001", "CO1": 10, ... }
	]
}
```

---

### 30. Update Raw Marks Entry

**PUT** `/marks/raw/{id}`

```json
// REQUEST
{
  "marks_obtained": 8.5
}
```

---

### 31. Delete Raw Marks Entry

**DELETE** `/marks/raw/{id}`

```json
// RESPONSE (200)
{ "success": true, "message": "Marks entry deleted successfully" }
```

---

### 32. Delete All Student Marks

**DELETE** `/marks/student/{testId}/{studentId}`

```json
// RESPONSE (200)
{
	"success": true,
	"message": "All marks deleted for student in this test"
}
```

---

## Question Management

### 33. Update Question

**PUT** `/questions/{id}`

```json
// REQUEST (all optional)
{
  "co_number": 3,
  "max_marks": 15,
  "is_optional": false
}
```

---

### 34. Delete Question

**DELETE** `/questions/{id}`

```json
// RESPONSE (200)
{ "success": true, "message": "Question deleted successfully" }
```

---

## Student Enrollment

### 35. Bulk Enroll Students

**POST** `/courses/{courseId}/enroll`

**Note:** `courseId` in URL is `offering_id` of the specific year/sem course invocation.

```json
// REQUEST
{
  "students": [
    { "roll_no": "CS001", "name": "Alice" },
    { "roll_no": "CS002", "name": "Bob" }
  ]
}

// RESPONSE (200)
{
  "success": true,
  "message": "Students enrolled successfully"
}
```

---

### 36. Get Course Enrollments

**GET** `/courses/{courseId}/enrollments?test_id={testId}`

**Note:** `courseId` in URL is `offering_id`.

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{ "enrollment_id": 101, "student_rollno": "CS001", "student_name": "Alice", ... }
	]
}
```

---

### 36.1. Remove Enrollment

**DELETE** `/courses/{courseId}/enroll/{rollno}`

```json
// RESPONSE (200)
{ "success": true, "message": "Enrollment removed successfully" }
```

---

## Attainment Configuration (v5.0+ - Offering Scoped)

### 37. Get Attainment Config (v5.0+)

**GET** `/offerings/{offeringId}/attainment-config`

**Note:** `offeringId` is the specific **Course Offering ID** (year/sem). Attainment Scales are now configured per offering (not globally per course template).

```json
// RESPONSE (200)
{
	"offering_id": 1,
	"scales": [
		{ "level": 1, "min_percentage": 40 },
        { "level": 2, "min_percentage": 60 },
        { "level": 3, "min_percentage": 75 }
	]
}
```

---

### 38. Save Attainment Config (v5.0+)

**POST** `/offerings/{offeringId}/attainment-config`

```json
// REQUEST
{
  "scales": [
      { "level": 1, "min_percentage": 40 },
      { "level": 2, "min_percentage": 60 },
      { "level": 3, "min_percentage": 75 }
  ]
}

// RESPONSE (200)
{"success": true, "message": "Configuration saved successfully"}
```

---

### 39. Get CO-PO Matrix (v5.0+)

**GET** `/offerings/{offeringId}/copo-matrix`

**Note:** `offeringId` is the specific **Course Offering ID**. CO-PO mappings are now per offering.

```json
// RESPONSE (200)
{
	"success": true,
	"data": [
		{ "co_number": 1, "po_name": "PO1", "value": 3 }
	]
}
```

---

### 40. Save CO-PO Matrix (v5.0+)

**POST** `/offerings/{offeringId}/copo-matrix`

```json
// REQUEST
{
  "matrix": [
    { "co_number": 1, "po_name": "PO1", "value": 3 },
    { "co_number": 1, "po_name": "PO2", "value": 1 }
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
| 500  | Server Error | Check logs for details         |
