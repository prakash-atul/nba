<?php

/**
 * MarksController
 * Handles marks submission and retrieval
 */
class MarksController
{
    private $studentRepository;
    private $rawMarksRepository;
    private $marksRepository;
    private $questionRepository;
    private $testRepository;
    private $validationMiddleware;
    private $courseRepository;

    public function __construct(
        StudentRepository $studentRepository,
        RawMarksRepository $rawMarksRepository,
        MarksRepository $marksRepository,
        QuestionRepository $questionRepository,
        TestRepository $testRepository,
        ValidationMiddleware $validationMiddleware,
        CourseRepository $courseRepository = null
    ) {
        $this->studentRepository = $studentRepository;
        $this->rawMarksRepository = $rawMarksRepository;
        $this->marksRepository = $marksRepository;
        $this->questionRepository = $questionRepository;
        $this->testRepository = $testRepository;
        $this->validationMiddleware = $validationMiddleware;
        $this->courseRepository = $courseRepository;
    }

    /**
     * Send error response
     */
    private function sendError($message, $code = 400)
    {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
    }

    /**
     * Save marks per question (auto-calculates CO totals)
     * POST /marks/by-question
     * Body: {
     *   test_id: 1,
     *   student_id: "CS101",
     *   marks: [
     *     {question_identifier: "1", marks: 5},
     *     {question_identifier: "2a", marks: 3},
     *     {question_identifier: "2b", marks: 2.5}
     *   ]
     * }
     */
    public function saveMarksByQuestion()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $required = ['test_id', 'student_id', 'marks'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    $this->sendError("Missing required field: $field", 400);
                    return;
                }
            }

            $testId = $data['test_id'];
            $studentId = $data['student_id'];
            $marksData = $data['marks'];

            // Validate test exists
            $test = $this->testRepository->findById($testId);
            if (!$test) {
                $this->sendError("Test not found", 404);
                return;
            }

            // Validate student exists
            if (!$this->studentRepository->exists($studentId)) {
                $this->sendError("Student not found", 404);
                return;
            }

            // Get all questions for this test
            $questions = $this->questionRepository->findByTestId($testId);
            $questionMap = [];
            foreach ($questions as $question) {
                $identifier = $question->getQuestionIdentifier();
                $questionMap[$identifier] = $question;
            }

            // Validate and prepare raw marks
            $rawMarksArray = [];
            foreach ($marksData as $markEntry) {
                if (!isset($markEntry['question_identifier']) || !isset($markEntry['marks'])) {
                    $this->sendError("Invalid marks entry format", 400);
                    return;
                }

                $identifier = $markEntry['question_identifier'];
                $marks = $markEntry['marks'];

                // Check if question exists
                if (!isset($questionMap[$identifier])) {
                    $this->sendError("Question '$identifier' not found in test", 404);
                    return;
                }

                $question = $questionMap[$identifier];

                // Validate marks <= max_marks
                if ($marks > $question->getMaxMarks()) {
                    $this->sendError(
                        "Marks for question '$identifier' exceed maximum ({$question->getMaxMarks()})",
                        400
                    );
                    return;
                }

                // Validate marks >= 0
                if ($marks < 0) {
                    $this->sendError("Marks cannot be negative", 400);
                    return;
                }

                $rawMarksArray[] = new RawMarks($testId, $studentId, $question->getQuestionId(), $marks);
            }

            // Save raw marks and calculate CO totals
            $this->rawMarksRepository->saveMultiple($rawMarksArray);
            $coTotals = $this->rawMarksRepository->calculateCOTotals($testId, $studentId);

            // Save aggregated marks
            $marks = new Marks(
                $studentId,
                $testId,
                $coTotals['CO1'],
                $coTotals['CO2'],
                $coTotals['CO3'],
                $coTotals['CO4'],
                $coTotals['CO5'],
                $coTotals['CO6']
            );
            $this->marksRepository->save($marks);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Marks saved successfully',
                'data' => [
                    'student_id' => $studentId,
                    'test_id' => $testId,
                    'co_totals' => $coTotals
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save marks: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Save marks directly by CO (manual entry, no raw marks stored)
     * POST /marks/by-co
     * Body: {
     *   test_id: 1,
     *   student_id: "CS101",
     *   CO1: 10,
     *   CO2: 8.5,
     *   CO3: 15,
     *   CO4: 0,
     *   CO5: 0,
     *   CO6: 0
     * }
     */
    public function saveMarksByCO()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $required = ['test_id', 'student_id'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    $this->sendError("Missing required field: $field", 400);
                    return;
                }
            }

            $testId = $data['test_id'];
            $studentId = $data['student_id'];

            // Validate test exists
            $test = $this->testRepository->findById($testId);
            if (!$test) {
                $this->sendError("Test not found", 404);
                return;
            }

            // Validate student exists
            if (!$this->studentRepository->exists($studentId)) {
                $this->sendError("Student not found", 404);
                return;
            }

            // Extract CO marks (default to 0 if not provided)
            $CO1 = isset($data['CO1']) ? $data['CO1'] : 0;
            $CO2 = isset($data['CO2']) ? $data['CO2'] : 0;
            $CO3 = isset($data['CO3']) ? $data['CO3'] : 0;
            $CO4 = isset($data['CO4']) ? $data['CO4'] : 0;
            $CO5 = isset($data['CO5']) ? $data['CO5'] : 0;
            $CO6 = isset($data['CO6']) ? $data['CO6'] : 0;

            // Validate all CO marks are non-negative
            $coValues = [$CO1, $CO2, $CO3, $CO4, $CO5, $CO6];
            foreach ($coValues as $coValue) {
                if ($coValue < 0) {
                    $this->sendError("CO marks cannot be negative", 400);
                    return;
                }
            }

            // Save marks
            $marks = new Marks($studentId, $testId, $CO1, $CO2, $CO3, $CO4, $CO5, $CO6);
            $this->marksRepository->save($marks);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Marks saved successfully',
                'data' => $marks->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save marks: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get marks for a student in a test
     * GET /marks?test_id=1&student_id=CS101
     */
    public function getMarks()
    {
        try {
            $testId = isset($_GET['test_id']) ? $_GET['test_id'] : null;
            $studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;

            if (!$testId || !$studentId) {
                $this->sendError("Missing test_id or student_id parameter", 400);
                return;
            }

            // Get aggregated marks
            $marks = $this->marksRepository->findByTestAndStudent($testId, $studentId);

            // Get raw marks (per question)
            $rawMarks = $this->rawMarksRepository->findByTestAndStudent($testId, $studentId);

            $response = [
                'success' => true,
                'data' => [
                    'marks' => $marks ? $marks->toArray() : null,
                    'raw_marks' => array_map(function ($item) {
                        $questionIdentifier = $item['question_number'];
                        if ($item['sub_question']) {
                            $questionIdentifier .= $item['sub_question'];
                        }
                        return [
                            'question_identifier' => $questionIdentifier,
                            'marks' => $item['raw_marks']->getMarksObtained(),
                            'co' => $item['co']
                        ];
                    }, $rawMarks)
                ]
            ];

            http_response_code(200);
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve marks: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get all marks for a test (CO aggregated + raw marks)
     * GET /marks/test?test_id={test_id}&include_raw=true
     */
    public function getTestMarks()
    {
        try {
            $testId = isset($_GET['test_id']) ? $_GET['test_id'] : null;
            $includeRaw = isset($_GET['include_raw']) && $_GET['include_raw'] === 'true';

            if (!$testId) {
                $this->sendError("Missing test_id parameter", 400);
                return;
            }

            // Validate test exists
            $test = $this->testRepository->findById($testId);
            if (!$test) {
                $this->sendError("Test not found", 404);
                return;
            }

            // Get authenticated user
            $user = isset($_REQUEST['authenticated_user']) ? $_REQUEST['authenticated_user'] : null;
            if (!$user) {
                $this->sendError("Unauthorized", 401);
                return;
            }

            // Check if user is faculty for this course
            if (!$this->courseRepository) {
                require_once __DIR__ . '/../models/CourseRepository.php';
                // We need to create CourseRepository - get db from another repository
                $this->sendError("Course authorization not available", 500);
                return;
            }

            $course = $this->courseRepository->findById($test->getCourseId());

            if (!$course || $course->getFacultyId() != $user['employee_id']) {
                $this->sendError("You are not authorized to view marks for this test", 403);
                return;
            }

            // Get CO aggregated marks
            $marksList = $this->marksRepository->findByTest($testId);

            $response = [
                'success' => true,
                'data' => [
                    'test' => $test->toArray(),
                    'course' => [
                        'id' => $course->getCourseId(),
                        'course_code' => $course->getCourseCode(),
                        'name' => $course->getCourseName()
                    ],
                    'marks' => array_map(function ($item) {
                        return [
                            'student_id' => $item['marks']->getStudentRollNo(),
                            'student_name' => $item['student_name'],
                            'CO1' => $item['marks']->getCO1(),
                            'CO2' => $item['marks']->getCO2(),
                            'CO3' => $item['marks']->getCO3(),
                            'CO4' => $item['marks']->getCO4(),
                            'CO5' => $item['marks']->getCO5(),
                            'CO6' => $item['marks']->getCO6()
                        ];
                    }, $marksList)
                ]
            ];

            // Include raw marks if requested
            if ($includeRaw) {
                // Get all questions for this test
                $questions = $this->questionRepository->findByTestId($testId);
                $questionMap = [];
                foreach ($questions as $question) {
                    $questionMap[$question->getQuestionId()] = $question;
                }

                // Get raw marks for all students
                $rawMarksData = [];
                foreach ($marksList as $item) {
                    $studentId = $item['marks']->getStudentRollNo();
                    $rawMarks = $this->rawMarksRepository->findByTestAndStudent($testId, $studentId);

                    $studentRawMarks = [];
                    foreach ($rawMarks as $rawMark) {
                        $question = isset($questionMap[$rawMark['raw_marks']->getQuestionId()])
                            ? $questionMap[$rawMark['raw_marks']->getQuestionId()]
                            : null;

                        if ($question) {
                            $studentRawMarks[] = [
                                'question_id' => $rawMark['raw_marks']->getQuestionId(),
                                'question_number' => $rawMark['question_number'],
                                'sub_question' => $rawMark['sub_question'],
                                'question_identifier' => $question->getQuestionIdentifier(),
                                'marks_obtained' => $rawMark['raw_marks']->getMarksObtained(),
                                'max_marks' => $question->getMaxMarks(),
                                'co' => $rawMark['co']
                            ];
                        }
                    }

                    $rawMarksData[] = [
                        'student_id' => $studentId,
                        'student_name' => $item['student_name'],
                        'raw_marks' => $studentRawMarks
                    ];
                }

                $response['data']['raw_marks'] = $rawMarksData;
                $response['data']['questions'] = array_map(function ($q) {
                    return [
                        'id' => $q->getQuestionId(),
                        'question_number' => $q->getQuestionNumber(),
                        'sub_question' => $q->getSubQuestion(),
                        'question_identifier' => $q->getQuestionIdentifier(),
                        'max_marks' => $q->getMaxMarks(),
                        'co' => $q->getCo(),
                        'is_optional' => $q->getIsOptional()
                    ];
                }, $questions);
            }

            http_response_code(200);
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve test marks: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Bulk save marks for multiple students
     * POST /marks/bulk
     * Body: {
     *   test_id: 1,
     *   marks_entries: [
     *     {
     *       student_rollno: "CS101",
     *       question_number: 1,
     *       sub_question: null,
     *       marks_obtained: 5.0
     *     },
     *     {
     *       student_rollno: "CS101",
     *       question_number: 2,
     *       sub_question: "a",
     *       marks_obtained: 3.5
     *     },
     *     {
     *       student_rollno: "CS102",
     *       question_number: 1,
     *       sub_question: null,
     *       marks_obtained: 4.0
     *     }
     *   ]
     * }
     */
    public function bulkSaveMarks()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            if (!isset($data['test_id'])) {
                $this->sendError("Missing required field: test_id", 400);
                return;
            }

            if (!isset($data['marks_entries']) || !is_array($data['marks_entries'])) {
                $this->sendError("marks_entries must be an array", 400);
                return;
            }

            if (empty($data['marks_entries'])) {
                $this->sendError("marks_entries array cannot be empty", 400);
                return;
            }

            $testId = $data['test_id'];
            $marksEntries = $data['marks_entries'];

            // Validate test exists
            $test = $this->testRepository->findById($testId);
            if (!$test) {
                $this->sendError("Test not found", 404);
                return;
            }

            // Get all questions for this test
            $questions = $this->questionRepository->findByTestId($testId);
            if (empty($questions)) {
                $this->sendError("No questions found for this test", 400);
                return;
            }

            // Create a map for quick question lookup
            $questionMap = [];
            foreach ($questions as $question) {
                $key = $question->getQuestionNumber();
                if ($question->getSubQuestion()) {
                    $key .= '_' . $question->getSubQuestion();
                }
                $questionMap[$key] = $question;
            }

            // Track results
            $results = [
                'successful' => [],
                'failed' => [],
                'total' => count($marksEntries),
                'success_count' => 0,
                'failure_count' => 0
            ];

            // Track students for CO aggregation
            $studentsProcessed = [];

            // Process each marks entry
            foreach ($marksEntries as $index => $entry) {
                // Validate entry structure
                if (
                    !isset($entry['student_rollno']) || !isset($entry['question_number']) ||
                    !isset($entry['marks_obtained'])
                ) {
                    $results['failed'][] = [
                        'index' => $index,
                        'entry' => $entry,
                        'reason' => 'Missing required fields (student_rollno, question_number, or marks_obtained)'
                    ];
                    $results['failure_count']++;
                    continue;
                }

                $studentRollno = trim($entry['student_rollno']);
                $questionNumber = $entry['question_number'];
                $subQuestion = isset($entry['sub_question']) ? trim($entry['sub_question']) : null;
                $marksObtained = $entry['marks_obtained'];

                // Normalize empty string to null for sub_question
                if ($subQuestion === '' || $subQuestion === 'null') {
                    $subQuestion = null;
                }

                try {
                    // Validate student exists
                    $student = $this->studentRepository->findByRollno($studentRollno);
                    if (!$student) {
                        $results['failed'][] = [
                            'index' => $index,
                            'entry' => $entry,
                            'reason' => "Student with rollno '$studentRollno' not found"
                        ];
                        $results['failure_count']++;
                        continue;
                    }

                    // Find the question
                    $questionKey = $questionNumber;
                    if ($subQuestion) {
                        $questionKey .= '_' . strtolower($subQuestion);
                    }

                    if (!isset($questionMap[$questionKey])) {
                        $results['failed'][] = [
                            'index' => $index,
                            'entry' => $entry,
                            'reason' => "Question $questionNumber" . ($subQuestion ? $subQuestion : '') . " not found in this test"
                        ];
                        $results['failure_count']++;
                        continue;
                    }

                    $question = $questionMap[$questionKey];

                    // Validate marks
                    if (!is_numeric($marksObtained) || $marksObtained < 0) {
                        $results['failed'][] = [
                            'index' => $index,
                            'entry' => $entry,
                            'reason' => 'Marks must be a non-negative number'
                        ];
                        $results['failure_count']++;
                        continue;
                    }

                    if ($marksObtained > $question->getMaxMarks()) {
                        $results['failed'][] = [
                            'index' => $index,
                            'entry' => $entry,
                            'reason' => "Marks obtained ($marksObtained) exceeds maximum marks ({$question->getMaxMarks()})"
                        ];
                        $results['failure_count']++;
                        continue;
                    }

                    // Save raw marks
                    $rawMarks = new RawMarks(
                        $testId,
                        $studentRollno,
                        $question->getQuestionId(),
                        $marksObtained,
                        null
                    );

                    $this->rawMarksRepository->save($rawMarks);

                    // Track student for CO aggregation
                    $studentsProcessed[$studentRollno] = true;

                    $results['successful'][] = [
                        'index' => $index,
                        'student_rollno' => $studentRollno,
                        'question' => $question->getQuestionIdentifier(),
                        'marks_obtained' => $marksObtained,
                        'max_marks' => $question->getMaxMarks()
                    ];
                    $results['success_count']++;
                } catch (Exception $e) {
                    $results['failed'][] = [
                        'index' => $index,
                        'entry' => $entry,
                        'reason' => 'Error: ' . $e->getMessage()
                    ];
                    $results['failure_count']++;
                }
            }

            // Aggregate CO marks for all processed students
            foreach (array_keys($studentsProcessed) as $studentRollno) {
                try {
                    $this->marksRepository->aggregateFromRawMarks($testId, $studentRollno);
                } catch (Exception $e) {
                    // Log but don't fail the entire operation
                    error_log("Failed to aggregate CO marks for student $studentRollno: " . $e->getMessage());
                }
            }

            // Return results
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => "Marks entry completed: {$results['success_count']} successful, {$results['failure_count']} failed",
                'data' => $results
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save marks: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update individual marks entry
     * PUT /marks/raw/{rawMarksId}
     */
    public function updateRawMarks($rawMarksId)
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty' && $userData['role'] !== 'hod') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty and HOD can update marks.'
                ]);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['marks_obtained'])) {
                $this->sendError("marks_obtained is required", 400);
                return;
            }

            // Find existing raw marks
            $rawMarks = $this->rawMarksRepository->findById($rawMarksId);
            if (!$rawMarks) {
                $this->sendError("Marks entry not found", 404);
                return;
            }

            // Verify authorization - check if test belongs to faculty's course
            $test = $this->testRepository->findById($rawMarks->getTestId());
            if (!$test) {
                $this->sendError("Test not found", 404);
                return;
            }

            if (!$this->courseRepository) {
                $this->sendError("Course authorization not available", 500);
                return;
            }

            $course = $this->courseRepository->findById($test->getCourseId());
            if (!$course || $course->getFacultyId() != $userData['employee_id']) {
                $this->sendError("Unauthorized to update marks for this test", 403);
                return;
            }

            // Validate new marks
            $question = $this->questionRepository->findById($rawMarks->getQuestionId());
            if (!$question) {
                $this->sendError("Question not found", 404);
                return;
            }

            $marksObtained = $data['marks_obtained'];
            if (!is_numeric($marksObtained) || $marksObtained < 0) {
                $this->sendError("Marks must be a non-negative number", 400);
                return;
            }

            if ($marksObtained > $question->getMaxMarks()) {
                $this->sendError("Marks obtained ($marksObtained) exceeds maximum marks ({$question->getMaxMarks()})", 400);
                return;
            }

            // Update marks
            $rawMarks->setMarksObtained($marksObtained);
            $this->rawMarksRepository->update($rawMarks);

            // Re-aggregate CO marks for this student
            $this->marksRepository->aggregateFromRawMarks($rawMarks->getTestId(), $rawMarks->getStudentId());

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Marks updated successfully',
                'data' => [
                    'raw_marks' => $rawMarks->toArray(),
                    'question' => $question->toArray()
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update marks: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete marks entry
     * DELETE /marks/raw/{rawMarksId}
     */
    public function deleteRawMarks($rawMarksId)
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty' && $userData['role'] !== 'hod') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty and HOD can delete marks.'
                ]);
                return;
            }

            // Find existing raw marks
            $rawMarks = $this->rawMarksRepository->findById($rawMarksId);
            if (!$rawMarks) {
                $this->sendError("Marks entry not found", 404);
                return;
            }

            // Verify authorization
            $test = $this->testRepository->findById($rawMarks->getTestId());
            if (!$test) {
                $this->sendError("Test not found", 404);
                return;
            }

            if (!$this->courseRepository) {
                $this->sendError("Course authorization not available", 500);
                return;
            }

            $course = $this->courseRepository->findById($test->getCourseId());
            if (!$course || $course->getFacultyId() != $userData['employee_id']) {
                $this->sendError("Unauthorized to delete marks for this test", 403);
                return;
            }

            $testId = $rawMarks->getTestId();
            $studentId = $rawMarks->getStudentId();

            // Delete marks
            $this->rawMarksRepository->delete($rawMarksId);

            // Re-aggregate CO marks for this student
            $this->marksRepository->aggregateFromRawMarks($testId, $studentId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Marks entry deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete marks: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete all marks for a student in a test
     * DELETE /marks/student/{testId}/{studentId}
     */
    public function deleteStudentMarks($testId, $studentId)
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty' && $userData['role'] !== 'hod') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty and HOD can delete marks.'
                ]);
                return;
            }

            // Verify authorization
            $test = $this->testRepository->findById($testId);
            if (!$test) {
                $this->sendError("Test not found", 404);
                return;
            }

            if (!$this->courseRepository) {
                $this->sendError("Course authorization not available", 500);
                return;
            }

            $course = $this->courseRepository->findById($test->getCourseId());
            if (!$course || $course->getFacultyId() != $userData['employee_id']) {
                $this->sendError("Unauthorized to delete marks for this test", 403);
                return;
            }

            // Delete all raw marks for this student in this test
            $this->rawMarksRepository->deleteByTestAndStudent($testId, $studentId);

            // Delete aggregated CO marks
            $this->marksRepository->deleteByTestAndStudent($testId, $studentId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'All marks for student deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete student marks: ' . $e->getMessage()
            ]);
        }
    }
}
