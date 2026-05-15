<?php

class StudentRepository
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function findByRollno($rollno)
    {
        $stmt = $this->db->prepare("
            SELECT s.*, p.department_id AS dept_id
            FROM students s
            LEFT JOIN programmes p ON s.programme_id = p.programme_id
            WHERE s.roll_no = ?
        ");
        $stmt->execute([$rollno]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return new Student(
                $row['roll_no'],
                $row['student_name'],
                $row['programme_id'],
                $row['batch_year'] ?? null,
                $row['student_status'] ?? 'Active',
                $row['email'] ?? null,
                $row['phone'] ?? null,
                $row['dept_id'] ?? null
            );
        }
        return null;
    }

    public function findByDepartment($deptId)
    {
        $stmt = $this->db->prepare("
            SELECT s.*, p.department_id AS dept_id
            FROM students s
            JOIN programmes p ON s.programme_id = p.programme_id
            WHERE p.department_id = ?
            ORDER BY s.roll_no
        ");
        $stmt->execute([$deptId]);

        $students = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $students[] = new Student(
                $row['roll_no'],
                $row['student_name'],
                $row['programme_id'],
                $row['batch_year'] ?? null,
                $row['student_status'] ?? 'Active',
                $row['email'] ?? null,
                $row['phone'] ?? null,
                $row['dept_id'] ?? null
            );
        }
        return $students;
    }

    public function findBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*, p.department_id AS dept_id
                FROM students s
                JOIN programmes p ON s.programme_id = p.programme_id
                JOIN departments d ON p.department_id = d.department_id
                WHERE d.school_id = ?
                ORDER BY s.roll_no
            ");
            $stmt->execute([$schoolId]);
            $students = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $students[] = new Student(
                    $row['roll_no'],
                    $row['student_name'],
                    $row['programme_id'],
                    $row['batch_year'] ?? null,
                    $row['student_status'] ?? 'Active',
                    $row['email'] ?? null,
                    $row['phone'] ?? null,
                    $row['dept_id'] ?? null
                );
            }
            return $students;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    public function countBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*)
                FROM students s
                JOIN programmes p ON s.programme_id = p.programme_id
                JOIN departments d ON p.department_id = d.department_id
                WHERE d.school_id = ?
            ");
            $stmt->execute([$schoolId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    public function save(Student $student)
    {
        $stmt = $this->db->prepare(
            "INSERT INTO students (roll_no, student_name, programme_id, batch_year, student_status, email, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        return $stmt->execute([
            $student->getRollNo(),
            $student->getStudentName(),
            $student->getProgrammeId(),
            $student->getBatchYear(),
            $student->getStudentStatus(),
            $student->getEmail(),
            $student->getPhone()
        ]);
    }

    public function update(Student $student)
    {
        $stmt = $this->db->prepare(
            "UPDATE students SET student_name = ?, programme_id = ?, batch_year = ?,
             student_status = ?, email = ?, phone = ? WHERE roll_no = ?"
        );
        return $stmt->execute([
            $student->getStudentName(),
            $student->getProgrammeId(),
            $student->getBatchYear(),
            $student->getStudentStatus(),
            $student->getEmail(),
            $student->getPhone(),
            $student->getRollNo()
        ]);
    }

    public function exists($rollno)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM students WHERE roll_no = ?");
        $stmt->execute([$rollno]);
        return $stmt->fetchColumn() > 0;
    }

    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*, p.programme_name, p.programme_code, p.department_id AS dept_id,
                       d.department_name, d.department_code
                FROM students s
                LEFT JOIN programmes p ON s.programme_id = p.programme_id
                LEFT JOIN departments d ON p.department_id = d.department_id
                ORDER BY s.roll_no
            ");
            $stmt->execute();

            $students = [];
            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $students[] = [
                    'roll_no' => $data['roll_no'],
                    'student_name' => $data['student_name'],
                    'programme_id' => $data['programme_id'],
                    'batch_year' => $data['batch_year'],
                    'student_status' => $data['student_status'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'programme_name' => $data['programme_name'],
                    'programme_code' => $data['programme_code'],
                    'department_id' => $data['dept_id'],
                    'department_name' => $data['department_name'],
                    'department_code' => $data['department_code']
                ];
            }

            return $students;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

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

    public function findPaginated(array $params): array
    {
        try {
            $sql = "
                SELECT s.roll_no, s.student_name, s.programme_id,
                       s.batch_year, s.student_status, s.email, s.phone,
                       p.programme_name, p.programme_code,
                       d.department_name, d.department_code, d.department_id AS dept_id,
                       (
                           SELECT GROUP_CONCAT(DISTINCT CONCAT(c.course_code, ': ', c.course_name, ' (', co.year, '/', co.semester, ')') ORDER BY c.course_code SEPARATOR ', ')
                           FROM enrollments e
                           JOIN course_offerings co ON e.offering_id = co.offering_id
                           JOIN courses c ON co.course_id = c.course_id
                           WHERE e.student_rollno = s.roll_no
                       ) AS enrolled_courses
                FROM students s
                LEFT JOIN programmes p ON s.programme_id = p.programme_id
                LEFT JOIN departments d ON p.department_id = d.department_id
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
            if (!empty($params['filters']['programme_id'])) {
                $sql .= " AND s.programme_id = ?";
                $bindings[] = (int)$params['filters']['programme_id'];
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND p.department_id = ?";
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
            if (!empty($params['filters']['course_code'])) {
                $sql .= " AND EXISTS (SELECT 1 FROM enrollments e JOIN course_offerings co ON e.offering_id = co.offering_id JOIN courses c ON co.course_id = c.course_id WHERE e.student_rollno = s.roll_no AND c.course_code = ?)";
                $bindings[] = $params['filters']['course_code'];
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
            if (!empty($params['filters']['programme_id'])) {
                $sql .= " AND s.programme_id = ?";
                $bindings[] = (int)$params['filters']['programme_id'];
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND s.programme_id IN (SELECT programme_id FROM programmes WHERE department_id = ?)";
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
            if (!empty($params['filters']['course_code'])) {
                $sql .= " AND EXISTS (SELECT 1 FROM enrollments e JOIN course_offerings co ON e.offering_id = co.offering_id JOIN courses c ON co.course_id = c.course_id WHERE e.student_rollno = s.roll_no AND c.course_code = ?)";
                $bindings[] = $params['filters']['course_code'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    public function findBySchoolPaginated(int $schoolId, array $params): array
    {
        try {
            $sql = "
                SELECT s.roll_no, s.student_name, s.programme_id,
                       s.batch_year, s.student_status, s.email, s.phone,
                       p.programme_name, p.programme_code,
                       d.department_name, d.department_code, d.department_id AS dept_id,
                       (
                           SELECT GROUP_CONCAT(DISTINCT CONCAT(c.course_code, ': ', c.course_name, ' (', co.year, '/', co.semester, ')') ORDER BY c.course_code SEPARATOR ', ')
                           FROM enrollments e
                           JOIN course_offerings co ON e.offering_id = co.offering_id
                           JOIN courses c ON co.course_id = c.course_id
                           WHERE e.student_rollno = s.roll_no
                       ) AS enrolled_courses
                FROM students s
                JOIN programmes p ON s.programme_id = p.programme_id
                JOIN departments d ON p.department_id = d.department_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (s.roll_no LIKE ? OR s.student_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['programme_id'])) {
                $sql .= " AND s.programme_id = ?";
                $bindings[] = (int)$params['filters']['programme_id'];
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND p.department_id = ?";
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
            if (!empty($params['filters']['course_code'])) {
                $sql .= " AND EXISTS (SELECT 1 FROM enrollments e JOIN course_offerings co ON e.offering_id = co.offering_id JOIN courses c ON co.course_id = c.course_id WHERE e.student_rollno = s.roll_no AND c.course_code = ?)";
                $bindings[] = $params['filters']['course_code'];
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

    public function countBySchoolPaginated(int $schoolId, array $params): int
    {
        try {
            $sql = "
                SELECT COUNT(*)
                FROM students s
                JOIN programmes p ON s.programme_id = p.programme_id
                JOIN departments d ON p.department_id = d.department_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (s.roll_no LIKE ? OR s.student_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['programme_id'])) {
                $sql .= " AND s.programme_id = ?";
                $bindings[] = (int)$params['filters']['programme_id'];
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND p.department_id = ?";
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
            if (!empty($params['filters']['course_code'])) {
                $sql .= " AND EXISTS (SELECT 1 FROM enrollments e JOIN course_offerings co ON e.offering_id = co.offering_id JOIN courses c ON co.course_id = c.course_id WHERE e.student_rollno = s.roll_no AND c.course_code = ?)";
                $bindings[] = $params['filters']['course_code'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    public function findByDepartmentPaginated(int $departmentId, array $params): array
    {
        try {
            $sql = "
                SELECT s.roll_no, s.student_name, s.programme_id,
                       s.batch_year, s.student_status, s.email, s.phone,
                       p.programme_name, p.programme_code,
                       d.department_name, d.department_code,
                       (
                           SELECT GROUP_CONCAT(DISTINCT CONCAT(c.course_code, ': ', c.course_name, ' (', co.year, '/', co.semester, ')') ORDER BY c.course_code SEPARATOR ', ')
                           FROM enrollments e
                           JOIN course_offerings co ON e.offering_id = co.offering_id
                           JOIN courses c ON co.course_id = c.course_id
                           WHERE e.student_rollno = s.roll_no
                       ) AS enrolled_courses
                FROM students s
                JOIN programmes p ON s.programme_id = p.programme_id
                JOIN departments d ON p.department_id = d.department_id
                WHERE p.department_id = ?
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
            if (!empty($params['filters']['course_code'])) {
                $sql .= " AND EXISTS (SELECT 1 FROM enrollments e JOIN course_offerings co ON e.offering_id = co.offering_id JOIN courses c ON co.course_id = c.course_id WHERE e.student_rollno = s.roll_no AND c.course_code = ?)";
                $bindings[] = $params['filters']['course_code'];
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

    public function countByDepartmentPaginated(int $departmentId, array $params): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM students s WHERE s.programme_id IN (SELECT programme_id FROM programmes WHERE department_id = ?)";
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
            if (!empty($params['filters']['course_code'])) {
                $sql .= " AND EXISTS (SELECT 1 FROM enrollments e JOIN course_offerings co ON e.offering_id = co.offering_id JOIN courses c ON co.course_id = c.course_id WHERE e.student_rollno = s.roll_no AND c.course_code = ?)";
                $bindings[] = $params['filters']['course_code'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    public function findFirstProgrammeIdByDepartment(int $departmentId): ?int
    {
        $stmt = $this->db->prepare("SELECT programme_id FROM programmes WHERE department_id = ? ORDER BY programme_id LIMIT 1");
        $stmt->execute([$departmentId]);
        $value = $stmt->fetchColumn();
        return $value !== false ? (int)$value : null;
    }
}
