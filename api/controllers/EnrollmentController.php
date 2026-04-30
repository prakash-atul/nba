<?php

require_once __DIR__ . '/../models/EnrollmentRepository.php';
require_once __DIR__ . '/../models/CourseRepository.php';
require_once __DIR__ . '/../models/CourseOfferingRepository.php';
require_once __DIR__ . '/../models/CourseFacultyAssignmentRepository.php';
require_once __DIR__ . '/../models/StudentRepository.php';
require_once __DIR__ . '/../models/UserRepository.php';

class EnrollmentController
{
    protected $auditService;

    private $enrollmentRepo;
    private $courseRepo;
    private $offeringRepo;
    private $assignmentRepo;
    private $studentRepo;
    private $userRepo;
    private $pdo;

    public function __construct($pdo, ?AuditService $auditService = null)
    {
        $this->auditService = $auditService;

        $this->pdo = $pdo;
        $this->enrollmentRepo = new EnrollmentRepository($pdo);
        $this->courseRepo = new CourseRepository($pdo);
        $this->offeringRepo = new CourseOfferingRepository($pdo);
        $this->assignmentRepo = new CourseFacultyAssignmentRepository($pdo);
        $this->studentRepo = new StudentRepository($pdo);
        $this->userRepo = new UserRepository($pdo);
    }

    /**
     * Check whether a user can operate on a course offering.
     * Faculty: must be directly assigned. HOD: direct assignment OR the
     * offering's course belongs to their department.
     */
    private function isOfferingAccessAllowed($offeringId, $userId): bool
    {
        // 1. Direct faculty/HOD assignment
        if ($this->assignmentRepo->isFacultyAssignedToOffering($offeringId, $userId)) {
            return true;
        }
        // 2. HOD department fallback
        $user = $this->userRepo->findByEmployeeId($userId);
        if ($user && strtolower($user->getRole() ?? '') === 'hod') {
            $offering = $this->offeringRepo->findById($offeringId);
            if ($offering) {
                $course = $this->courseRepo->findById($offering->getCourseId());
                if ($course && $course->getDepartmentId() == $user->getDepartmentId()) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * POST /offerings/{offeringId}/enroll
     * Bulk enroll students in a course offering
     * 
     * Request body:
     * {
     *   "students": [
     *     {"rollno": "CS101", "name": "John Doe"},
     *     {"rollno": "CS102", "name": "Jane Smith"}
     *   ]
     * }
     */
    public function bulkEnroll($offeringId, $userId)
    {
        try {
            // Get request body
            $data = json_decode(file_get_contents('php://input'), true);

            // Validate students array
            if (!isset($data['students']) || !is_array($data['students'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'students array is required'
                ]);
                return;
            }

            if (empty($data['students'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'students array cannot be empty'
                ]);
                return;
            }

            // Verify offering exists
            $offering = $this->offeringRepo->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering not found'
                ]);
                return;
            }

            // Check if the authenticated user is authorized for this offering
            if (!$this->isOfferingAccessAllowed($offeringId, $userId)) {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('EnrollmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to enroll students in this course offering'
                ]);
                return;
            }

            // Get course details for department info
            $course = $this->courseRepo->findById($offering->getCourseId());
            if (!$course) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course template not found'
                ]);
                return;
            }

            // Validate each student entry
            $validatedStudents = [];
            foreach ($data['students'] as $index => $student) {
                if (!isset($student['rollno']) || !isset($student['name'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => "Student at index $index missing rollno or name"
                    ]);
                    return;
                }

                $rollno = trim($student['rollno']);
                $name = trim($student['name']);

                if (empty($rollno) || empty($name)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => "Student at index $index has empty rollno or name"
                    ]);
                    return;
                }

                // Check if student exists in database, if not create them
                $existingStudent = $this->studentRepo->findByRollno($rollno);
                if (!$existingStudent) {
                    // Get faculty user to get department (use course's department)
                    $faculty = $this->userRepo->findByEmployeeId($userId);
                    if (!$faculty) {
                        http_response_code(500);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Faculty not found'
                        ]);
                        return;
                    }

                    // Create new student with course's department
                    $departmentId = $course->getDepartmentId() ?? $faculty->getDepartmentId();
                    $student = new Student($rollno, $name, $departmentId);
                    $this->studentRepo->save($student);
                }

                $validatedStudents[] = [
                    'rollno' => $rollno,
                    'name' => $name
                ];
            }

            // Perform bulk enrollment
            $results = $this->enrollmentRepo->bulkEnrollStudents($offeringId, $validatedStudents);

            // Return results
            http_response_code(200);
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('CREATE', 'bulkEnroll', null, null, $auditPayload);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'EnrollmentController', 'CREATE operation successful in bulkEnroll');
            }
            echo json_encode([
                'success' => true,
                'message' => "Enrollment completed: {$results['success_count']} successful, {$results['failure_count']} failed",
                'data' => $results
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * GET /offerings/{offeringId}/enrollments
     * Get all students enrolled in a course offering (with optional test_id for marks entry context)
     */
    public function getEnrollments($offeringId, $userId)
    {
        try {
            // Verify offering exists
            $offering = $this->offeringRepo->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering not found'
                ]);
                return;
            }

            // Check if the authenticated user is authorized for this offering
            if (!$this->isOfferingAccessAllowed($offeringId, $userId)) {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('EnrollmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to view enrollments for this course offering'
                ]);
                return;
            }

            // Get course details
            $course = $this->courseRepo->findById($offering->getCourseId());
            if (!$course) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course template not found'
                ]);
                return;
            }

            // Get enrollments
            $enrollments = $this->enrollmentRepo->findByOfferingId($offeringId);
            $count = count($enrollments);

            // Check if test_id is provided for marks entry context
            $testId = isset($_GET['test_id']) ? $_GET['test_id'] : null;
            $testInfo = null;

            if ($testId) {
                // Include test information and questions for marks entry
                require_once __DIR__ . '/../models/TestRepository.php';
                require_once __DIR__ . '/../models/QuestionRepository.php';

                $testRepo = new TestRepository($this->pdo);
                $questionRepo = new QuestionRepository($this->pdo);

                $test = $testRepo->findById($testId);
                if ($test && $test->getOfferingId() == $offeringId) {
                    $questions = $questionRepo->findByTestId($testId);
                    $testInfo = [
                        'test_id' => $testId,
                        'test_name' => $test->getTestName(),
                        'full_marks' => $test->getFullMarks(),
                        'questions' => array_map(function ($q) {
                            return [
                                'id' => $q->getQuestionId(),
                                'question_number' => $q->getQuestionNumber(),
                                'sub_question' => $q->getSubQuestion(),
                                'question_identifier' => $q->getQuestionIdentifier(),
                                'max_marks' => $q->getMaxMarks(),
                                'co' => $q->getCo(),
                                'is_optional' => $q->getIsOptional()
                            ];
                        }, $questions)
                    ];
                }
            }

            $response = [
                'success' => true,
                'message' => "Found $count enrolled students",
                'data' => [
                    'offering_id' => $offeringId,
                    'course_id' => $offering->getCourseId(),
                    'course_code' => $course->getCourseCode(),
                    'course_name' => $course->getCourseName(),
                    'year' => $offering->getYear(),
                    'semester' => $offering->getSemester(),
                    'enrollment_count' => $count,
                    'enrollments' => $enrollments
                ]
            ];

            if ($testInfo) {
                $response['data']['test_info'] = $testInfo;
            }

            http_response_code(200);
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * DELETE /offerings/{offeringId}/enroll/{rollno}
     * Remove a student from a course offering
     */
    public function removeEnrollment($offeringId, $rollno, $userId)
    {
        try {
            // Verify offering exists
            $offering = $this->offeringRepo->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering not found'
                ]);
                return;
            }

            // Check if the authenticated user is authorized for this offering
            if (!$this->isOfferingAccessAllowed($offeringId, $userId)) {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('EnrollmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to remove enrollments from this course offering'
                ]);
                return;
            }

            // Check if student is enrolled
            if (!$this->enrollmentRepo->isEnrolled($offeringId, $rollno)) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student is not enrolled in this course offering'
                ]);
                return;
            }

            // Remove enrollment
            $this->enrollmentRepo->removeEnrollment($offeringId, $rollno);

            http_response_code(200);
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('CREATE', 'removeEnrollment', null, null, $auditPayload);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'EnrollmentController', 'CREATE operation successful in removeEnrollment');
            }
            echo json_encode([
                'success' => true,
                'message' => 'Student removed from course offering successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
        }
    }
}
