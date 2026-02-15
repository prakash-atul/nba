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
                    $data['faculty_id'],
                    $data['year'],
                    $data['semester'],
                    $data['syllabus_pdf'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00,
                    $data['department_id'] ?? null,
                    $data['course_type'] ?? 'Theory',
                    $data['course_level'] ?? 'Undergraduate',
                    $data['is_active'] ?? 1,
                    $data['created_at'] ?? null,
                    $data['updated_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find courses by faculty ID
     */
    public function findByFacultyId($facultyId)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM courses WHERE faculty_id = ? ORDER BY year, semester");
            $stmt->execute([$facultyId]);
            $courses = [];

            while ($data = $stmt->fetch()) {
                $courses[] = new Course(
                    $data['course_id'],
                    $data['course_code'],
                    $data['course_name'],
                    $data['credit'],
                    $data['faculty_id'],
                    $data['year'],
                    $data['semester'],
                    $data['syllabus_pdf'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00,
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
     * Find courses by faculty ID, year, and semester
     */
    public function findByFacultyYearSemester($facultyId, $year, $semester)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM courses WHERE faculty_id = ? AND year = ? AND semester = ?");
            $stmt->execute([$facultyId, $year, $semester]);
            $courses = [];

            while ($data = $stmt->fetch()) {
                $courses[] = new Course(
                    $data['course_id'],
                    $data['course_code'],
                    $data['course_name'],
                    $data['credit'],
                    $data['faculty_id'],
                    $data['year'],
                    $data['semester'],
                    $data['syllabus_pdf'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00,
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
     * Get unique years and semesters for a faculty
     */
    public function getYearSemestersByFaculty($facultyId)
    {
        try {
            $stmt = $this->db->prepare("SELECT DISTINCT year, semester FROM courses WHERE faculty_id = ? ORDER BY year, semester");
            $stmt->execute([$facultyId]);
            return $stmt->fetchAll();
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
                $stmt = $this->db->prepare("UPDATE courses SET course_code = ?, course_name = ?, credit = ?, syllabus_pdf = ?, faculty_id = ?, year = ?, semester = ?, co_threshold = ?, passing_threshold = ?, department_id = ?, course_type = ?, course_level = ?, is_active = ? WHERE course_id = ?");
                return $stmt->execute([
                    $course->getCourseCode(),
                    $course->getCourseName(),
                    $course->getCredit(),
                    $course->getSyllabusPdf(),
                    $course->getFacultyId(),
                    $course->getYear(),
                    $course->getSemester(),
                    $course->getCoThreshold(),
                    $course->getPassingThreshold(),
                    $course->getDepartmentId(),
                    $course->getCourseType(),
                    $course->getCourseLevel(),
                    $course->getIsActive(),
                    $course->getCourseId()
                ]);
            } else {
                // Insert new course
                $stmt = $this->db->prepare("INSERT INTO courses (course_code, course_name, credit, syllabus_pdf, faculty_id, year, semester, co_threshold, passing_threshold, department_id, course_type, course_level, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $result = $stmt->execute([
                    $course->getCourseCode(),
                    $course->getCourseName(),
                    $course->getCredit(),
                    $course->getSyllabusPdf(),
                    $course->getFacultyId(),
                    $course->getYear(),
                    $course->getSemester(),
                    $course->getCoThreshold(),
                    $course->getPassingThreshold(),
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
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
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
     * Update course thresholds
     */
    public function updateThresholds($courseId, $coThreshold, $passingThreshold)
    {
        try {
            $stmt = $this->db->prepare("UPDATE courses SET co_threshold = ?, passing_threshold = ? WHERE course_id = ?");
            return $stmt->execute([$coThreshold, $passingThreshold, $courseId]);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all courses with faculty info
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, u.username as faculty_name 
                FROM courses c 
                LEFT JOIN users u ON c.faculty_id = u.employee_id 
                ORDER BY c.year DESC, c.semester, c.course_code
            ");
            $stmt->execute();
            $courses = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $courses[] = [
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'faculty_id' => $data['faculty_id'],
                    'faculty_name' => $data['faculty_name'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
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
                    $data['faculty_id'],
                    $data['year'],
                    $data['semester'],
                    $data['syllabus_pdf'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00,
                    $data['department_id'] ?? null,
                    $data['course_type'] ?? 'Theory',
                    $data['course_level'] ?? 'Undergraduate',
                    $data['is_active'] ?? 1,
                    $data['created_at'] ?? null,
                    $data['updated_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find course by ID with faculty info
     * @param int $id
     * @return array|null
     */
    public function findByIdWithFaculty($id)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, u.username as faculty_name 
                FROM courses c 
                LEFT JOIN users u ON c.faculty_id = u.employee_id 
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
                    'faculty_id' => $data['faculty_id'],
                    'faculty_name' => $data['faculty_name'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
                    'department_id' => $data['department_id'] ?? null,
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
     * Find courses by department (through faculty)
     * @param int $departmentId
     * @return array
     */
    public function findByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, u.username as faculty_name 
                FROM courses c 
                INNER JOIN users u ON c.faculty_id = u.employee_id 
                WHERE u.department_id = ?
                ORDER BY c.year DESC, c.semester, c.course_code
            ");
            $stmt->execute([$departmentId]);
            $courses = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $courses[] = [
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'faculty_id' => $data['faculty_id'],
                    'faculty_name' => $data['faculty_name'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
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
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM courses c 
                INNER JOIN users u ON c.faculty_id = u.employee_id 
                WHERE u.department_id = ?
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
                SELECT COUNT(*) FROM tests t
                INNER JOIN courses c ON t.course_id = c.course_id
                INNER JOIN users u ON c.faculty_id = u.employee_id 
                WHERE u.department_id = ?
            ");
            $stmt->execute([$departmentId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
