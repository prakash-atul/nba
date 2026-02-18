<?php

/**
 * Course Offering Repository
 * Handles database operations for course offerings
 */
class CourseOfferingRepository
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getDb()
    {
        return $this->db;
    }

    /**
     * Find offering by ID
     */
    public function findById($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM course_offerings WHERE offering_id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch();

            if ($data) {
                return new CourseOffering(
                    $data['course_id'],
                    $data['year'],
                    $data['semester'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00,
                    $data['syllabus_pdf'],
                    $data['is_active'] ?? 1,
                    $data['created_at'] ?? null,
                    $data['updated_at'] ?? null,
                    $data['offering_id']
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find offering by Course ID, Year and Semester
     */
    public function findByCourseYearSem($courseId, $year, $semester)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM course_offerings 
                WHERE course_id = ? AND year = ? AND semester = ?
                LIMIT 1
            ");
            $stmt->execute([$courseId, $year, $semester]);
            $data = $stmt->fetch();

            if ($data) {
                return new CourseOffering(
                    $data['course_id'],
                    $data['year'],
                    $data['semester'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00,
                    $data['syllabus_pdf'],
                    $data['is_active'] ?? 1,
                    $data['created_at'] ?? null,
                    $data['updated_at'] ?? null,
                    $data['offering_id']
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Update performance thresholds for an offering
     */
    public function updateThresholds($offeringId, $coThreshold, $passingThreshold)
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE course_offerings 
                SET co_threshold = ?, passing_threshold = ? 
                WHERE offering_id = ?
            ");
            return $stmt->execute([$coThreshold, $passingThreshold, $offeringId]);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find offerings by course ID
     */
    public function findByCourseId($courseId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT co.*, c.course_code, c.course_name 
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                WHERE co.course_id = ?
                ORDER BY co.year DESC, co.semester DESC
            ");
            $stmt->execute([$courseId]);
            $offerings = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $offerings[] = [
                    'offering_id' => $data['offering_id'],
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
                    'is_active' => $data['is_active'],
                    'created_at' => $data['created_at'],
                    'updated_at' => $data['updated_at']
                ];
            }

            return $offerings;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find offerings by faculty ID (through assignments)
     */
    public function findByFacultyId($facultyId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT DISTINCT co.*, c.course_code, c.course_name, c.credit,
                       cfa.assignment_type, cfa.employee_id
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                INNER JOIN course_faculty_assignments cfa ON co.offering_id = cfa.offering_id
                WHERE cfa.employee_id = ? AND cfa.is_active = 1
                ORDER BY co.year DESC, co.semester DESC, c.course_code
            ");
            $stmt->execute([$facultyId]);
            $offerings = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $offerings[] = [
                    'offering_id' => $data['offering_id'],
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
                    'assignment_type' => $data['assignment_type'],
                    'is_active' => $data['is_active']
                ];
            }

            return $offerings;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find offerings by faculty ID, year, and semester
     */
    public function findByFacultyYearSemester($facultyId, $year, $semester)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT DISTINCT co.*, c.course_code, c.course_name, c.credit,
                       cfa.assignment_type
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                INNER JOIN course_faculty_assignments cfa ON co.offering_id = cfa.offering_id
                WHERE cfa.employee_id = ? AND cfa.is_active = 1
                  AND co.year = ? AND co.semester = ?
                ORDER BY c.course_code
            ");
            $stmt->execute([$facultyId, $year, $semester]);
            $offerings = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $offerings[] = [
                    'offering_id' => $data['offering_id'],
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
                    'assignment_type' => $data['assignment_type'],
                    'is_active' => $data['is_active']
                ];
            }

            return $offerings;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find offerings by department (through course.department_id)
     */
    public function findByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT co.*, c.course_code, c.course_name, c.credit,
                       u.username as primary_faculty_name,
                       cfa.employee_id as primary_faculty_id
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                LEFT JOIN course_faculty_assignments cfa 
                    ON co.offering_id = cfa.offering_id 
                    AND cfa.assignment_type = 'Primary' 
                    AND cfa.is_active = 1
                LEFT JOIN users u ON cfa.employee_id = u.employee_id
                WHERE c.department_id = ?
                ORDER BY co.year DESC, co.semester DESC, c.course_code
            ");
            $stmt->execute([$departmentId]);
            $offerings = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $offerings[] = [
                    'offering_id' => $data['offering_id'],
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
                    'primary_faculty_id' => $data['primary_faculty_id'],
                    'primary_faculty_name' => $data['primary_faculty_name'],
                    'is_active' => $data['is_active'],
                    'created_at' => $data['created_at'],
                    'updated_at' => $data['updated_at']
                ];
            }

            return $offerings;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find offerings by school
     */
    public function findBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT co.*, c.course_code, c.course_name, c.credit,
                       d.department_code, d.department_name,
                       u.username as primary_faculty_name,
                       cfa.employee_id as primary_faculty_id
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                INNER JOIN departments d ON c.department_id = d.department_id
                LEFT JOIN course_faculty_assignments cfa 
                    ON co.offering_id = cfa.offering_id 
                    AND cfa.assignment_type = 'Primary' 
                    AND cfa.is_active = 1
                LEFT JOIN users u ON cfa.employee_id = u.employee_id
                WHERE d.school_id = ?
                ORDER BY co.year DESC, co.semester DESC, d.department_code, c.course_code
            ");
            $stmt->execute([$schoolId]);
            $offerings = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $offerings[] = [
                    'offering_id' => $data['offering_id'],
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'department_code' => $data['department_code'],
                    'department_name' => $data['department_name'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
                    'primary_faculty_id' => $data['primary_faculty_id'],
                    'primary_faculty_name' => $data['primary_faculty_name'],
                    'is_active' => $data['is_active']
                ];
            }

            return $offerings;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get distinct year/semester pairs for a faculty
     */
    public function getYearSemestersByFaculty($facultyId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT DISTINCT co.year, co.semester 
                FROM course_offerings co
                INNER JOIN course_faculty_assignments cfa ON co.offering_id = cfa.offering_id
                WHERE cfa.employee_id = ? AND cfa.is_active = 1
                ORDER BY co.year DESC, co.semester DESC
            ");
            $stmt->execute([$facultyId]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Save offering (create or update)
     */
    public function save(CourseOffering $offering)
    {
        try {
            if ($offering->getOfferingId()) {
                // Update existing offering
                $stmt = $this->db->prepare("
                    UPDATE course_offerings 
                    SET course_id = ?, year = ?, semester = ?, 
                        co_threshold = ?, passing_threshold = ?, 
                        syllabus_pdf = ?, is_active = ?
                    WHERE offering_id = ?
                ");
                return $stmt->execute([
                    $offering->getCourseId(),
                    $offering->getYear(),
                    $offering->getSemester(),
                    $offering->getCoThreshold(),
                    $offering->getPassingThreshold(),
                    $offering->getSyllabusPdf(),
                    $offering->getIsActive(),
                    $offering->getOfferingId()
                ]);
            } else {
                // Insert new offering
                $stmt = $this->db->prepare("
                    INSERT INTO course_offerings 
                    (course_id, year, semester, co_threshold, passing_threshold, syllabus_pdf, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $result = $stmt->execute([
                    $offering->getCourseId(),
                    $offering->getYear(),
                    $offering->getSemester(),
                    $offering->getCoThreshold(),
                    $offering->getPassingThreshold(),
                    $offering->getSyllabusPdf(),
                    $offering->getIsActive()
                ]);

                if ($result) {
                    $offering->setOfferingId($this->db->lastInsertId());
                }

                return $result;
            }
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete offering
     */
    public function delete($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM course_offerings WHERE offering_id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get offering with full details (course info + primary faculty)
     */
    public function findByIdWithDetails($id)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT co.*, c.course_code, c.course_name, c.credit, c.department_id,
                       c.course_type, c.course_level,
                       d.department_code, d.department_name,
                       u.username as primary_faculty_name,
                       cfa.employee_id as primary_faculty_id
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                LEFT JOIN departments d ON c.department_id = d.department_id
                LEFT JOIN course_faculty_assignments cfa 
                    ON co.offering_id = cfa.offering_id 
                    AND cfa.assignment_type = 'Primary' 
                    AND cfa.is_active = 1
                LEFT JOIN users u ON cfa.employee_id = u.employee_id
                WHERE co.offering_id = ?
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return [
                    'offering_id' => $data['offering_id'],
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'department_id' => $data['department_id'],
                    'department_code' => $data['department_code'],
                    'department_name' => $data['department_name'],
                    'course_type' => $data['course_type'],
                    'course_level' => $data['course_level'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
                    'primary_faculty_id' => $data['primary_faculty_id'],
                    'primary_faculty_name' => $data['primary_faculty_name'],
                    'is_active' => $data['is_active'],
                    'created_at' => $data['created_at'],
                    'updated_at' => $data['updated_at']
                ];
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all offerings with course and faculty info
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT co.*, c.course_code, c.course_name, c.credit,
                       u.username as primary_faculty_name,
                       cfa.employee_id as primary_faculty_id
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                LEFT JOIN course_faculty_assignments cfa 
                    ON co.offering_id = cfa.offering_id 
                    AND cfa.assignment_type = 'Primary' 
                    AND cfa.is_active = 1
                LEFT JOIN users u ON cfa.employee_id = u.employee_id
                ORDER BY co.year DESC, co.semester DESC, c.course_code
            ");
            $stmt->execute();
            $offerings = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $offerings[] = [
                    'offering_id' => $data['offering_id'],
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'credit' => $data['credit'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold'],
                    'primary_faculty_id' => $data['primary_faculty_id'],
                    'primary_faculty_name' => $data['primary_faculty_name'],
                    'is_active' => $data['is_active']
                ];
            }

            return $offerings;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count offerings by department
     */
    public function countByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count 
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                WHERE c.department_id = ?
            ");
            $stmt->execute([$departmentId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] ?? 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count assessments by department
     */
    public function countAssessmentsByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(DISTINCT t.test_id) as count
                FROM tests t
                INNER JOIN course_offerings co ON t.offering_id = co.offering_id
                INNER JOIN courses c ON co.course_id = c.course_id
                WHERE c.department_id = ?
            ");
            $stmt->execute([$departmentId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] ?? 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
