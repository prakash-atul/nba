<?php

/**
 * Department Repository Class
 * Follows Single Responsibility Principle - handles only database operations for departments
 * Follows Dependency Inversion Principle - depends on abstractions
 */
class DepartmentRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    public function getConnection()
    {
        return $this->db;
    }

    /**
     * Find department by ID
     * @param int $departmentId
     * @return Department|null
     */
    public function findById($departmentId)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM departments WHERE department_id = ?");
            $stmt->execute([$departmentId]);
            $deptData = $stmt->fetch();

            if ($deptData) {
                return new Department(
                    $deptData['department_id'],
                    $deptData['department_name'],
                    $deptData['department_code'],
                    $deptData['school_id'] ?? null,
                    $deptData['description'] ?? null,
                    $deptData['created_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find department by code
     * @param string $departmentCode
     * @return Department|null
     */
    public function findByCode($departmentCode)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM departments WHERE department_code = ?");
            $stmt->execute([strtoupper($departmentCode)]);
            $deptData = $stmt->fetch();

            if ($deptData) {
                return new Department(
                    $deptData['department_id'],
                    $deptData['department_name'],
                    $deptData['department_code'],
                    $deptData['school_id'] ?? null,
                    $deptData['description'] ?? null,
                    $deptData['created_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all departments
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT d.*, s.school_name, s.school_code 
                FROM departments d 
                LEFT JOIN schools s ON d.school_id = s.school_id 
                ORDER BY d.department_name
            ");
            $stmt->execute();
            $departments = [];

            while ($deptData = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $departments[] = [
                    'department_id' => $deptData['department_id'],
                    'department_name' => $deptData['department_name'],
                    'department_code' => $deptData['department_code'],
                    'school_id' => $deptData['school_id'],
                    'school_name' => $deptData['school_name'] ?? null,
                    'school_code' => $deptData['school_code'] ?? null,
                    'description' => $deptData['description'],
                    'created_at' => $deptData['created_at']
                ];
            }

            return $departments;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find departments by school ID
     * @param int $schoolId
     * @return array
     */
    public function findBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT d.*, s.school_name, s.school_code 
                FROM departments d 
                LEFT JOIN schools s ON d.school_id = s.school_id 
                WHERE d.school_id = ?
                ORDER BY d.department_name
            ");
            $stmt->execute([$schoolId]);
            $departments = [];

            while ($deptData = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $departments[] = [
                    'department_id' => $deptData['department_id'],
                    'department_name' => $deptData['department_name'],
                    'department_code' => $deptData['department_code'],
                    'school_id' => $deptData['school_id'],
                    'school_name' => $deptData['school_name'] ?? null,
                    'school_code' => $deptData['school_code'] ?? null,
                    'description' => $deptData['description'],
                    'created_at' => $deptData['created_at']
                ];
            }

            return $departments;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count departments by school ID
     * @param int $schoolId
     * @return int
     */
    public function countBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM departments WHERE school_id = ?");
            $stmt->execute([$schoolId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Save department to database
     * @param Department $department
     * @return bool
     */
    public function save(Department $department)
    {
        try {
            if ($department->getDepartmentId()) {
                // Update existing department
                $stmt = $this->db->prepare("UPDATE departments SET department_name = ?, department_code = ?, school_id = ?, description = ? WHERE department_id = ?");
                return $stmt->execute([
                    $department->getDepartmentName(),
                    $department->getDepartmentCode(),
                    $department->getSchoolId(),
                    $department->getDescription(),
                    $department->getDepartmentId()
                ]);
            } else {
                // Insert new department
                $stmt = $this->db->prepare("INSERT INTO departments (department_name, department_code, school_id, description) VALUES (?, ?, ?, ?)");
                $result = $stmt->execute([
                    $department->getDepartmentName(),
                    $department->getDepartmentCode(),
                    $department->getSchoolId(),
                    $department->getDescription()
                ]);

                if ($result) {
                    $department->setDepartmentId($this->db->lastInsertId());
                }

                return $result;
            }
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete department by ID
     * @param int $departmentId
     * @return bool
     */
    public function delete($departmentId)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM departments WHERE department_id = ?");
            return $stmt->execute([$departmentId]);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if department code exists
     * @param string $departmentCode
     * @param int|null $excludeDepartmentId
     * @return bool
     */
    public function codeExists($departmentCode, $excludeDepartmentId = null)
    {
        try {
            $sql = "SELECT COUNT(*) FROM departments WHERE department_code = ?";
            $params = [strtoupper($departmentCode)];

            if ($excludeDepartmentId) {
                $sql .= " AND department_id != ?";
                $params[] = $excludeDepartmentId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if department name exists
     * @param string $departmentName
     * @param int|null $excludeDepartmentId
     * @return bool
     */
    public function nameExists($departmentName, $excludeDepartmentId = null)
    {
        try {
            $sql = "SELECT COUNT(*) FROM departments WHERE department_name = ?";
            $params = [$departmentName];

            if ($excludeDepartmentId) {
                $sql .= " AND department_id != ?";
                $params[] = $excludeDepartmentId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find all departments with enriched data (HOD, counts, latest offering)
     * @return array
     */
    public function findAllEnriched()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    d.department_id,
                    d.department_name,
                    d.department_code,
                    d.school_id,
                    d.description,
                    d.created_at,
                    s.school_name,
                    s.school_code,
                    hod.employee_id AS hod_employee_id,
                    hod.username AS hod_name,
                    (SELECT COUNT(*) FROM users WHERE department_id = d.department_id AND role = 'faculty') AS faculty_count,
                    (SELECT COUNT(*) FROM students WHERE department_id = d.department_id) AS student_count,
                    (SELECT COUNT(*) FROM courses WHERE department_id = d.department_id) AS course_count,
                    (SELECT COUNT(*) 
                     FROM course_offerings co 
                     JOIN courses c ON co.course_id = c.course_id 
                     WHERE c.department_id = d.department_id 
                     AND co.year >= YEAR(CURDATE()) - 1) AS active_offerings_count,
                    (SELECT CONCAT(co.year, '-', co.semester) 
                     FROM course_offerings co 
                     JOIN courses c ON co.course_id = c.course_id 
                     WHERE c.department_id = d.department_id 
                     ORDER BY co.year DESC, co.semester DESC 
                     LIMIT 1) AS latest_offering
                FROM departments d
                LEFT JOIN schools s ON d.school_id = s.school_id
                LEFT JOIN hod_assignments ha ON d.department_id = ha.department_id AND ha.end_date IS NULL
                LEFT JOIN users hod ON ha.employee_id = hod.employee_id
                ORDER BY d.department_name
            ");
            $stmt->execute();
            $departments = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $departments[] = [
                    'department_id' => (int)$row['department_id'],
                    'department_name' => $row['department_name'],
                    'department_code' => $row['department_code'],
                    'school_id' => $row['school_id'] ? (int)$row['school_id'] : null,
                    'school_name' => $row['school_name'],
                    'school_code' => $row['school_code'],
                    'description' => $row['description'],
                    'created_at' => $row['created_at'],
                    'hod_employee_id' => $row['hod_employee_id'] ? (int)$row['hod_employee_id'] : null,
                    'hod_name' => $row['hod_name'],
                    'faculty_count' => (int)$row['faculty_count'],
                    'student_count' => (int)$row['student_count'],
                    'course_count' => (int)$row['course_count'],
                    'active_offerings_count' => (int)$row['active_offerings_count'],
                    'latest_offering' => $row['latest_offering']
                ];
            }

            return $departments;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count all departments
     * @return int
     */
    public function countAll()
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM departments");
            $stmt->execute();
            return (int) $stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated list of enriched departments (admin view).
     * Uses `department_stats` materialized table for fast counts.
     * Cursor is on department_id (INT).
     *
     * @param array $params Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findEnrichedPaginated(array $params): array
    {
        try {
            $sql = "
                SELECT
                    d.department_id,
                    d.department_name,
                    d.department_code,
                    d.school_id,
                    d.description,
                    d.created_at,
                    s.school_name,
                    s.school_code,
                    hod.employee_id AS hod_employee_id,
                    hod.username   AS hod_name,
                    COALESCE(ds.faculty_count, 0)           AS faculty_count,
                    COALESCE(ds.student_count, 0)           AS student_count,
                    COALESCE(ds.course_count, 0)            AS course_count,
                    COALESCE(ds.active_offerings_count, 0)  AS active_offerings_count
                FROM departments d
                LEFT JOIN schools s ON d.school_id = s.school_id
                LEFT JOIN hod_assignments ha ON d.department_id = ha.department_id AND ha.end_date IS NULL
                LEFT JOIN users hod ON ha.employee_id = hod.employee_id
                LEFT JOIN department_stats ds ON d.department_id = ds.department_id
                WHERE 1=1
            ";
            $bindings = [];

            if ($params['search']) {
                $sql .= " AND (d.department_name LIKE ? OR d.department_code LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['school_id'])) {
                $sql .= " AND d.school_id = ?";
                $bindings[] = (int)$params['filters']['school_id'];
            }

            PaginationHelper::applyCursor($sql, $bindings, 'd.department_id', $params['cursor'], $params['sortDir']);

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
     * Count enriched departments matching filters.
     */
    public function countEnrichedPaginated(array $params): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM departments d WHERE 1=1";
            $bindings = [];

            if ($params['search']) {
                $sql .= " AND (d.department_name LIKE ? OR d.department_code LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['school_id'])) {
                $sql .= " AND d.school_id = ?";
                $bindings[] = (int)$params['filters']['school_id'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated departments scoped to a school (dean view).
     */
    public function findBySchoolPaginated(int $schoolId, array $params): array
    {
        try {
            $sql = "
                SELECT
                    d.department_id,
                    d.department_name,
                    d.department_code,
                    d.school_id,
                    d.description,
                    d.created_at,
                    hod.employee_id AS hod_employee_id,
                    hod.username   AS hod_name,
                    (SELECT COUNT(*) FROM users u_fac WHERE u_fac.department_id = d.department_id AND u_fac.role = 'faculty') AS faculty_count,
                    (SELECT COUNT(*) FROM users u_staff WHERE u_staff.department_id = d.department_id AND u_staff.role = 'staff') AS staff_count,
                    (SELECT COUNT(*) FROM students s WHERE s.department_id = d.department_id AND s.student_status = 'Active') AS student_count,
                    (SELECT COUNT(*) FROM courses c WHERE c.department_id = d.department_id) AS course_count
                FROM departments d
                LEFT JOIN hod_assignments ha ON d.department_id = ha.department_id AND ha.end_date IS NULL
                LEFT JOIN users hod ON ha.employee_id = hod.employee_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (d.department_name LIKE ? OR d.department_code LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }

            // Filter by HOD Status
            if (isset($params['filters']['hod_status'])) {
                if ($params['filters']['hod_status'] === 'assigned') {
                    $sql .= " AND hod.employee_id IS NOT NULL";
                } elseif ($params['filters']['hod_status'] === 'unassigned') {
                    $sql .= " AND hod.employee_id IS NULL";
                }
            }

            PaginationHelper::applyCursor($sql, $bindings, 'd.department_id', $params['cursor'], $params['sortDir']);

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
     * Count departments in a school matching filters.
     */
    public function countBySchoolPaginated(int $schoolId, array $params): int
    {
        try {
            $sql = "
                SELECT COUNT(*) 
                FROM departments d 
                LEFT JOIN hod_assignments ha ON d.department_id = ha.department_id AND ha.end_date IS NULL
                LEFT JOIN users hod ON ha.employee_id = hod.employee_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (d.department_name LIKE ? OR d.department_code LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }

            // Filter by HOD Status
            if (isset($params['filters']['hod_status'])) {
                if ($params['filters']['hod_status'] === 'assigned') {
                    $sql .= " AND hod.employee_id IS NOT NULL";
                } elseif ($params['filters']['hod_status'] === 'unassigned') {
                    $sql .= " AND hod.employee_id IS NULL";
                }
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
