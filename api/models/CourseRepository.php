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
            $stmt = $this->db->prepare("SELECT * FROM course WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch();

            if ($data) {
                return new Course(
                    $data['id'],
                    $data['course_code'],
                    $data['name'],
                    $data['credit'],
                    $data['faculty_id'],
                    $data['year'],
                    $data['semester'],
                    $data['syllabus_pdf'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00
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
            $stmt = $this->db->prepare("SELECT * FROM course WHERE faculty_id = ? ORDER BY year, semester");
            $stmt->execute([$facultyId]);
            $courses = [];

            while ($data = $stmt->fetch()) {
                $courses[] = new Course(
                    $data['id'],
                    $data['course_code'],
                    $data['name'],
                    $data['credit'],
                    $data['faculty_id'],
                    $data['year'],
                    $data['semester'],
                    $data['syllabus_pdf'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00
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
            $stmt = $this->db->prepare("SELECT * FROM course WHERE faculty_id = ? AND year = ? AND semester = ?");
            $stmt->execute([$facultyId, $year, $semester]);
            $courses = [];

            while ($data = $stmt->fetch()) {
                $courses[] = new Course(
                    $data['id'],
                    $data['course_code'],
                    $data['name'],
                    $data['credit'],
                    $data['faculty_id'],
                    $data['year'],
                    $data['semester'],
                    $data['syllabus_pdf'],
                    $data['co_threshold'] ?? 40.00,
                    $data['passing_threshold'] ?? 60.00
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
            $stmt = $this->db->prepare("SELECT DISTINCT year, semester FROM course WHERE faculty_id = ? ORDER BY year, semester");
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
            if ($course->getId()) {
                // Update existing course
                $stmt = $this->db->prepare("UPDATE course SET course_code = ?, name = ?, credit = ?, syllabus_pdf = ?, faculty_id = ?, year = ?, semester = ?, co_threshold = ?, passing_threshold = ? WHERE id = ?");
                return $stmt->execute([
                    $course->getCourseCode(),
                    $course->getName(),
                    $course->getCredit(),
                    $course->getSyllabusPdf(),
                    $course->getFacultyId(),
                    $course->getYear(),
                    $course->getSemester(),
                    $course->getCoThreshold(),
                    $course->getPassingThreshold(),
                    $course->getId()
                ]);
            } else {
                // Insert new course
                $stmt = $this->db->prepare("INSERT INTO course (course_code, name, credit, syllabus_pdf, faculty_id, year, semester, co_threshold, passing_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $result = $stmt->execute([
                    $course->getCourseCode(),
                    $course->getName(),
                    $course->getCredit(),
                    $course->getSyllabusPdf(),
                    $course->getFacultyId(),
                    $course->getYear(),
                    $course->getSemester(),
                    $course->getCoThreshold(),
                    $course->getPassingThreshold()
                ]);

                if ($result) {
                    $course->setId($this->db->lastInsertId());
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
            $stmt = $this->db->prepare("DELETE FROM course WHERE id = ?");
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
            $stmt = $this->db->prepare("UPDATE course SET co_threshold = ?, passing_threshold = ? WHERE id = ?");
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
                FROM course c 
                LEFT JOIN users u ON c.faculty_id = u.employee_id 
                ORDER BY c.year DESC, c.semester, c.course_code
            ");
            $stmt->execute();
            $courses = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $courses[] = [
                    'id' => $data['id'],
                    'course_code' => $data['course_code'],
                    'name' => $data['name'],
                    'credit' => $data['credit'],
                    'faculty_id' => $data['faculty_id'],
                    'faculty_name' => $data['faculty_name'],
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                    'co_threshold' => $data['co_threshold'],
                    'passing_threshold' => $data['passing_threshold']
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
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM course");
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
