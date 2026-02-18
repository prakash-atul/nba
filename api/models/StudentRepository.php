<?php

/**
 * StudentRepository
 * Handles database operations for Student
 */
class StudentRepository
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Find student by roll number
     */
    public function findByRollno($rollno)
    {
        $stmt = $this->db->prepare("SELECT * FROM students WHERE roll_no = ?");
        $stmt->execute([$rollno]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return new Student(
                $row['roll_no'], 
                $row['student_name'], 
                $row['department_id'],
                $row['batch_year'] ?? null,
                $row['student_status'] ?? 'Active',
                $row['email'] ?? null,
                $row['phone'] ?? null
            );
        }
        return null;
    }

    /**
     * Find students by department
     */
    public function findByDepartment($deptId)
    {
        $stmt = $this->db->prepare("SELECT * FROM students WHERE department_id = ? ORDER BY roll_no");
        $stmt->execute([$deptId]);

        $students = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $students[] = new Student(
                $row['roll_no'], 
                $row['student_name'], 
                $row['department_id'],
                $row['batch_year'] ?? null,
                $row['student_status'] ?? 'Active',
                $row['email'] ?? null,
                $row['phone'] ?? null
            );
        }
        return $students;
    }

    /**
     * Find students by school ID
     * @param int $schoolId
     * @return array
     */
    public function findBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.* 
                FROM students s
                JOIN departments d ON s.department_id = d.department_id
                WHERE d.school_id = ?
                ORDER BY s.roll_no
            ");
            $stmt->execute([$schoolId]);
            $students = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $students[] = new Student(
                    $row['roll_no'], 
                    $row['student_name'], 
                    $row['department_id'],
                    $row['batch_year'] ?? null,
                    $row['student_status'] ?? 'Active',
                    $row['email'] ?? null,
                    $row['phone'] ?? null
                );
            }
            return $students;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count students by school ID
     * @param int $schoolId
     * @return int
     */
    public function countBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM students s
                JOIN departments d ON s.department_id = d.department_id
                WHERE d.school_id = ?
            ");
            $stmt->execute([$schoolId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Create a new student
     */
    public function save(Student $student)
    {
        $stmt = $this->db->prepare(
            "INSERT INTO students (roll_no, student_name, department_id, batch_year, student_status, email, phone) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        return $stmt->execute([
            $student->getRollNo(),
            $student->getStudentName(),
            $student->getDepartmentId(),
            $student->getBatchYear(),
            $student->getStudentStatus(),
            $student->getEmail(),
            $student->getPhone()
        ]);
    }

    /**
     * Update student
     */
    public function update(Student $student)
    {
        $stmt = $this->db->prepare(
            "UPDATE students SET student_name = ?, department_id = ?, batch_year = ?, 
             student_status = ?, email = ?, phone = ? WHERE roll_no = ?"
        );
        return $stmt->execute([
            $student->getStudentName(),
            $student->getDepartmentId(),
            $student->getBatchYear(),
            $student->getStudentStatus(),
            $student->getEmail(),
            $student->getPhone(),
            $student->getRollNo()
        ]);
    }

    /**
     * Check if student exists
     */
    public function exists($rollno)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM students WHERE roll_no = ?");
        $stmt->execute([$rollno]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Get all students with department info
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*, d.department_name, d.department_code 
                FROM students s 
                LEFT JOIN departments d ON s.department_id = d.department_id 
                ORDER BY s.roll_no
            ");
            $stmt->execute();
            $students = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $students[] = [
                    'roll_no' => $data['roll_no'],
                    'student_name' => $data['student_name'],
                    'department_id' => $data['department_id'],
                    'batch_year' => $data['batch_year'],
                    'student_status' => $data['student_status'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'department_name' => $data['department_name'],
                    'department_code' => $data['department_code']
                ];
            }

            return $students;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count all students
     * @return int
     */
    public function countAll(): int
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM students");
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated list of students (admin view).
     * Cursor is on roll_no (VARCHAR) — string keyset.
     *
     * @param array $params Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findPaginated(array $params): array
    {
        try {
            $sql = "
                SELECT s.roll_no, s.student_name, s.department_id,
                       s.batch_year, s.student_status, s.email, s.phone,
                       d.department_name, d.department_code
                FROM students s
                LEFT JOIN departments d ON s.department_id = d.department_id
                WHERE 1=1
            ";
            $bindings = [];

            if ($params['search']) {
                $sql .= " AND (s.roll_no LIKE ? OR s.student_name LIKE ? OR s.email LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND s.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }
            if (!empty($params['filters']['batch_year'])) {
                $sql .= " AND s.batch_year = ?";
                $bindings[] = (int)$params['filters']['batch_year'];
            }
            if (!empty($params['filters']['student_status'])) {
                $sql .= " AND s.student_status = ?";
                $bindings[] = $params['filters']['student_status'];
            }

            // String PK cursor (roll_no)
            PaginationHelper::applyCursor($sql, $bindings, 's.roll_no', $params['cursor'], $params['sortDir'], true);

            $limit = (int)$params['limit'] + 1;
            $sql .= " ORDER BY {$params['sort']} {$params['sortDir']} LIMIT {$limit}";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count students matching pagination filters.
     */
    public function countPaginated(array $params): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM students s WHERE 1=1";
            $bindings = [];

            if ($params['search']) {
                $sql .= " AND (s.roll_no LIKE ? OR s.student_name LIKE ? OR s.email LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND s.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }
            if (!empty($params['filters']['batch_year'])) {
                $sql .= " AND s.batch_year = ?";
                $bindings[] = (int)$params['filters']['batch_year'];
            }
            if (!empty($params['filters']['student_status'])) {
                $sql .= " AND s.student_status = ?";
                $bindings[] = $params['filters']['student_status'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated students scoped to a school (dean view).
     */
    public function findBySchoolPaginated(int $schoolId, array $params): array
    {
        try {
            $sql = "
                SELECT s.roll_no, s.student_name, s.department_id,
                       s.batch_year, s.student_status, s.email, s.phone,
                       d.department_name, d.department_code
                FROM students s
                JOIN departments d ON s.department_id = d.department_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (s.roll_no LIKE ? OR s.student_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND s.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }
            if (!empty($params['filters']['batch_year'])) {
                $sql .= " AND s.batch_year = ?";
                $bindings[] = (int)$params['filters']['batch_year'];
            }

            PaginationHelper::applyCursor($sql, $bindings, 's.roll_no', $params['cursor'], $params['sortDir'], true);

            $limit = (int)$params['limit'] + 1;
            $sql .= " ORDER BY {$params['sort']} {$params['sortDir']} LIMIT {$limit}";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count students in a school matching filters.
     */
    public function countBySchoolPaginated(int $schoolId, array $params): int
    {
        try {
            $sql = "
                SELECT COUNT(*)
                FROM students s
                JOIN departments d ON s.department_id = d.department_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (s.roll_no LIKE ? OR s.student_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND s.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated students scoped to a department (HOD / Staff view).
     *
     * @param int   $departmentId
     * @param array $params Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findByDepartmentPaginated(int $departmentId, array $params): array
    {
        try {
            $sql = "
                SELECT s.roll_no, s.student_name, s.department_id,
                       s.batch_year, s.student_status, s.email, s.phone
                FROM students s
                WHERE s.department_id = ?
            ";
            $bindings = [$departmentId];

            if ($params['search']) {
                $sql .= " AND (s.roll_no LIKE ? OR s.student_name LIKE ? OR s.email LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['batch_year'])) {
                $sql .= " AND s.batch_year = ?";
                $bindings[] = (int)$params['filters']['batch_year'];
            }
            if (!empty($params['filters']['student_status'])) {
                $sql .= " AND s.student_status = ?";
                $bindings[] = $params['filters']['student_status'];
            }

            PaginationHelper::applyCursor($sql, $bindings, 's.roll_no', $params['cursor'], $params['sortDir'], true);

            $limit = (int)$params['limit'] + 1;
            $sql .= " ORDER BY {$params['sort']} {$params['sortDir']} LIMIT {$limit}";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count students in a department matching filters.
     */
    public function countByDepartmentPaginated(int $departmentId, array $params): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM students s WHERE s.department_id = ?";
            $bindings = [$departmentId];

            if ($params['search']) {
                $sql .= " AND (s.roll_no LIKE ? OR s.student_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['batch_year'])) {
                $sql .= " AND s.batch_year = ?";
                $bindings[] = (int)$params['filters']['batch_year'];
            }
            if (!empty($params['filters']['student_status'])) {
                $sql .= " AND s.student_status = ?";
                $bindings[] = $params['filters']['student_status'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
