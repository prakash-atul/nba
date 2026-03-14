<?php

/**
 * Course Repository Class
 * Handles database operations for courses
 */
class CourseRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Find course by ID
     */
    public function findById($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM courses WHERE course_id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch();

            if ($data) {
                return new Course(
                    $data['course_id'],
                    $data['course_code'],
                    $data['course_name'],
                    $data['credit'],
                    $data['department_id'] ?? null,
                    $data['course_type'] ?? 'Theory',
                    $data['course_level'] ?? 'Undergraduate',
                    $data['is_active'] ?? 1,
                    $data['created_at'] ?? null,
                    $data['updated_at'] ?? null
                );
            }
            return null;
        } catch (Exception $e) {
            throw new Exception("Database error in findById: " . $e->getMessage());
        }
    }

    /**
     * Find course by ID with faculty info (compatibility method)
     */
    public function findByIdWithFaculty($id)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, u.username as faculty_name
                FROM courses c
                LEFT JOIN course_offerings co ON c.course_id = co.course_id
                LEFT JOIN course_faculty_assignments cfa ON co.offering_id = cfa.offering_id
                LEFT JOIN users u ON cfa.employee_id = u.employee_id
                WHERE c.course_id = ?
                ORDER BY co.year DESC, co.semester DESC
                LIMIT 1
            ");
            $stmt->execute([$id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }



    /**
     * Find courses by School ID
     * @param int $schoolId
     * @return array
     */
    public function findBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, d.department_code, d.department_name
                FROM courses c
                JOIN departments d ON c.department_id = d.department_id
                WHERE d.school_id = ?
                ORDER BY c.course_code
            ");
            $stmt->execute([$schoolId]);
            $courses = [];

            while ($data = $stmt->fetch()) {
                $courses[] = new Course(
                    $data['course_id'],
                    $data['course_code'],
                    $data['course_name'],
                    $data['credit'],
                    $data['department_id'] ?? null,
                    $data['course_type'] ?? 'Theory',
                    $data['course_level'] ?? 'Undergraduate',
                    $data['is_active'] ?? 1,
                    $data['created_at'] ?? null,
                    $data['updated_at'] ?? null
                );
            }

            return $courses;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count courses by school ID
     * @param int $schoolId
     * @return int
     */
    public function countBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM courses c
                JOIN departments d ON c.department_id = d.department_id
                WHERE d.school_id = ?
            ");
            $stmt->execute([$schoolId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }



    /**
     * Save course
     */
    public function save(Course $course)
    {
        try {
            if ($course->getCourseId()) {
                // Update existing course
                $stmt = $this->db->prepare("UPDATE courses SET course_code = ?, course_name = ?, credit = ?, department_id = ?, course_type = ?, course_level = ?, is_active = ? WHERE course_id = ?");
                return $stmt->execute([
                    $course->getCourseCode(),
                    $course->getCourseName(),
                    $course->getCredit(),
                    $course->getDepartmentId(),
                    $course->getCourseType(),
                    $course->getCourseLevel(),
                    $course->getIsActive(),
                    $course->getCourseId()
                ]);
            } else {
                // Insert new course
                $stmt = $this->db->prepare("INSERT INTO courses (course_code, course_name, credit, department_id, course_type, course_level, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $result = $stmt->execute([
                    $course->getCourseCode(),
                    $course->getCourseName(),
                    $course->getCredit(),
                    $course->getDepartmentId(),
                    $course->getCourseType(),
                    $course->getCourseLevel(),
                    $course->getIsActive()
                ]);

                if ($result) {
                    $course->setCourseId($this->db->lastInsertId());
                }

                return $result;
            }
        } catch (Exception $e) {
            throw new Exception("Database error in save: " . $e->getMessage());
        }
    }

    /**
     * Delete course
     */
    public function delete($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM courses WHERE course_id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all courses with department info
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, d.department_code, d.department_name
                FROM courses c 
                LEFT JOIN departments d ON c.department_id = d.department_id
                ORDER BY c.course_code
            ");
            $stmt->execute();
            $courses = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $courses[] = [
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'department_id' => $data['department_id'] ?? null,
                    'department_code' => $data['department_code'] ?? null,
                    'department_name' => $data['department_name'] ?? null,
                    'course_type' => $data['course_type'] ?? 'Theory',
                    'course_level' => $data['course_level'] ?? 'Undergraduate',
                    'is_active' => $data['is_active'] ?? 1,
                    'created_at' => $data['created_at'] ?? null,
                    'updated_at' => $data['updated_at'] ?? null
                ];
            }

            return $courses;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count all courses
     * @return int
     */
    public function countAll()
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM courses");
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated list of courses (admin view).
     * Cursor is on course_id (BIGINT).
     *
     * @param array $params Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findPaginated(array $params): array
    {
        try {
            $sql = "
                SELECT c.course_id, c.course_code, c.course_name, c.credit,
                       c.department_id, c.course_type, c.course_level,
                       c.is_active, c.created_at, c.updated_at,
                       d.department_name, d.department_code,
                       co.offering_id, co.year, co.semester,
                       co.co_threshold, co.passing_threshold,
                       u.employee_id AS faculty_id,
                       u.username    AS faculty_name,
                       (SELECT COUNT(*) FROM enrollments e
                        WHERE e.offering_id = co.offering_id) AS enrollment_count,
                       (SELECT COUNT(*) FROM tests t
                        WHERE t.offering_id = co.offering_id) AS test_count
                FROM courses c
                LEFT JOIN departments d ON c.department_id = d.department_id
                LEFT JOIN course_offerings co
                       ON co.course_id = c.course_id
                      AND co.offering_id = (
                              SELECT MAX(co2.offering_id)
                              FROM course_offerings co2
                              WHERE co2.course_id = c.course_id
                          )
                LEFT JOIN course_faculty_assignments cfa
                       ON cfa.offering_id = co.offering_id
                      AND cfa.assignment_type = 'Primary'
                      AND cfa.is_active = 1
                LEFT JOIN users u ON u.employee_id = cfa.employee_id
                WHERE 1=1
            ";
            $bindings = [];

            if ($params['search']) {
                $sql .= " AND (c.course_code LIKE ? OR c.course_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND c.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }
            if (isset($params['filters']['is_active'])) {
                $sql .= " AND c.is_active = ?";
                $bindings[] = (int)$params['filters']['is_active'];
            }
            if (!empty($params['filters']['course_type'])) {
                $sql .= " AND c.course_type = ?";
                $bindings[] = $params['filters']['course_type'];
            }

            PaginationHelper::applyCursor($sql, $bindings, 'c.course_id', $params['cursor'], $params['sortDir']);

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
     * Count courses matching pagination filters.
     */
    public function countPaginated(array $params): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM courses c WHERE 1=1";
            $bindings = [];

            if ($params['search']) {
                $sql .= " AND (c.course_code LIKE ? OR c.course_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND c.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }
            if (isset($params['filters']['is_active'])) {
                $sql .= " AND c.is_active = ?";
                $bindings[] = (int)$params['filters']['is_active'];
            }
            if (!empty($params['filters']['course_type'])) {
                $sql .= " AND c.course_type = ?";
                $bindings[] = $params['filters']['course_type'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated courses scoped to a school (dean view).
     */
    public function findBySchoolPaginated(int $schoolId, array $params): array
    {
        try {
            $sql = "
                SELECT c.course_id, c.course_code, c.course_name, c.credit,
                       c.department_id, c.course_type, c.course_level, c.is_active,
                       d.department_name, d.department_code,
                       co.offering_id, co.year, co.semester,
                       co.co_threshold, co.passing_threshold,
                       u.employee_id AS faculty_id,
                       u.username    AS faculty_name,
                       (SELECT COUNT(*) FROM enrollments e
                        WHERE e.offering_id = co.offering_id) AS enrollment_count,
                       (SELECT COUNT(*) FROM tests t
                        WHERE t.offering_id = co.offering_id) AS test_count
                FROM courses c
                JOIN departments d ON c.department_id = d.department_id
                LEFT JOIN course_offerings co
                       ON co.course_id = c.course_id
                      AND co.offering_id = (
                              SELECT MAX(co2.offering_id)
                              FROM course_offerings co2
                              WHERE co2.course_id = c.course_id
                          )
                LEFT JOIN course_faculty_assignments cfa
                       ON cfa.offering_id = co.offering_id
                      AND cfa.assignment_type = 'Primary'
                      AND cfa.is_active = 1
                LEFT JOIN users u ON u.employee_id = cfa.employee_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (c.course_code LIKE ? OR c.course_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }

            PaginationHelper::applyCursor($sql, $bindings, 'c.course_id', $params['cursor'], $params['sortDir']);

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
     * Count courses in a school matching filters.
     */
    public function countBySchoolPaginated(int $schoolId, array $params): int
    {
        try {
            $sql = "
                SELECT COUNT(*)
                FROM courses c
                JOIN departments d ON c.department_id = d.department_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (c.course_code LIKE ? OR c.course_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find course by course code
     * @param string $courseCode
     * @return Course|null
     */
    public function findByCourseCode($courseCode)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM courses WHERE course_code = ?");
            $stmt->execute([$courseCode]);
            $data = $stmt->fetch();

            if ($data) {
                return new Course(
                    $data['course_id'],
                    $data['course_code'],
                    $data['course_name'],
                    $data['credit'],
                    $data['department_id'] ?? null,
                    $data['course_type'] ?? 'Theory',
                    $data['course_level'] ?? 'Undergraduate',
                    $data['is_active'] ?? 1,
                    $data['created_at'] ?? null,
                    $data['updated_at'] ?? null
                );
            }
            return null;
        } catch (Exception $e) {
            throw new Exception("Database error in findByCourseCode: " . $e->getMessage());
        }
    }

    /**
     * Find course by ID with department info
     * @param int $id
     * @return array|null
     */
    public function findByIdWithDepartment($id)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, d.department_code, d.department_name
                FROM courses c 
                LEFT JOIN departments d ON c.department_id = d.department_id
                WHERE c.course_id = ?
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return [
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'department_id' => $data['department_id'] ?? null,
                    'department_code' => $data['department_code'] ?? null,
                    'department_name' => $data['department_name'] ?? null,
                    'course_type' => $data['course_type'] ?? 'Theory',
                    'course_level' => $data['course_level'] ?? 'Undergraduate',
                    'is_active' => $data['is_active'] ?? 1,
                    'created_at' => $data['created_at'] ?? null,
                    'updated_at' => $data['updated_at'] ?? null
                ];
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find courses by department
     * @param int $departmentId
     * @return array
     */
    public function findByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*
                FROM courses c 
                WHERE c.department_id = ?
                ORDER BY c.course_code
            ");
            $stmt->execute([$departmentId]);
            $courses = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $courses[] = [
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'department_id' => $data['department_id'] ?? null,
                    'course_type' => $data['course_type'] ?? 'Theory',
                    'course_level' => $data['course_level'] ?? 'Undergraduate',
                    'is_active' => $data['is_active'] ?? 1,
                    'created_at' => $data['created_at'] ?? null,
                    'updated_at' => $data['updated_at'] ?? null
                ];
            }

            return $courses;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count courses by department
     * @param int $departmentId
     * @return int
     */
    public function countByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM courses WHERE department_id = ?");
            $stmt->execute([$departmentId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count offerings by department
     * @param int $departmentId
     * @return int
     */
    public function countOfferingsByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                WHERE c.department_id = ?
            ");
            $stmt->execute([$departmentId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count assessments (tests) by department
     * @param int $departmentId
     * @return int
     */
    public function countAssessmentsByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(DISTINCT t.test_id) FROM tests t
                INNER JOIN course_offerings co ON t.offering_id = co.offering_id
                INNER JOIN courses c ON co.course_id = c.course_id
                WHERE c.department_id = ?
            ");
            $stmt->execute([$departmentId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count basic courses by department for pagination
     * @param int $departmentId
     * @param array $params
     * @return int
     */
    public function countBaseCoursesByDepartmentPaginated(int $departmentId, array $params): int
    {
        try {
            $sql = "SELECT COUNT(DISTINCT c.course_id) FROM courses c WHERE c.department_id = ?";
            $bindings = [$departmentId];

            if (!empty($params['search'])) {
                $sql .= " AND (c.course_code LIKE ? OR c.course_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }

            if (isset($params['filters']['is_active']) && $params['filters']['is_active'] !== '') {
                $sql .= " AND c.is_active = ?";
                $bindings[] = (int)$params['filters']['is_active'];
            }
            if (!empty($params['filters']['course_type'])) {
                $sql .= " AND c.course_type = ?";
                $bindings[] = $params['filters']['course_type'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated base courses scoped to a department (HOD view).
     *
     * @param int   $departmentId
     * @param array $params Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findBaseCoursesByDepartmentPaginated(int $departmentId, array $params): array
    {
        try {
            $sql = "
                SELECT c.course_id, c.course_code, c.course_name, c.credit,
                       c.department_id, c.course_type, c.course_level,
                       c.is_active, c.created_at, c.updated_at
                FROM courses c
                WHERE c.department_id = ?
            ";
            $bindings = [$departmentId];

            if (!empty($params['search'])) {
                $sql .= " AND (c.course_code LIKE ? OR c.course_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }

            if (isset($params['filters']['is_active']) && $params['filters']['is_active'] !== '') {
                $sql .= " AND c.is_active = ?";
                $bindings[] = (int)$params['filters']['is_active'];
            }
            if (!empty($params['filters']['course_type'])) {
                $sql .= " AND c.course_type = ?";
                $bindings[] = $params['filters']['course_type'];
            }

            PaginationHelper::applyCursor($sql, $bindings, 'c.course_id', $params['cursor'] ?? null, $params['sortDir'] ?? 'ASC');

            $limit = (int)($params['limit'] ?? 20) + 1;
            $sortDir = $params['sortDir'] ?? 'ASC';
            
            // Valid columns for sorting
            $validSorts = ['course_code', 'course_name', 'credit', 'course_type', 'course_level'];
            $sortField = in_array($params['sort'] ?? '', $validSorts) ? "c.{$params['sort']}" : 'c.course_id';

            $sql .= " ORDER BY {$sortField} {$sortDir} LIMIT {$limit}";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated courses scoped to a department (HOD / Staff view).
     *
     * @param int   $departmentId
     * @param array $params Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findByDepartmentPaginated(int $departmentId, array $params): array
    {
        try {
            $sql = "
                SELECT c.course_id, c.course_code, c.course_name, c.credit,
                       c.department_id, c.course_type, c.course_level,
                       c.is_active, c.created_at, c.updated_at,
                       co.offering_id, co.year, co.semester,
                       co.co_threshold, co.passing_threshold,
                       u.employee_id AS faculty_id,
                       u.username    AS faculty_name,
                       cfa.is_active AS cfa_is_active,
                       (SELECT COUNT(*) FROM enrollments e
                        WHERE e.offering_id = co.offering_id) AS enrollment_count,
                       (SELECT COUNT(*) FROM tests t
                        WHERE t.offering_id = co.offering_id) AS test_count,
                       (SELECT ROUND(
                            SUM(m.marks_obtained) / NULLIF(
                                COUNT(DISTINCT m.student_roll_no) *
                                (SELECT SUM(t2.full_marks) FROM tests t2 WHERE t2.offering_id = co.offering_id)
                            , 0) * 100, 1)
                        FROM marks m
                        INNER JOIN tests t3 ON t3.test_id = m.test_id
                        WHERE t3.offering_id = co.offering_id
                       ) AS avg_score_pct
                FROM courses c
                INNER JOIN course_offerings co ON co.course_id = c.course_id
                LEFT JOIN course_faculty_assignments cfa
                       ON cfa.offering_id = co.offering_id
                      AND cfa.assignment_type = 'Primary'
                LEFT JOIN users u ON u.employee_id = cfa.employee_id
                WHERE c.department_id = ?
            ";
            $bindings = [$departmentId];

            if ($params['search']) {
                $sql .= " AND (c.course_code LIKE ? OR c.course_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (isset($params['filters']['is_active'])) {
                $sql .= " AND c.is_active = ?";
                $bindings[] = (int)$params['filters']['is_active'];
            }
            if (!empty($params['filters']['course_type'])) {
                $sql .= " AND c.course_type = ?";
                $bindings[] = $params['filters']['course_type'];
            }
            if (!empty($params['filters']['year'])) {
                $sql .= " AND co.year = ?";
                $bindings[] = (int)$params['filters']['year'];
            }
            if (!empty($params['filters']['semester'])) {
                $sql .= " AND co.semester = ?";
                $bindings[] = $params['filters']['semester'];
            }

            PaginationHelper::applyCursor($sql, $bindings, 'co.offering_id', $params['cursor'], $params['sortDir']);

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
     * Count courses in a department matching filters.
     */
    public function countByDepartmentPaginated(int $departmentId, array $params): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM courses c INNER JOIN course_offerings co ON co.course_id = c.course_id WHERE c.department_id = ?";
            $bindings = [$departmentId];

            if ($params['search']) {
                $sql .= " AND (c.course_code LIKE ? OR c.course_name LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (isset($params['filters']['is_active'])) {
                $sql .= " AND c.is_active = ?";
                $bindings[] = (int)$params['filters']['is_active'];
            }
            if (!empty($params['filters']['course_type'])) {
                $sql .= " AND c.course_type = ?";
                $bindings[] = $params['filters']['course_type'];
            }
            if (!empty($params['filters']['year'])) {
                $sql .= " AND co.year = ?";
                $bindings[] = (int)$params['filters']['year'];
            }
            if (!empty($params['filters']['semester'])) {
                $sql .= " AND co.semester = ?";
                $bindings[] = $params['filters']['semester'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get per-test averages for a specific offering.
     * Returns one row per test with avg marks and avg percentage.
     */
    public function getOfferingTestAverages(int $offeringId): array
    {
        try {
            $sql = "
                SELECT
                    t.test_id,
                    t.test_name,
                    t.test_type,
                    t.full_marks,
                    ROUND(AVG(st.student_total), 1) AS avg_marks,
                    ROUND(AVG(st.student_total) / NULLIF(t.full_marks, 0) * 100, 1) AS avg_pct,
                    COUNT(st.student_roll_no) AS students_assessed
                FROM tests t
                LEFT JOIN (
                    SELECT m.test_id, m.student_roll_no, SUM(m.marks_obtained) AS student_total
                    FROM marks m
                    INNER JOIN tests t2 ON t2.test_id = m.test_id
                    WHERE t2.offering_id = ?
                    GROUP BY m.test_id, m.student_roll_no
                ) st ON st.test_id = t.test_id
                WHERE t.offering_id = ?
                GROUP BY t.test_id, t.test_name, t.test_type, t.full_marks
                ORDER BY t.test_id
            ";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$offeringId, $offeringId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
