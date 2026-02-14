# NBA System v2.x vs v3.0 - Quick Reference

## Major Changes Summary

| Feature | v2.x | v3.0 |
|---------|------|------|
| **Schools** | ❌ Not supported | ✅ Multi-school hierarchy |
| **HOD/Dean** | User roles | Assignment records with history |
| **Designation** | ❌ Not present | ✅ Formal job titles |
| **Course-Faculty** | Direct FK | Semester-wise assignments table |
| **Historical Tracking** | ❌ No history | ✅ Complete tenure records |
| **Table Count** | 11 tables | 15 tables |

---

## New Tables in v3.0

1. **schools** - Multi-school support
2. **hod_assignments** - HOD appointment history
3. **dean_assignments** - Dean appointment history  
4. **course_faculty_assignments** - Semester-wise teaching assignments

---

## Modified Tables

### users
```diff
- role: ENUM('admin', 'dean', 'hod', 'faculty', 'staff')
+ role: ENUM('admin', 'faculty', 'staff')
+ designation: ENUM('Professor', 'Associate Professor', ...)
+ phone: VARCHAR(15)
+ created_at: TIMESTAMP
+ updated_at: TIMESTAMP
```

### departments
```diff
+ school_id: INT(11) FK → schools
+ description: TEXT
+ created_at: TIMESTAMP
```

### courses
```diff
- id: BIGINT
+ course_id: BIGINT
- faculty_id: INT(11) FK → users
+ department_id: INT(11) FK → departments
- year: INT
- semester: INT
+ course_type: ENUM('Theory', 'Lab', 'Project', 'Seminar')
+ created_at: TIMESTAMP
+ updated_at: TIMESTAMP
```

### students (renamed from student)
```diff
- rollno: VARCHAR(20)
+ roll_no: VARCHAR(20)
- name: VARCHAR(100)
+ student_name: VARCHAR(100)
- dept: INT(11)
+ department_id: INT(11)
+ batch_year: INT
+ student_status: ENUM('Active', 'Graduated', ...)
+ email: VARCHAR(64) UNIQUE
+ phone: VARCHAR(15)
+ created_at: TIMESTAMP
```

### enrollments (renamed from enrollment)
```diff
- id: BIGINT
+ enrollment_id: BIGINT
- student_rollno: VARCHAR(20)
+ student_roll_no: VARCHAR(20)
- enrolled_at: TIMESTAMP
+ enrolled_date: DATE
+ year: INT
+ semester: INT
+ enrollment_status: ENUM('Enrolled', 'Completed', ...)
+ created_at: TIMESTAMP
```

### tests (renamed from test)
```diff
- id: BIGINT
+ test_id: BIGINT
- name: VARCHAR(100)
+ test_name: VARCHAR(100)
+ test_type: ENUM('CAT-1', 'CAT-2', 'ESE', ...)
+ test_date: DATE
+ created_at: TIMESTAMP
```

### questions (renamed from question)
```diff
- id: BIGINT
+ question_id: BIGINT
```

### raw_marks (renamed from rawMarks)
```diff
- student_id: VARCHAR(20)
+ student_roll_no: VARCHAR(20)
- marks: DECIMAL(6,2)
+ marks_obtained: DECIMAL(6,2)
+ updated_at: TIMESTAMP
```

### marks
```diff
- student_id: VARCHAR(20)
+ student_roll_no: VARCHAR(20)
+ updated_at: TIMESTAMP
```

---

## Common Query Patterns

### v2.x → v3.0 Query Migration

#### Get Current HOD
```sql
-- v2.x
SELECT * FROM users 
WHERE role = 'hod' AND department_id = 1;

-- v3.0
SELECT u.* FROM users u
JOIN hod_assignments h ON u.employee_id = h.employee_id
WHERE h.department_id = 1 AND h.is_current = TRUE;

-- v3.0 (Using View)
SELECT * FROM v_current_hods WHERE department_id = 1;
```

#### Get Current Dean
```sql
-- v2.x
SELECT * FROM users 
WHERE role = 'dean';

-- v3.0
SELECT u.* FROM users u
JOIN dean_assignments d ON u.employee_id = d.employee_id
WHERE d.school_id = 1 AND d.is_current = TRUE;

-- v3.0 (Using View)
SELECT * FROM v_current_deans WHERE school_id = 1;
```

#### Get Faculty's Courses
```sql
-- v2.x
SELECT * FROM course 
WHERE faculty_id = 101;

-- v3.0
SELECT c.* FROM courses c
JOIN course_faculty_assignments cfa ON c.course_id = cfa.course_id
WHERE cfa.employee_id = 101 AND cfa.is_active = TRUE;
```

#### Get Student Enrollments
```sql
-- v2.x
SELECT c.* FROM course c
JOIN enrollment e ON c.id = e.course_id
WHERE e.student_rollno = 'CS2024001';

-- v3.0
SELECT c.* FROM courses c
JOIN enrollments e ON c.course_id = e.course_id
WHERE e.student_roll_no = 'CS2024001' 
  AND e.year = 2024 AND e.semester = 1
  AND e.enrollment_status = 'Enrolled';
```

#### Get Department Faculty
```sql
-- v2.x
SELECT * FROM users 
WHERE department_id = 1 AND role = 'faculty';

-- v3.0 (same, but now includes HODs who are faculty)
SELECT * FROM users 
WHERE department_id = 1 AND role = 'faculty';
```

---

## New Capabilities in v3.0

### 1. School-Level Queries
```sql
-- Get all departments in a school
SELECT d.* FROM departments d
WHERE d.school_id = 1;

-- Get school-level statistics
SELECT 
    s.school_name,
    COUNT(DISTINCT d.department_id) as departments,
    COUNT(DISTINCT u.employee_id) as faculty,
    COUNT(DISTINCT st.roll_no) as students
FROM schools s
LEFT JOIN departments d ON s.school_id = d.school_id
LEFT JOIN users u ON d.department_id = u.department_id
LEFT JOIN student st ON d.department_id = st.department_id
GROUP BY s.school_id;
```

### 2. Historical Leadership Tracking
```sql
-- Get HOD history for a department
SELECT 
    u.username,
    u.designation,
    h.start_date,
    h.end_date,
    DATEDIFF(COALESCE(h.end_date, CURDATE()), h.start_date) as days_served
FROM hod_assignments h
JOIN users u ON h.employee_id = u.employee_id
WHERE h.department_id = 1
ORDER BY h.start_date DESC;

-- Get all leadership roles for a person
SELECT 
    'HOD' as role,
    d.department_name as unit,
    h.start_date,
    h.end_date
FROM hod_assignments h
JOIN departments d ON h.department_id = d.department_id
WHERE h.employee_id = 101
UNION ALL
SELECT 
    'Dean' as role,
    s.school_name as unit,
    da.start_date,
    da.end_date
FROM dean_assignments da
JOIN schools s ON da.school_id = s.school_id
WHERE da.employee_id = 101
ORDER BY start_date DESC;
```

### 3. Semester-Wise Course Management
```sql
-- Get courses offered in a specific semester
SELECT 
    c.course_code,
    c.course_name,
    d.department_name,
    GROUP_CONCAT(u.username SEPARATOR ', ') as instructors
FROM courses c
JOIN departments d ON c.department_id = d.department_id
JOIN course_faculty_assignments cfa ON c.course_id = cfa.course_id
JOIN users u ON cfa.employee_id = u.employee_id
WHERE cfa.year = 2024 AND cfa.semester = 1 AND cfa.is_active = TRUE
GROUP BY c.course_id;

-- Get faculty workload
SELECT 
    u.username,
    u.designation,
    COUNT(DISTINCT cfa.course_id) as courses_teaching,
    SUM(c.credits) as total_credits
FROM users u
JOIN course_faculty_assignments cfa ON u.employee_id = cfa.employee_id
JOIN courses c ON cfa.course_id = c.course_id
WHERE cfa.year = 2024 AND cfa.semester = 1 AND cfa.is_active = TRUE
GROUP BY u.employee_id
ORDER BY total_credits DESC;

-- Get teaching history for a faculty
SELECT 
    cfa.year,
    cfa.semester,
    c.course_code,
    c.course_name,
    cfa.assignment_type
FROM course_faculty_assignments cfa
JOIN courses c ON cfa.course_id = c.course_id
WHERE cfa.employee_id = 101
ORDER BY cfa.year DESC, cfa.semester DESC;
```

### 4. Advanced Student Queries
```sql
-- Get students by batch
SELECT 
    batch_year,
    student_status,
    COUNT(*) as count
FROM student
GROUP BY batch_year, student_status;

-- Get active students in a department
SELECT * FROM student
WHERE department_id = 1 
  AND student_status = 'Active'
ORDER BY batch_year DESC, roll_no;

-- Get graduation candidates (4th year active students)
SELECT * FROM student
WHERE student_status = 'Active'
  AND batch_year = YEAR(CURDATE()) - 4;
```

### 5. Organizational Hierarchy
```sql
-- Complete organizational tree
SELECT 
    s.school_name,
    s.school_code,
    dean.username as dean_name,
    d.department_name,
    d.department_code,
    hod.username as hod_name
FROM schools s
LEFT JOIN dean_assignments da ON s.school_id = da.school_id AND da.is_current = TRUE
LEFT JOIN users dean ON da.employee_id = dean.employee_id
LEFT JOIN departments d ON s.school_id = d.school_id
LEFT JOIN hod_assignments ha ON d.department_id = ha.department_id AND ha.is_current = TRUE
LEFT JOIN users hod ON ha.employee_id = hod.employee_id
ORDER BY s.school_name, d.department_name;
```

---

## API Response Format Changes

### User Object
```javascript
// v2.x
{
  "employee_id": 101,
  "username": "Dr. John Doe",
  "email": "john.doe@university.edu",
  "role": "hod",
  "department_id": 1
}

// v3.0
{
  "employee_id": 101,
  "username": "Dr. John Doe",
  "email": "john.doe@university.edu",
  "role": "faculty",
  "designation": "Professor",
  "department_id": 1,
  "phone": "9876543210",
  
  // Additional fields from joins
  "is_hod": true,  // from hod_assignments
  "hod_of_department": "Computer Science",
  "is_dean": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Course Object
```javascript
// v2.x
{
  "id": 1,
  "course_code": "CS101",
  "name": "Programming Fundamentals",
  "credit": 4,
  "year": 2024,
  "semester": 1,
  "faculty_id": 101
}

// v3.0
{
  "course_id": 1,
  "course_code": "CS101",
  "course_name": "Programming Fundamentals",
  "credits": 4,
  "course_type": "Theory",
  "department_id": 1,
  "department_name": "Computer Science and Engineering",
  "school_name": "School of Engineering",
  
  // From course_faculty_assignments
  "current_semester": {
    "year": 2024,
    "semester": 1,
    "instructors": [
      {
        "employee_id": 101,
        "name": "Dr. John Doe",
        "assignment_type": "Primary"
      }
    ]
  }
}
```

### Student Object
```javascript
// v2.x
{
  "rollno": "CS2024001",
  "name": "Rahul Sharma",
  "dept": 1
}

// v3.0
{
  "roll_no": "CS2024001",
  "student_name": "Rahul Sharma",
  "department_id": 1,
  "department_name": "Computer Science and Engineering",
  "batch_year": 2024,
  "student_status": "Active",
  "email": "rahul.sharma@student.edu",
  "phone": "8765432101",
  "created_at": "2024-06-15T10:00:00Z"
}
```

---

## Authorization Logic Changes

### v2.x Authorization
```javascript
function canEditCourse(user, courseId) {
  if (user.role === 'admin') return true;
  if (user.role === 'hod' && course.dept_id === user.department_id) return true;
  if (user.role === 'faculty' && course.faculty_id === user.employee_id) return true;
  return false;
}
```

### v3.0 Authorization
```javascript
async function canEditCourse(user, courseId) {
  // Admin always has access
  if (user.role === 'admin') return true;
  
  // Check if HOD of the course's department
  const isHOD = await db.query(`
    SELECT 1 FROM hod_assignments h
    JOIN courses c ON h.department_id = c.department_id
    WHERE h.employee_id = ? AND c.course_id = ? AND h.is_current = TRUE
  `, [user.employee_id, courseId]);
  if (isHOD.length > 0) return true;
  
  // Check if assigned as faculty for current semester
  const isFaculty = await db.query(`
    SELECT 1 FROM course_faculty_assignments
    WHERE employee_id = ? AND course_id = ? AND is_active = TRUE
  `, [user.employee_id, courseId]);
  if (isFaculty.length > 0) return true;
  
  return false;
}
```

---

## Benefits of v3.0

### 1. **Flexibility**
- HOD and Dean can be any faculty member
- Easy to change leadership without modifying user roles
- Support for multiple schools and complex organizational structures

### 2. **Historical Tracking**
- Complete audit trail of leadership changes
- Can generate reports on tenure periods
- Useful for accreditation documentation

### 3. **Better Data Organization**
- Clear separation of courses and course offerings
- Proper handling of semester-wise assignments
- Support for team teaching (multiple instructors)

### 4. **Scalability**
- Supports institutional growth (new schools/departments)
- Handles complex reporting requirements
- Better performance with proper indexing

### 5. **Compliance**
- NBA accreditation requirements met
- Proper designation tracking
- Complete course history maintenance

---

## Migration Effort

| Component | Effort | Complexity |
|-----------|--------|------------|
| Database Schema | 30-60 min | Medium |
| API Endpoints | 2-4 hours | Medium |
| Frontend Updates | 4-8 hours | Low-Medium |
| Testing | 4-8 hours | Medium |
| Deployment | 1-2 hours | Low |
| **Total** | **1-2 days** | **Medium** |

---

## Backward Compatibility Notes

### Breaking Changes
1. User roles 'hod' and 'dean' no longer exist
2. Course table renamed to courses with structure changes
3. Student table renamed to students with new fields
4. Enrollment requires year/semester
5. Column name changes (id → course_id, rollno → roll_no, etc.)

### Non-Breaking Changes
1. All existing data is preserved
2. Same database engine (MySQL/MariaDB)
3. Same character set (utf8mb4)
4. Foreign key relationships maintained
5. Existing queries can be adapted with minimal changes

---

## Recommended Update Order

1. **Database** (Day 1 Morning)
   - Backup
   - Run migration scripts
   - Verify data integrity

2. **Backend API** (Day 1 Afternoon)
   - Update queries
   - Modify authorization logic
   - Test endpoints

3. **Frontend** (Day 2 Morning)
   - Update API calls
   - Modify UI for new features
   - Test workflows

4. **Testing** (Day 2 Afternoon)
   - Integration testing
   - User acceptance testing
   - Performance testing

5. **Deployment** (Day 2 Evening)
   - Deploy to production
   - Monitor for issues
   - Gather user feedback

---

## Support and Resources

- **Schema Documentation**: `UPGRADED_DATABASE_SCHEMA.md`
- **SQL Script**: `upgraded_schema_v3.sql`
- **Migration Guide**: `MIGRATION_GUIDE_v3.md`
- **This Guide**: `v2_vs_v3_COMPARISON.md`

---

## Quick Decision Guide

**Should I upgrade to v3.0?**

✅ **Yes, if you:**
- Need multi-school support
- Want historical leadership tracking
- Need flexible role assignments
- Want better course management
- Are planning for institutional growth

⚠️ **Wait, if you:**
- Have ongoing critical operations
- Cannot afford 1-2 days downtime
- Don't have proper backups
- Haven't tested migration in dev environment

**Recommendation**: Test migration in a development/staging environment first, then plan production upgrade during a maintenance window.

---

**Version**: 3.0  
**Last Updated**: February 2026  
**Status**: Production Ready
