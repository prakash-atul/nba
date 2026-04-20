<?php

/**
 * Assessment Controller
 * Handles assessment-related HTTP requests (courses, tests, questions)
 */
class AssessmentController
{
    protected $auditService;

    private $courseRepository;
    private $courseOfferingRepository;
    private $assignmentRepository;
    private $testRepository;
    private $questionRepository;
    private $validationMiddleware;
    private $db;

    public function __construct(
        CourseRepository $courseRepository,
        CourseOfferingRepository $courseOfferingRepository,
        TestRepository $testRepository,
        QuestionRepository $questionRepository,
        ValidationMiddleware $validationMiddleware,
        $db = null,
        ?CourseFacultyAssignmentRepository $assignmentRepository = null
    , ?AuditService $auditService = null) {
        $this->auditService = $auditService;

        $this->courseRepository = $courseRepository;
        $this->courseOfferingRepository = $courseOfferingRepository;
        $this->testRepository = $testRepository;
        $this->questionRepository = $questionRepository;
        $this->validationMiddleware = $validationMiddleware;
        $this->db = $db;
        $this->assignmentRepository = $assignmentRepository;
    }

    /**
     * Check if a user can access a course offering.
     * Faculty: must be assigned; HOD: must own the department.
     * Returns an array with 'allowed' (bool) and course metadata, or false.
     */
    private function checkOfferingAccess($userData, $offeringId)
    {
        $role = $userData['role'];

        // Try faculty assignment (works for both faculty and HOD who is also assigned)
        $assignments = $this->courseOfferingRepository->findByFacultyId($userData['employee_id']);
        foreach ($assignments as $a) {
            if ($a['offering_id'] == $offeringId) {
                return [
                    'allowed'     => true,
                    'course_code' => $a['course_code'],
                    'course_name' => $a['course_name'],
                    'credit'      => $a['credit'],
                    'year'        => $a['year'],
                    'semester'    => $a['semester'],
                ];
            }
        }

        // HOD fallback: course belongs to their department
        if ($role === 'hod') {
            $offering = $this->courseOfferingRepository->findById($offeringId);
            if ($offering) {
                $course = $this->courseRepository->findById($offering->getCourseId());
                if ($course && $course->getDepartmentId() == $userData['department_id']) {
                    return [
                        'allowed'     => true,
                        'course_code' => $course->getCourseCode(),
                        'course_name' => $course->getCourseName(),
                        'credit'      => $course->getCredit(),
                        'year'        => $offering->getYear(),
                        'semester'    => $offering->getSemester(),
                    ];
                }
            }
        }

        return ['allowed' => false];
    }

    /**
     * Get courses (offerings) for faculty
     */
            public function getFacultyCourses()
    {
        try {
            $userData = $_REQUEST["authenticated_user"];

            if ($userData["role"] !== "faculty" && $userData["role"] !== "hod" && $userData["role"] !== "dean") {
                if (isset($GLOBALS["fileLogger"])) { $GLOBALS["fileLogger"]->warn("AssessmentController", "Unauthorized access attempt", ["user" => $_REQUEST["authenticated_user"] ?? "anonymous"]); }
                http_response_code(403);
                echo json_encode([
                    "success" => false,
                    "message" => "Access denied. Only faculty can access courses."
                ]);
                return;
            }

            $facultyId = $userData["employee_id"];

            // Parse pagination parameters
            $params = PaginationHelper::parseParams($_GET, "offering_id", "year", ["year", "semester", "course_code", "course_name", "offering_id"], ["course_id", "department_id", "semester", "year", "is_active"]);

            $isHod = ($userData["role"] === "hod");

            if ($isHod) {
                $departmentId = $userData["department_id"];
                $totalCount = $this->courseOfferingRepository->countByDepartmentPaginated($departmentId, $params);
                $offerings = $this->courseOfferingRepository->findByDepartmentPaginated($departmentId, $params);
            } else {
                $totalCount = $this->courseOfferingRepository->countByFacultyPaginated($facultyId, $params);
                $offerings = $this->courseOfferingRepository->findByFacultyPaginated($facultyId, $params);
            }

            $result = PaginationHelper::buildResponse($offerings, 'offering_id', $params['limit'], $totalCount);

              http_response_code(200);
              echo json_encode(array_merge(['success' => true, 'message' => 'Course offerings retrieved successfully'], $result));
        } catch (Exception $e) {
            if (isset($GLOBALS["fileLogger"])) { $GLOBALS["fileLogger"]->error("AssessmentController", "getFacultyCourses prompt", ["error" => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to retrieve courses",
                "error" => $e->getMessage()
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

            if ($userData['role'] !== 'faculty' && $userData['role'] !== 'hod') {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('AssessmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty or HOD can create assessments.'
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

            // Verify offering belongs to faculty
            $offering = $this->courseOfferingRepository->findById($data['course_id']);
            $GLOBALS['audit_old_state'] = (isset($offering) && is_object($offering) && method_exists($offering, 'toArray')) ? $offering->toArray() : (isset($offering) ? clone $offering : null); // course_id from legacy frontend is offering_id
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering not found'
                ]);
                return;
            }

            // Verify access (faculty assignment or HOD department ownership)
            $access = $this->checkOfferingAccess($userData, $data['course_id']);
            if (!$access['allowed']) {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('AssessmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You are not assigned to this course offering.'
                ]);
                return;
            }
            $courseCode = $access['course_code'];
            $year = $access['year'];
            $semester = $access['semester'];

            // Validate questions array
            if (!is_array($data['questions']) || count($data['questions']) === 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Questions array must contain at least one question'
                ]);
                return;
            }

            // Create test (pass offering info for filename generation)
            $test = new Test(
                null,
                $data['course_id'], // offering_id
                $data['name'],
                $data['full_marks'],
                $data['pass_marks'],
                isset($data['question_paper_pdf']) ? base64_decode($data['question_paper_pdf']) : null,
                $data['test_type'] ?? null,
                $data['test_date'] ?? null,
                $data['max_marks'] ?? null,
                $data['weightage'] ?? null,
                $courseCode,
                $year,
                $semester
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
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('CREATE', 'Assessment', null, null, $auditPayload);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'AssessmentController', 'CREATE operation successful in createAssessment');
            }
            echo json_encode([
                'success' => true,
                'message' => 'Assessment created successfully',
                'data' => [
                    'test' => $savedTest->toArray(),
                    'questions' => array_map(fn($q) => $q->toArray(), $savedQuestions)
                ]
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('AssessmentController', 'createAssessment prompt', ['error' => $e->getMessage()]); }
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

            if ($userData['role'] !== 'faculty' && $userData['role'] !== 'hod') {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('AssessmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty or HOD can access assessments.'
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

            // Verify test belongs to faculty's assigned offering
            $offering = $this->courseOfferingRepository->findById($test->getOfferingId());
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Offering not found'
                ]);
                return;
            }

            // Verify access (faculty assignment or HOD department ownership)
            $access = $this->checkOfferingAccess($userData, $offering->getOfferingId());
            if ($access['allowed'] === false) {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('AssessmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied'
                ]);
                return;
            }
            $courseData = [
                'id'          => $offering->getOfferingId(),
                'course_id'   => $offering->getCourseId(),
                'course_code' => $access['course_code'],
                'course_name' => $access['course_name'],
                'credit'      => $access['credit'],
                'year'        => $offering->getYear(),
                'semester'    => $offering->getSemester(),
            ];

            $questions = $this->questionRepository->findByTestId($testId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Assessment retrieved successfully',
                'data' => [
                    'test' => $test->toArray(),
                    'questions' => array_map(fn($q) => $q->toArray(), $questions),
                    'course' => $courseData
                ]
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('AssessmentController', 'getAssessment prompt', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve assessment',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get all tests for a course offering
     */
    public function getCourseTests()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            if ($userData['role'] !== 'faculty' && $userData['role'] !== 'hod' && $userData['role'] !== 'dean') {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('AssessmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied.'
                ]);
                return;
            }

            $id = isset($_GET['course_id']) ? (int)$_GET['course_id'] : null;

            if (!$id) {
                if (isset($GLOBALS['fileLogger'])) $GLOBALS['fileLogger']->debug('AssessmentController', 'getCourseTests invoked without ID', ['role' => $userData['role']]);
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course/Offering ID is required'
                ]);
                return;
            }

            // Determine if the ID is a course_id or offering_id
            $isOffering = false;
            $offering = null;
            $course = null;
            $accessAllowed = false;

            // We must try BOTH interpretations because the frontend sends a generic ID,
            // and an ID might exist in both `courses` (e.g. course_id=9) and `course_offerings` (offering_id=9).
            // Only one of them will typically pass authorization for the current user.
            $candidates = [];

            // 1. Try as offering
            $optOffering = $this->courseOfferingRepository->findById($id);
            if ($optOffering) {
                $optCourse = $this->courseRepository->findById($optOffering->getCourseId());
                if ($optCourse) {
                    $candidates[] = ['isOffering' => true, 'offering' => $optOffering, 'course' => $optCourse];
                }
            }

            // 2. Try as direct course
            $optCourseDirect = $this->courseRepository->findById($id);
            if ($optCourseDirect) {
                $candidates[] = ['isOffering' => false, 'offering' => null, 'course' => $optCourseDirect];
            }

            if (empty($candidates)) {
                 if (isset($GLOBALS['fileLogger'])) $GLOBALS['fileLogger']->error('AssessmentController', 'Course/Offering not found completely', ['id' => $id]);
                 http_response_code(404);
                 echo json_encode([
                     'success' => false,
                     'message' => 'Course/Offering not found'
                 ]);
                 return;
            }

            // Verify Access among candidates
            foreach ($candidates as $candidate) {
                $cCourse = $candidate['course'];
                $cIsOffering = $candidate['isOffering'];
                $cAccess = false;

                if ($userData['role'] === 'admin' || $userData['role'] === 'dean') {
                    $cAccess = true;
                } elseif ($userData['role'] === 'hod') {
                    if ($cCourse->getDepartmentId() == $userData['department_id']) {
                        $cAccess = true;
                    }
                } else {
                    // Faculty role - must be explicitly assigned
                    $assignments = $this->courseOfferingRepository->findByFacultyId($userData['employee_id']);
                    foreach ($assignments as $a) {
                        if ($cIsOffering && $a['offering_id'] == $id) {
                            $cAccess = true;
                            break;
                        } elseif (!$cIsOffering && $a['course_id'] == $id) {
                            $cAccess = true;
                            break;
                        }
                    }
                }

                if ($cAccess) {
                    $accessAllowed = true;
                    $isOffering = $cIsOffering;
                    $offering = $candidate['offering'];
                    $course = $cCourse;
                    break;
                }
            }

            if (!$accessAllowed) {
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('AssessmentController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
                if (isset($GLOBALS['fileLogger'])) $GLOBALS['fileLogger']->error('AssessmentController', 'Access denied to course/offering (exhausted all candidates)', ['id' => $id, 'user' => $userData]);
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied to this course/offering'
                ]);
                return;
            }

            // Retrieve tests
            if ($isOffering) {
                $tests = $this->testRepository->findByOfferingId($id);
            } else {
                // If it's a course_id without a specific offering, either get all tests for all offerings, or just return tests for latest offering.
                // Since this is for CO-PO mapping overview, fetching all tests for the course makes sense, 
                // or we could just fetch offerings and test for them. The testRepository might not have findByCourseId.
                // Let's manually fetch all offerings and then tests, or adapt.
                $offerings = $this->courseOfferingRepository->findByCourseId($id);
                $tests = [];
                foreach ($offerings as $off) {
                    $offeringTests = $this->testRepository->findByOfferingId($off['offering_id']);
                    $tests = array_merge($tests, $offeringTests);
                }
            }

            // Build response data
            if ($isOffering && $offering) {
                $offeringData = [
                    'allowed'     => true,
                    'course_code' => $course->getCourseCode(),
                    'course_name' => $course->getCourseName(),
                    'credit'      => $course->getCredit(),
                    'year'        => $offering->getYear(),
                    'semester'    => $offering->getSemester()
                ];
            } else {
                $offeringData = [
                    'allowed'     => true,
                    'course_code' => $course->getCourseCode(),
                    'course_name' => $course->getCourseName(),
                    'credit'      => $course->getCredit(),
                    'year'        => 'All',
                    'semester'    => 'All'
                ];
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Tests retrieved successfully',
                'data' => [
                    'offering' => $offeringData,
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

            if ($userData['role'] !== 'faculty' && $userData['role'] !== 'hod') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty or HOD can update questions.'
                ]);
                return;
            }

            $data = $this->validationMiddleware->getJsonInput();
            if (!$data) {
                throw new Exception("Invalid JSON input");
            }

            // Find existing question
            $question = $this->questionRepository->findById($questionId);
            $GLOBALS['audit_old_state'] = (isset($question) && is_object($question) && method_exists($question, 'toArray')) ? $question->toArray() : (isset($question) ? clone $question : null);
            if (!$question) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Question not found'
                ]);
                return;
            }

            // Verify test and course offering belong to faculty
            $test = $this->testRepository->findById($question->getTestId());
            if (!$test) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Test not found'
                ]);
                return;
            }

            // Verify access (faculty assignment or HOD department ownership)
            $access = $this->checkOfferingAccess($userData, $test->getOfferingId());
            if (!$access['allowed']) {
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
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('UPDATE', 'Question', null, ($GLOBALS['audit_old_state'] ?? null), $auditPayload);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'AssessmentController', 'UPDATE operation successful in updateQuestion');
            }
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

            if ($userData['role'] !== 'faculty' && $userData['role'] !== 'hod') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Only faculty or HOD can delete questions.'
                ]);
                return;
            }

            // Find existing question
            $question = $this->questionRepository->findById($questionId);
            $GLOBALS['audit_old_state'] = (isset($question) && is_object($question) && method_exists($question, 'toArray')) ? $question->toArray() : (isset($question) ? clone $question : null);
            if (!$question) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Question not found'
                ]);
                return;
            }

            // Verify test and course offering belong to faculty
            $test = $this->testRepository->findById($question->getTestId());
            if (!$test) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Test not found'
                ]);
                return;
            }

            $access = $this->checkOfferingAccess($userData, $test->getOfferingId());
            if (!$access['allowed']) {
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
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('DELETE', 'Question', null, ($GLOBALS['audit_old_state'] ?? $auditPayload), null);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'AssessmentController', 'DELETE operation successful in deleteQuestion');
            }
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



