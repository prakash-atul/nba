<?php

/**
 * Assessment Controller
 * Handles assessment-related HTTP requests (courses, tests, questions)
 */
class AssessmentController
{
    private $courseRepository;
    private $testRepository;
    private $questionRepository;
    private $validationMiddleware;
    private $db;

    public function __construct(
        CourseRepository $courseRepository,
        TestRepository $testRepository,
        QuestionRepository $questionRepository,
        ValidationMiddleware $validationMiddleware,
        $db = null
    ) {
        $this->courseRepository = $courseRepository;
        $this->testRepository = $testRepository;
        $this->questionRepository = $questionRepository;
        $this->validationMiddleware = $validationMiddleware;
        $this->db = $db;
    }

    /**
     * Get courses for faculty
     */
    public function getFacultyCourses()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            // Faculty can access their courses (HODs are faculty with is_hod flag)
            if ($userData['role'] !== 'faculty') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty can access courses.'
                ]);
                return;
            }

            $facultyId = $userData['employee_id'];
            $courses = $this->courseRepository->findByFacultyId($facultyId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Courses retrieved successfully',
                'data' => array_map(fn($course) => $course->toArray(), $courses)
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve courses',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create test with questions (assessment)
     */
    public function createAssessment()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty can create assessments.'
                ]);
                return;
            }

            $data = $this->validationMiddleware->getJsonInput();

            if (!$data) {
                throw new Exception("Invalid JSON input");
            }

            // Validate required fields
            if (
                empty($data['course_id']) || empty($data['name']) ||
                empty($data['full_marks']) || !isset($data['pass_marks']) ||
                empty($data['questions'])
            ) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Missing required fields',
                    'required' => ['course_id', 'name', 'full_marks', 'pass_marks', 'questions']
                ]);
                return;
            }

            // Verify course belongs to faculty
            $course = $this->courseRepository->findById($data['course_id']);
            if (!$course || $course->getFacultyId() != $userData['employee_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found or access denied'
                ]);
                return;
            }

            // Validate questions array
            if (!is_array($data['questions']) || count($data['questions']) === 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Questions array must contain at least one question'
                ]);
                return;
            }

            // Create test (pass course info for filename generation)
            $test = new Test(
                null,
                $data['course_id'],
                $data['name'],
                $data['full_marks'],
                $data['pass_marks'],
                isset($data['question_paper_pdf']) ? base64_decode($data['question_paper_pdf']) : null,
                $data['test_type'] ?? null,
                $data['test_date'] ?? null,
                $data['max_marks'] ?? null,
                $data['weightage'] ?? null,
                $course->getCourseCode(),
                $course->getYear(),
                $course->getSemester()
            );

            // Start transaction
            if ($this->db) {
                $this->db->beginTransaction();
            }

            try {
                $this->testRepository->save($test);
                $testId = $test->getTestId();

                // Create questions
                $questions = [];
                foreach ($data['questions'] as $qData) {
                    // Validate required fields for each question
                    if (
                        !isset($qData['question_number']) ||
                        !isset($qData['co']) ||
                        !isset($qData['max_marks'])
                    ) {
                        throw new Exception('Each question must have question_number, co, and max_marks');
                    }

                    $question = new Question(
                        null,
                        $testId,
                        $qData['question_number'],
                        $qData['sub_question'] ?? null,
                        !empty($qData['is_optional']), // Cast to boolean properly
                        $qData['co'],
                        $qData['max_marks']
                    );
                    $questions[] = $question;
                }

                foreach ($questions as $question) {
                    $this->questionRepository->save($question);
                }

                if ($this->db) {
                    $this->db->commit();
                }
            } catch (Exception $e) {
                if ($this->db) {
                    $this->db->rollBack();
                }
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assessment creation failed: ' . $e->getMessage(),
                    'error' => $e->getMessage()
                ]);
                return;
            }

            // Retrieve complete test with questions
            $savedTest = $this->testRepository->findById($testId);
            $savedQuestions = $this->questionRepository->findByTestId($testId);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Assessment created successfully',
                'data' => [
                    'test' => $savedTest->toArray(),
                    'questions' => array_map(fn($q) => $q->toArray(), $savedQuestions)
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create assessment',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get test with questions
     */
    public function getAssessment()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty can access assessments.'
                ]);
                return;
            }

            $testId = isset($_GET['test_id']) ? (int)$_GET['test_id'] : null;

            if (!$testId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Test ID is required'
                ]);
                return;
            }

            $test = $this->testRepository->findById($testId);

            if (!$test) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Test not found'
                ]);
                return;
            }

            // Verify test belongs to faculty's course
            $course = $this->courseRepository->findById($test->getCourseId());
            if (!$course || $course->getFacultyId() != $userData['employee_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied'
                ]);
                return;
            }

            $questions = $this->questionRepository->findByTestId($testId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Assessment retrieved successfully',
                'data' => [
                    'test' => $test->toArray(),
                    'questions' => array_map(fn($q) => $q->toArray(), $questions),
                    'course' => $course->toArray()
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve assessment',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get all tests for a course
     */
    public function getCourseTests()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty can access tests.'
                ]);
                return;
            }

            $courseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : null;

            if (!$courseId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course ID is required'
                ]);
                return;
            }

            // Verify course belongs to faculty
            $course = $this->courseRepository->findById($courseId);
            if (!$course || $course->getFacultyId() != $userData['employee_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found or access denied'
                ]);
                return;
            }

            $tests = $this->testRepository->findByCourseId($courseId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Tests retrieved successfully',
                'data' => [
                    'course' => $course->toArray(),
                    'tests' => array_map(fn($test) => $test->toArray(), $tests)
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve tests',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update question CO mapping
     * PUT /questions/{questionId}
     */
    public function updateQuestion($questionId)
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty can update questions.'
                ]);
                return;
            }

            $data = $this->validationMiddleware->getJsonInput();
            if (!$data) {
                throw new Exception("Invalid JSON input");
            }

            // Find existing question
            $question = $this->questionRepository->findById($questionId);
            if (!$question) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Question not found'
                ]);
                return;
            }

            // Verify test and course belong to faculty
            $test = $this->testRepository->findById($question->getTestId());
            if (!$test) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Test not found'
                ]);
                return;
            }

            $course = $this->courseRepository->findById($test->getCourseId());
            if (!$course || $course->getFacultyId() != $userData['employee_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unauthorized to update this question'
                ]);
                return;
            }

            // Update question properties
            if (isset($data['co'])) {
                $question->setCo($data['co']);
            }
            if (isset($data['max_marks'])) {
                $question->setMaxMarks($data['max_marks']);
            }
            if (isset($data['is_optional'])) {
                $question->setIsOptional($data['is_optional']);
            }

            // Save updated question
            $this->questionRepository->save($question);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Question updated successfully',
                'data' => $question->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update question: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete question
     * DELETE /questions/{questionId}
     */
    public function deleteQuestion($questionId)
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty can delete questions.'
                ]);
                return;
            }

            // Find existing question
            $question = $this->questionRepository->findById($questionId);
            if (!$question) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Question not found'
                ]);
                return;
            }

            // Verify test and course belong to faculty
            $test = $this->testRepository->findById($question->getTestId());
            if (!$test) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Test not found'
                ]);
                return;
            }

            $course = $this->courseRepository->findById($test->getCourseId());
            if (!$course || $course->getFacultyId() != $userData['employee_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unauthorized to delete this question'
                ]);
                return;
            }

            // Delete question
            $this->questionRepository->delete($questionId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Question deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete question: ' . $e->getMessage()
            ]);
        }
    }
}
