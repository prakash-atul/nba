<?php

/**
 * Faculty Controller
 * Handles faculty-specific operations
 */
class FacultyController
{
    private $courseRepository;
    private $courseOfferingRepository;
    private $courseFacultyAssignmentRepository;
    private $testRepository;
    private $enrollmentRepository;
    private $marksRepository;
    private $db;

    public function __construct(
        CourseRepository $courseRepository,
        CourseOfferingRepository $courseOfferingRepository,
        CourseFacultyAssignmentRepository $courseFacultyAssignmentRepository,
        TestRepository $testRepository,
        EnrollmentRepository $enrollmentRepository,
        MarksRepository $marksRepository,
        $db
    ) {
        $this->courseRepository = $courseRepository;
        $this->courseOfferingRepository = $courseOfferingRepository;
        $this->courseFacultyAssignmentRepository = $courseFacultyAssignmentRepository;
        $this->testRepository = $testRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->marksRepository = $marksRepository;
        $this->db = $db;
    }

    /**
     * Get faculty dashboard statistics
     */
    public function getStats($facultyId)
    {
        try {
            // Get active offerings for this faculty (all years/semesters for stats)
            $assignments = $this->courseFacultyAssignmentRepository->getAssignmentsByFaculty($facultyId);
            $totalOfferings = count($assignments);

            $totalAssessments = 0;
            $totalStudents = 0;
            $totalAttainment = 0;
            $offeringCountWithAttainment = 0;

            foreach ($assignments as $assignment) {
                $offeringId = $assignment['offering_id'];

                // Count tests for this offering
                $stmt = $this->db->prepare("SELECT COUNT(*) FROM tests WHERE offering_id = ?");
                $stmt->execute([$offeringId]);
                $totalAssessments += $stmt->fetchColumn();

                // Count enrolled students
                $stmt = $this->db->prepare("SELECT COUNT(*) FROM enrollments WHERE offering_id = ?");
                $stmt->execute([$offeringId]);
                $totalStudents += $stmt->fetchColumn();

                // Average score percentage across all students and tests in this offering
                $stmt = $this->db->prepare("
                    SELECT AVG(s.student_total / NULLIF(s.full_marks, 0) * 100) AS avg_percentage
                    FROM (
                        SELECT m.student_roll_no, t.test_id, t.full_marks,
                               SUM(m.marks_obtained) AS student_total
                        FROM marks m
                        JOIN tests t ON m.test_id = t.test_id
                        WHERE t.offering_id = ?
                          AND t.full_marks > 0
                        GROUP BY m.student_roll_no, t.test_id, t.full_marks
                    ) s
                ");
                $stmt->execute([$offeringId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result && $result['avg_percentage'] !== null) {
                    $totalAttainment += floatval($result['avg_percentage']);
                    $offeringCountWithAttainment++;
                }
            }

            $averageAttainment = $offeringCountWithAttainment > 0 
                ? round($totalAttainment / $offeringCountWithAttainment, 1) 
                : 0;

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Faculty stats retrieved successfully',
                'data' => [
                    'totalCourses' => $totalOfferings,
                    'totalAssessments' => $totalAssessments,
                    'totalStudents' => $totalStudents,
                    'averageAttainment' => $averageAttainment
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error getting faculty stats: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve faculty statistics',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get all students enrolled in any of the faculty's courses
     */
    public function getEnrolledStudents($facultyId)
    {
        try {
            $assignments = $this->courseFacultyAssignmentRepository->getAssignmentsByFaculty($facultyId);

            if (empty($assignments)) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode(['success' => true, 'data' => []]);
                return;
            }

            $offeringIds = array_column($assignments, 'offering_id');
            $placeholders = implode(',', array_fill(0, count($offeringIds), '?'));

            $stmt = $this->db->prepare("
                SELECT DISTINCT
                    s.roll_no,
                    s.student_name,
                    s.department_id,
                    s.batch_year,
                    s.student_status,
                    s.email,
                    s.phone,
                    d.department_name,
                    d.department_code,
                    GROUP_CONCAT(DISTINCT CONCAT(c.course_code, ': ', c.course_name, ' (', co.year, '/', co.semester, ')') ORDER BY c.course_code SEPARATOR ', ') AS enrolled_courses
                FROM enrollments e
                JOIN students s ON e.student_rollno = s.roll_no
                JOIN course_offerings co ON e.offering_id = co.offering_id
                JOIN courses c ON co.course_id = c.course_id
                LEFT JOIN departments d ON s.department_id = d.department_id
                WHERE e.offering_id IN ($placeholders)
                GROUP BY s.roll_no
                ORDER BY s.roll_no
            ");
            $stmt->execute($offeringIds);
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'data' => $students]);
        } catch (Exception $e) {
            error_log("Error getting enrolled students: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve students', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Update a student's information (name, email, phone, status)
     * Faculty can only update students enrolled in their courses
     */
    public function updateStudent($rollNo, $facultyId)
    {
        try {
            // Verify the student is enrolled in at least one of this faculty's courses
            $assignments = $this->courseFacultyAssignmentRepository->getAssignmentsByFaculty($facultyId);
            $offeringIds = array_column($assignments, 'offering_id');

            if (!empty($offeringIds)) {
                $placeholders = implode(',', array_fill(0, count($offeringIds), '?'));
                $stmt = $this->db->prepare("
                    SELECT COUNT(*) FROM enrollments
                    WHERE student_rollno = ? AND offering_id IN ($placeholders)
                ");
                $params = array_merge([$rollNo], $offeringIds);
                $stmt->execute($params);
                if ($stmt->fetchColumn() == 0) {
                    http_response_code(403);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Student not found in your courses']);
                    return;
                }
            }

            $body = json_decode(file_get_contents('php://input'), true);
            if (!$body) {
                http_response_code(400);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Invalid request body']);
                return;
            }

            // Fetch existing
            $stmt = $this->db->prepare("SELECT * FROM students WHERE roll_no = ?");
            $stmt->execute([$rollNo]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$existing) {
                http_response_code(404);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Student not found']);
                return;
            }

            $studentName    = $body['student_name'] ?? $existing['student_name'];
            $email          = array_key_exists('email', $body) ? $body['email'] : $existing['email'];
            $phone          = array_key_exists('phone', $body) ? $body['phone'] : $existing['phone'];
            $studentStatus  = $body['student_status'] ?? $existing['student_status'];
            $batchYear      = $body['batch_year'] ?? $existing['batch_year'];

            $stmt = $this->db->prepare("
                UPDATE students
                SET student_name = ?, email = ?, phone = ?, student_status = ?, batch_year = ?
                WHERE roll_no = ?
            ");
            $stmt->execute([$studentName, $email, $phone, $studentStatus, $batchYear, $rollNo]);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Student updated successfully']);
        } catch (Exception $e) {
            error_log("Error updating student: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to update student', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Remove a student from all of this faculty's course enrollments
     */
    public function removeStudentFromCourses($rollNo, $facultyId)
    {
        try {
            $assignments = $this->courseFacultyAssignmentRepository->getAssignmentsByFaculty($facultyId);
            $offeringIds = array_column($assignments, 'offering_id');

            if (empty($offeringIds)) {
                http_response_code(404);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'No courses found for this faculty']);
                return;
            }

            $placeholders = implode(',', array_fill(0, count($offeringIds), '?'));
            $stmt = $this->db->prepare("
                DELETE FROM enrollments
                WHERE student_rollno = ? AND offering_id IN ($placeholders)
            ");
            $params = array_merge([$rollNo], $offeringIds);
            $stmt->execute($params);
            $deleted = $stmt->rowCount();

            if ($deleted === 0) {
                http_response_code(404);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Student not found in your courses']);
                return;
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => "Student removed from $deleted course enrollment(s)"
            ]);
        } catch (Exception $e) {
            error_log("Error removing student from courses: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to remove student', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a test/assessment
     * Also deletes all associated questions, raw marks, and CO marks (CASCADE)
     */
    public function deleteTest($testId, $facultyId)
    {
        try {
            // First verify that this test belongs to a course taught by this faculty
            // In new schema: test -> offering -> course_faculty_assignments
            $stmt = $this->db->prepare("
                SELECT t.test_id, t.test_name, c.course_code, c.course_name
                FROM tests t
                JOIN course_offerings co ON t.offering_id = co.offering_id
                JOIN courses c ON co.course_id = c.course_id
                JOIN course_faculty_assignments cfa ON co.offering_id = cfa.offering_id
                WHERE t.test_id = ? AND cfa.employee_id = ? AND cfa.is_active = 1
            ");
            $stmt->execute([$testId, $facultyId]);
            $test = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$test) {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Test not found or you do not have permission to delete this test'
                ]);
                return;
            }

            // Get counts for confirmation message
            $stmt = $this->db->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM questions WHERE test_id = ?) as question_count,
                    (SELECT COUNT(DISTINCT student_roll_no) FROM marks WHERE test_id = ?) as student_count,
                    (SELECT COUNT(*) FROM raw_marks WHERE test_id = ?) as raw_marks_count
            ");
            $stmt->execute([$testId, $testId, $testId]);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC);

            // Delete the test (CASCADE will handle questions, raw_marks, and marks)
            $stmt = $this->db->prepare("DELETE FROM tests WHERE test_id = ?");
            $stmt->execute([$testId]);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Test deleted successfully',
                'data' => [
                    'test_name' => $test['test_name'],
                    'course_code' => $test['course_code'],
                    'questions_deleted' => (int)$counts['question_count'],
                    'students_affected' => (int)$counts['student_count'],
                    'raw_marks_deleted' => (int)$counts['raw_marks_count']
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error deleting test: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete test',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get stats for a single course offering (scoped to requesting faculty)
     */
    public function getCourseStats($facultyId, $offeringId)
    {
        try {
            // Check if user is HOD or Admin to bypass assignment check
            $user = $_REQUEST['authenticated_user'] ?? null;
            $hasOverride = $user && ($user['role'] === 'admin' || $user['is_hod'] || $user['is_dean']);

            if (!$hasOverride) {
                // Verify this offering belongs to the faculty
                $assignments = $this->courseFacultyAssignmentRepository->getAssignmentsByFaculty($facultyId);
                $offeringIds = array_column($assignments, 'offering_id');

                if (!in_array($offeringId, $offeringIds)) {
                    http_response_code(403);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Access denied to this course offering']);
                    return;
                }
            }

            // Count assessments
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM tests WHERE offering_id = ?");
            $stmt->execute([$offeringId]);
            $totalAssessments = (int) $stmt->fetchColumn();

            // Count enrolled students
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM enrollments WHERE offering_id = ?");
            $stmt->execute([$offeringId]);
            $activeStudents = (int) $stmt->fetchColumn();

            // Count marks entries (to distinguish "no marks entered" from 0% performance)
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM marks m
                JOIN tests t ON m.test_id = t.test_id
                WHERE t.offering_id = ?
            ");
            $stmt->execute([$offeringId]);
            $marksCount = (int) $stmt->fetchColumn();

            // Average performance (%)
            $stmt = $this->db->prepare("
                SELECT AVG(s.student_total / NULLIF(s.full_marks, 0) * 100) AS avg_percentage
                FROM (
                    SELECT m.student_roll_no, t.test_id, t.full_marks,
                           SUM(m.marks_obtained) AS student_total
                    FROM marks m
                    JOIN tests t ON m.test_id = t.test_id
                    WHERE t.offering_id = ?
                      AND t.full_marks > 0
                    GROUP BY m.student_roll_no, t.test_id, t.full_marks
                ) s
            ");
            $stmt->execute([$offeringId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $avgPerformance = ($result && $result['avg_percentage'] !== null)
                ? round(floatval($result['avg_percentage']), 1)
                : null;

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'data' => [
                    'totalAssessments' => $totalAssessments,
                    'activeStudents'   => $activeStudents,
                    'avgPerformance'   => $avgPerformance,
                    'marksCount'       => $marksCount
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error getting course stats: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve course statistics', 'error' => $e->getMessage()]);
        }
    }

    public function concludeCourse($facultyId, $offeringId)
    {
        try {
            // Verify faculty is assigned and active
            if (!$this->courseFacultyAssignmentRepository->isFacultyAssignedToOffering($offeringId, $facultyId)) {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Unauthorized or already concluded access to this course offering.']);
                return;
            }

            // Begin Transaction
            $this->db->beginTransaction();

            $completionDate = date('Y-m-d');

            // 1. Set assignment to inactive
            $stmt = $this->db->prepare("
                UPDATE course_faculty_assignments
                SET is_active = 0, completion_date = ?
                WHERE offering_id = ? AND employee_id = ? AND is_active = 1
            ");
            $stmt->execute([$completionDate, $offeringId, $facultyId]);

            // 2. Set remaining enrollments to completed
            $stmt = $this->db->prepare("
                UPDATE enrollments 
                SET enrollment_status = 'Completed' 
                WHERE offering_id = ? AND (enrollment_status IS NULL OR enrollment_status != 'Completed')
            ");
            $stmt->execute([$offeringId]);

            // 3. Purge raw marks to save space, safely since aggregation exists
            $stmt = $this->db->prepare("
                DELETE rm FROM raw_marks rm
                INNER JOIN questions q ON rm.question_id = q.question_id
                INNER JOIN tests t ON q.test_id = t.test_id
                WHERE t.offering_id = ?
            ");
            $stmt->execute([$offeringId]);

            $this->db->commit();

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true, 
                'message' => 'Course concluded successfully. Session finalized and obsolete raw records purged.'
            ]);

        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Error concluding course: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to conclude course', 'error' => $e->getMessage()]);
        }
    }
}