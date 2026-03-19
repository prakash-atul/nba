<?php

/**
 * Faculty Controller
 * Handles faculty-specific operations
 */
class FacultyController
{
    protected $auditService;
    protected $auditLogRepository;

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
    , ?AuditService $auditService = null, ?AuditLogRepository $auditLogRepository = null) {
        $this->auditService = $auditService;
        $this->auditLogRepository = $auditLogRepository;

        $this->courseRepository = $courseRepository;
        $this->courseOfferingRepository = $courseOfferingRepository;
        $this->courseFacultyAssignmentRepository = $courseFacultyAssignmentRepository;
        $this->testRepository = $testRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->marksRepository = $marksRepository;
        $this->db = $db;
    }

    /**
     * Get recent audit logs for Faculty context (similar layout to HOD/Admin)
     */
    public function getLogs($request) {
        try {
            // Validate user is logged in
            $userData = $_REQUEST['authenticated_user'] ?? null;
            if (!$userData || ($userData['role'] !== 'faculty' && $userData['role'] !== 'admin' && $userData['role'] !== 'hod' && $userData['role'] !== 'dean')) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                return;
            }

            $filters = [
                'user_id' => $_GET['user_id'] ?? null,
                'action' => $_GET['action'] ?? null,
                'entity_type' => $_GET['entity_type'] ?? null,
                'entity_id' => $_GET['entity_id'] ?? null,
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null,
            ];
            
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

            $result = $this->auditLogRepository->findAll($filters, $page, $limit);

            $items = $result['data'];
            
            http_response_code(200);
            header("Content-Type: application/json");
            echo json_encode([
                "success" => true,
                "data" => $items,
                "pagination" => [
                    "current_page" => $page,
                    "per_page" => $limit,
                    "total_records" => $result['total'],
                    "total_pages" => ceil($result['total'] / $limit)
                ]
            ]);
        } catch (\Exception $e) {
            error_log("Error in FacultyController@getLogs: " . $e->getMessage());
            http_response_code(500);
            header("Content-Type: application/json");
            echo json_encode([
                "success" => false,
                "message" => "An error occurred while fetching audit logs for Faculty.",
                "error" => $e->getMessage()
            ]);
        }
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
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('UPDATE', 'Student', null, ($GLOBALS['audit_old_state'] ?? null), $auditPayload);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'FacultyController', 'UPDATE operation successful in updateStudent');
            }
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
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('DELETE', 'removeStudentFromCourses', null, ($GLOBALS['audit_old_state'] ?? $auditPayload), null);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'FacultyController', 'DELETE operation successful in removeStudentFromCourses');
            }
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
                    (SELECT COUNT(*) FROM raw_marks rm JOIN questions q ON rm.question_id = q.question_id WHERE q.test_id = ?) as raw_marks_count
            ");
            $stmt->execute([$testId, $testId, $testId]);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC);

            // Delete the test (CASCADE will handle questions, raw_marks, and marks)
            $stmt = $this->db->prepare("DELETE FROM tests WHERE test_id = ?");
            $stmt->execute([$testId]);

            http_response_code(200);
            header('Content-Type: application/json');
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('DELETE', 'Test', null, ($GLOBALS['audit_old_state'] ?? $auditPayload), null);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'FacultyController', 'DELETE operation successful in deleteTest');
            }
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
    public function getOfferingTestAverages($facultyId, $offeringId)
    {
        try {
            // Check if user is HOD or Admin to bypass assignment check
            $user = $_REQUEST['authenticated_user'] ?? null;
            $hasOverride = $user && ($user['role'] === 'admin' || $user['is_hod'] || $user['is_dean']);

            if (!$hasOverride) {
                // Verify this offering belongs to the faculty
                if (!$this->courseFacultyAssignmentRepository->isFacultyAssignedToOffering($offeringId, $facultyId, true)) {
                    http_response_code(403);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Access denied to this course offering']);
                    return;
                }
            }

            $averages = $this->courseRepository->getOfferingTestAverages($offeringId);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Test averages retrieved successfully',
                'data' => $averages,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve test averages', 'error' => $e->getMessage()]);
        }
    }

    public function getCourseStats($facultyId, $offeringId)
    {
        try {
            // Check if user is HOD or Admin to bypass assignment check
            $user = $_REQUEST['authenticated_user'] ?? null;
            $hasOverride = $user && ($user['role'] === 'admin' || $user['is_hod'] || $user['is_dean']);

            if (!$hasOverride) {
                // Verify this offering belongs to the faculty
                if (!$this->courseFacultyAssignmentRepository->isFacultyAssignedToOffering($offeringId, $facultyId, true)) {
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

    public function checkCourseCompletionStatus($facultyId, $offeringId)
    {
        try {
            // Verify faculty is assigned and active
            if (!$this->courseFacultyAssignmentRepository->isFacultyAssignedToOffering($offeringId, $facultyId)) {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Unauthorized or already concluded access to this course offering.']);
                return;
            }

            $stmt = $this->db->prepare("SELECT COUNT(*) FROM tests WHERE offering_id = ?");
            $stmt->execute([$offeringId]);
            $totalTests = (int) $stmt->fetchColumn();

            $incompleteTests = [];
            $canConclude = true;

            if ($totalTests === 0) {
                // Technically can conclude if no tests exist, but might want to warn
                $canConclude = true; // Assuming an empty course can be concluded
            } else {
                $stmt = $this->db->prepare("SELECT COUNT(*) FROM enrollments WHERE offering_id = ? AND enrollment_status != 'Dropped'");
                $stmt->execute([$offeringId]);
                $enrolledStudentsCount = (int) $stmt->fetchColumn();

                if ($enrolledStudentsCount > 0) {
                    $stmt = $this->db->prepare("
                        SELECT t.test_id, t.test_name, COUNT(DISTINCT m.student_roll_no) as marked_students
                        FROM tests t
                        LEFT JOIN marks m ON t.test_id = m.test_id
                        WHERE t.offering_id = ?
                        GROUP BY t.test_id
                    ");
                    $stmt->execute([$offeringId]);
                    $testCompletion = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    foreach ($testCompletion as $test) {
                        if ($test['marked_students'] < $enrolledStudentsCount) {
                            $incompleteTests[] = $test['test_name'];
                        }
                    }

                    if (!empty($incompleteTests)) {
                        $canConclude = false;
                    }
                }
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'data' => [
                    'can_conclude' => $canConclude,
                    'incomplete_tests' => $incompleteTests,
                    'total_tests' => $totalTests
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error checking course completion status: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to check course status']);
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

            // Verify if marks entry is complete
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM tests WHERE offering_id = ?");
            $stmt->execute([$offeringId]);
            $totalTests = (int) $stmt->fetchColumn();

            if ($totalTests > 0) {
                // Get enrolled students count
                $stmt = $this->db->prepare("SELECT COUNT(*) FROM enrollments WHERE offering_id = ? AND enrollment_status != 'Dropped'");
                $stmt->execute([$offeringId]);
                $enrolledStudentsCount = (int) $stmt->fetchColumn();

                if ($enrolledStudentsCount > 0) {
                    $stmt = $this->db->prepare("
                        SELECT t.test_id, t.test_name, COUNT(DISTINCT m.student_roll_no) as marked_students
                        FROM tests t
                        LEFT JOIN marks m ON t.test_id = m.test_id
                        WHERE t.offering_id = ?
                        GROUP BY t.test_id
                    ");
                    $stmt->execute([$offeringId]);
                    $testCompletion = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    $incompleteTests = [];
                    foreach ($testCompletion as $test) {
                        if ($test['marked_students'] < $enrolledStudentsCount) {
                            $incompleteTests[] = $test['test_name'];
                        }
                    }

                    if (!empty($incompleteTests)) {
                        http_response_code(400);
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'message' => 'Marks entry incomplete for tests: ' . implode(', ', $incompleteTests) . '. All enrolled students must have marks entered before concluding the course.']);
                        return;
                    }
                }
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

            // 3. (Temporarily disabled based on user request) Purge raw marks to save space
            // $stmt = $this->db->prepare("
            //     DELETE rm FROM raw_marks rm
            //     INNER JOIN questions q ON rm.question_id = q.question_id
            //     INNER JOIN tests t ON q.test_id = t.test_id
            //     WHERE t.offering_id = ?
            // ");
            // $stmt->execute([$offeringId]);

            $this->db->commit();

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true, 
                'message' => 'Course concluded successfully. Session finalized.'
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