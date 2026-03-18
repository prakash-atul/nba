<?php

/**
 * Staff Controller
 * Handles Staff-specific operations like course management and student enrollment
 */
class StaffController
{
    private $userRepository;
    private $courseRepository;
    private $departmentRepository;
    private $enrollmentRepository;
    private $studentRepository;
    private $courseOfferingRepository;
    private $courseFacultyAssignmentRepository;
    private $validationMiddleware;
    private $pdo;

    public function __construct(
        ?UserRepository $userRepository = null,
        ?CourseRepository $courseRepository = null,
        ?DepartmentRepository $departmentRepository = null,
        ?EnrollmentRepository $enrollmentRepository = null,
        ?StudentRepository $studentRepository = null,
        ?ValidationMiddleware $validationMiddleware = null,
        $pdo = null,
        ?CourseOfferingRepository $courseOfferingRepository = null,
        ?CourseFacultyAssignmentRepository $courseFacultyAssignmentRepository = null
    ) {
        $this->userRepository = $userRepository;
        $this->courseRepository = $courseRepository;
        $this->departmentRepository = $departmentRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->studentRepository = $studentRepository;
        $this->courseOfferingRepository = $courseOfferingRepository;
        $this->courseFacultyAssignmentRepository = $courseFacultyAssignmentRepository;
        $this->validationMiddleware = $validationMiddleware;
        $this->pdo = $pdo;
    }

    /**
     * Check if user is Staff
     */
    private function requireStaff()
    {
        $userData = $_REQUEST['authenticated_user'];
        
        if ($userData['role'] !== 'staff') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Staff privileges required.'
            ]);
            return false;
        }
        return true;
    }

    /**
     * Get Staff dashboard statistics
     */
    public function getStats()
    {
        try {
            if (!$this->requireStaff()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // Check if staff has department assigned
            if (!$departmentId) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'No department assigned',
                    'data' => [
                        'totalCourses' => 0,
                        'totalStudents' => 0,
                        'totalEnrollments' => 0
                    ]
                ]);
                return;
            }

            // Staff can see department-wide statistics
            $stats = [
                'totalCourses' => $this->courseRepository->countByDepartment($departmentId),
                'totalStudents' => $this->userRepository->countStudentsByDepartment($departmentId),
                'totalEnrollments' => $this->enrollmentRepository->countByDepartment($departmentId)
            ];

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Stats retrieved successfully',
                'data' => $stats
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve stats',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get all courses for the staff's department
     */
    /**
     * Get courses in the staff's department — paginated
     */
    public function getDepartmentCourses()
    {
        try {
            if (!$this->requireStaff()) return;

            $departmentId = (int)($_REQUEST['authenticated_user']['department_id'] ?? 0);
            if (!$departmentId) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode(['success' => true, 'message' => 'No department assigned', 'data' => [], 'pagination' => ['total' => 0, 'has_more' => false, 'next_cursor' => null, 'prev_cursor' => null, 'limit' => 20]]);
                return;
            }

            $params = PaginationHelper::parseParams(
                $_GET,
                'c.course_id',
                'c.course_id',
                ['c.course_id', 'c.course_code', 'c.course_name', 'c.credit', 'c.course_type', 'co.year', 'co.semester', 'u.username'],
                ['is_active', 'course_type', 'year', 'semester']
            );

            $total  = $this->courseRepository->countByDepartmentPaginated($departmentId, $params);
            $rows   = $this->courseRepository->findByDepartmentPaginated($departmentId, $params);
            $result = PaginationHelper::buildResponse($rows, 'course_id', $params['limit'], $total);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(array_merge(['success' => true, 'message' => 'Department courses retrieved successfully'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve courses', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get faculty/staff in the staff's department — paginated
     */
    public function getDepartmentFaculty()
    {
        try {
            if (!$this->requireStaff()) return;

            $departmentId = (int)($_REQUEST['authenticated_user']['department_id'] ?? 0);
            if (!$departmentId) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode(['success' => true, 'message' => 'No department assigned', 'data' => [], 'pagination' => ['total' => 0, 'has_more' => false, 'next_cursor' => null, 'prev_cursor' => null, 'limit' => 20]]);
                return;
            }

            $params = PaginationHelper::parseParams(
                $_GET,
                'employee_id',
                'employee_id',
                ['employee_id', 'username', 'email', 'role', 'designation'],
                ['role']
            );

            $total  = $this->userRepository->countByDepartmentPaginated($departmentId, $params);
            $rows   = $this->userRepository->findByDepartmentPaginated($departmentId, $params);
            $result = PaginationHelper::buildResponse($rows, 'employee_id', $params['limit'], $total);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(array_merge(['success' => true, 'message' => 'Department faculty retrieved successfully'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve faculty', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Create a new course for the department
     */
    public function createCourse()
    {
        try {
            if (!$this->requireStaff()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            if (!$departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'No department assigned. Cannot create courses.'
                ]);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $requiredFields = ['course_code', 'name', 'credit', 'faculty_id', 'year', 'semester'];
            $errors = [];

            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || $input[$field] === '') {
                    $errors[] = "Field '$field' is required";
                }
            }

            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $errors
                ]);
                return;
            }

            // Verify faculty belongs to the same department
            $faculty = $this->userRepository->findByEmployeeId($input['faculty_id']);
            if (!$faculty || $faculty->getDepartmentId() != $departmentId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Faculty must belong to your department'
                ]);
                return;
            }

            // Check if course code already exists
            $existingCourse = $this->courseRepository->findByCourseCode($input['course_code']);
            if ($existingCourse) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course code already exists'
                ]);
                return;
            }

            // 1. Create course template
            $course = new Course(
                null,
                $input['course_code'],
                $input['name'],
                $input['credit'],
                $departmentId
            );

            $this->courseRepository->save($course);

            // 2. Create course offering
            $offering = new CourseOffering(
                $course->getCourseId(),
                $input['year'],
                $input['semester'],
                $input['co_threshold'] ?? 40.00,
                $input['passing_threshold'] ?? 60.00
            );
            $this->courseOfferingRepository->save($offering);

            // 3. Create faculty assignment
            if (!empty($input['faculty_id'])) {
                $assignment = new CourseFacultyAssignment(
                    null,
                    $offering->getOfferingId(),
                    $input['faculty_id'],
                    'Primary'
                );
                $this->courseFacultyAssignmentRepository->save($assignment);
            }

            // Get the created course with faculty info for response
            $createdCourse = $this->courseRepository->findByIdWithFaculty($course->getCourseId());

            http_response_code(201);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Course created successfully',
                'data' => $createdCourse
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create course',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update a course
     */
    public function updateCourse($courseId)
    {
        try {
            if (!$this->requireStaff()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            if (!$departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'No department assigned. Cannot update courses.'
                ]);
                return;
            }

            // Get existing course
            $existingCourse = $this->courseRepository->findById($courseId);
            if (!$existingCourse) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found'
                ]);
                return;
            }

            // Check course belongs to department
            if ($existingCourse->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only update courses in your department'
                ]);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            // Update course fields
            if (isset($input['course_code'])) {
                // Check if new code conflicts with another course
                $conflictingCourse = $this->courseRepository->findByCourseCode($input['course_code']);
                if ($conflictingCourse && $conflictingCourse->getCourseId() != $courseId) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Course code already exists'
                    ]);
                    return;
                }
                $existingCourse->setCourseCode($input['course_code']);
            }
            if (isset($input['name'])) $existingCourse->setCourseName($input['name']);
            if (isset($input['credit'])) $existingCourse->setCredit($input['credit']);
            if (isset($input['faculty_id'])) {
                // Verify new faculty belongs to department
                $newFaculty = $this->userRepository->findByEmployeeId($input['faculty_id']);
                if (!$newFaculty || $newFaculty->getDepartmentId() != $departmentId) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Faculty must belong to your department'
                    ]);
                    return;
                }
                $existingCourse->setFacultyId($input['faculty_id']);
            }
            if (isset($input['year'])) $existingCourse->setYear($input['year']);
            if (isset($input['semester'])) $existingCourse->setSemester($input['semester']);

            $this->courseRepository->save($existingCourse);

            // Get updated course with faculty info
            $updatedCourse = $this->courseRepository->findByIdWithFaculty($courseId);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Course updated successfully',
                'data' => $updatedCourse
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update course',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a course
     */
    public function deleteCourse($courseId)
    {
        try {
            if (!$this->requireStaff()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            if (!$departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'No department assigned. Cannot delete courses.'
                ]);
                return;
            }

            // Get existing course
            $existingCourse = $this->courseRepository->findById($courseId);
            if (!$existingCourse) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found'
                ]);
                return;
            }

            // Check course belongs to department
            if ($existingCourse->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only delete courses in your department'
                ]);
                return;
            }

            $this->courseRepository->delete($courseId);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Course deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete course',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get enrollments for a specific course offering
     */
    public function getCourseEnrollments($offeringId)
    {
        try {
            if (!$this->requireStaff()) return;

            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // Verify offering exists
            $offering = $this->courseOfferingRepository->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering not found'
                ]);
                return;
            }

            // Verify course belongs to the staff's department
            $course = $this->courseRepository->findById($offering->getCourseId());
            if (!$course || $course->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to view enrollments for this offering'
                ]);
                return;
            }

            // Get enrollments
            $enrollments = $this->enrollmentRepository->findByOfferingId($offeringId);
            $count = count($enrollments);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => "Found $count enrolled students",
                'data' => [
                    'offering_id' => $offeringId,
                    'course_id' => $course->getCourseId(),
                    'course_code' => $course->getCourseCode(),
                    'course_name' => $course->getCourseName(),
                    'enrollment_count' => $count,
                    'enrollments' => $enrollments
                ]
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
     * Bulk enroll students in a course offering
     */
    public function bulkEnroll($offeringId)
    {
        try {
            if (!$this->requireStaff()) return;

            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

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
            $offering = $this->courseOfferingRepository->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering not found'
                ]);
                return;
            }

            // Check if the course belongs to the staff's department
            $course = $this->courseRepository->findById($offering->getCourseId());
            if (!$course || $course->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to enroll students in this offering'
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
                $existingStudent = $this->studentRepository->findByRollno($rollno);
                if (!$existingStudent) {
                    // Create new student with the staff's department
                    $studentModel = new Student($rollno, $name, $departmentId);
                    $this->studentRepository->save($studentModel);
                }

                $validatedStudents[] = [
                    'rollno' => $rollno,
                    'name' => $name
                ];
            }

            // Perform bulk enrollment using offering_id
            $results = $this->enrollmentRepository->bulkEnrollStudents($offeringId, $validatedStudents);

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
     * Remove a student from a course offering
     */
    public function removeEnrollment($offeringId, $rollno)
    {
        try {
            if (!$this->requireStaff()) return;

            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // Verify offering exists
            $offering = $this->courseOfferingRepository->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering not found'
                ]);
                return;
            }

            // Check if the course belongs to the staff's department
            $course = $this->courseRepository->findById($offering->getCourseId());
            if (!$course || $course->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to remove enrollments from this offering'
                ]);
                return;
            }

            // Check if student is enrolled
            if (!$this->enrollmentRepository->isEnrolled($offeringId, $rollno)) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student is not enrolled in this offering'
                ]);
                return;
            }

            // Remove enrollment
            $this->enrollmentRepository->removeEnrollment($offeringId, $rollno);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Student removed from offering successfully'
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
     * Get students in the staff's department — paginated
     */
    public function getDepartmentStudents()
    {
        try {
            if (!$this->requireStaff()) return;

            $departmentId = (int)($_REQUEST['authenticated_user']['department_id'] ?? 0);
            if (!$departmentId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Department not assigned']);
                return;
            }

            $params = PaginationHelper::parseParams(
                $_GET,
                's.roll_no',
                's.roll_no',
                ['s.roll_no', 's.student_name', 's.batch_year', 's.student_status'],
                ['batch_year', 'student_status']
            );

            $total  = $this->studentRepository->countByDepartmentPaginated($departmentId, $params);
            $rows   = $this->studentRepository->findByDepartmentPaginated($departmentId, $params);
            $result = PaginationHelper::buildResponse($rows, 'roll_no', $params['limit'], $total);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(array_merge(['success' => true, 'message' => 'Department students retrieved successfully'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve students', 'error' => $e->getMessage()]);
        }
    }
}
