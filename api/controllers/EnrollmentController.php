<?php

require_once __DIR__ . '/../models/EnrollmentRepository.php';
require_once __DIR__ . '/../models/CourseRepository.php';
require_once __DIR__ . '/../models/StudentRepository.php';
require_once __DIR__ . '/../models/UserRepository.php';

class EnrollmentController
{
    private $enrollmentRepo;
    private $courseRepo;
    private $studentRepo;
    private $userRepo;
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->enrollmentRepo = new EnrollmentRepository($pdo);
        $this->courseRepo = new CourseRepository($pdo);
        $this->studentRepo = new StudentRepository($pdo);
        $this->userRepo = new UserRepository($pdo);
    }

    /**
     * POST /courses/{courseId}/enroll
     * Bulk enroll students in a course
     * 
     * Request body:
     * {
     *   "students": [
     *     {"rollno": "CS101", "name": "John Doe"},
     *     {"rollno": "CS102", "name": "Jane Smith"}
     *   ]
     * }
     */
    public function bulkEnroll($courseId, $userId)
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

            // Verify course exists and belongs to this faculty
            $course = $this->courseRepo->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found'
                ]);
                return;
            }

            // Check if the authenticated user is the faculty for this course
            if ($course->getFacultyId() != $userId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to enroll students in this course'
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
                    // Get faculty user to get department
                    $faculty = $this->userRepo->findByEmployeeId($course->getFacultyId());
                    if (!$faculty) {
                        http_response_code(500);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Faculty not found for this course'
                        ]);
                        return;
                    }

                    // Create new student with the same department as faculty
                    $student = new Student($rollno, $name, $faculty->getDepartmentId());
                    $this->studentRepo->save($student);
                }

                $validatedStudents[] = [
                    'rollno' => $rollno,
                    'name' => $name
                ];
            }

            // Perform bulk enrollment
            $results = $this->enrollmentRepo->bulkEnrollStudents($courseId, $validatedStudents);

            // Return results
            http_response_code(200);
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
     * GET /courses/{courseId}/enrollments
     * Get all students enrolled in a course (with optional test_id for marks entry context)
     */
    public function getEnrollments($courseId, $userId)
    {
        try {
            // Verify course exists and belongs to this faculty
            $course = $this->courseRepo->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found'
                ]);
                return;
            }

            // Check if the authenticated user is the faculty for this course
            if ($course->getFacultyId() != $userId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to view enrollments for this course'
                ]);
                return;
            }

            // Get enrollments
            $enrollments = $this->enrollmentRepo->findByCourseId($courseId);
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
                if ($test && $test->getCourseId() == $courseId) {
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
                    'course_id' => $courseId,
                    'course_code' => $course->getCourseCode(),
                    'course_name' => $course->getCourseName(),
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
     * DELETE /courses/{courseId}/enroll/{rollno}
     * Remove a student from a course
     */
    public function removeEnrollment($courseId, $rollno, $userId)
    {
        try {
            // Verify course exists and belongs to this faculty
            $course = $this->courseRepo->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found'
                ]);
                return;
            }

            // Check if the authenticated user is the faculty for this course
            if ($course->getFacultyId() != $userId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to remove enrollments from this course'
                ]);
                return;
            }

            // Check if student is enrolled
            if (!$this->enrollmentRepo->isEnrolled($courseId, $rollno)) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student is not enrolled in this course'
                ]);
                return;
            }

            // Remove enrollment
            $this->enrollmentRepo->removeEnrollment($courseId, $rollno);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Student removed from course successfully'
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
