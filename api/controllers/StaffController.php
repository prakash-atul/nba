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
    private $validationMiddleware;
    private $pdo;

    public function __construct(
        UserRepository $userRepository,
        CourseRepository $courseRepository,
        DepartmentRepository $departmentRepository,
        EnrollmentRepository $enrollmentRepository,
        StudentRepository $studentRepository,
        ValidationMiddleware $validationMiddleware,
        $pdo
    ) {
        $this->userRepository = $userRepository;
        $this->courseRepository = $courseRepository;
        $this->departmentRepository = $departmentRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->studentRepository = $studentRepository;
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
    public function getDepartmentCourses()
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
                    'data' => []
                ]);
                return;
            }

            $courses = $this->courseRepository->findByDepartment($departmentId);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Department courses retrieved successfully',
                'data' => $courses
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
     * Get department faculty for course assignment
     */
    public function getDepartmentFaculty()
    {
        try {
            if (!$this->requireStaff()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            if (!$departmentId) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'No department assigned',
                    'data' => []
                ]);
                return;
            }

            $faculty = $this->userRepository->findFacultyByDepartment($departmentId);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Department faculty retrieved successfully',
                'data' => $faculty
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve faculty',
                'error' => $e->getMessage()
            ]);
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

            // Create course
            $course = new Course(
                null,
                $input['course_code'],
                $input['name'],
                $input['credit'],
                $input['faculty_id'],
                $input['year'],
                $input['semester'],
                null,
                $input['co_threshold'] ?? 40.00,
                $input['passing_threshold'] ?? 60.00
            );

            $this->courseRepository->save($course);

            // Get the created course with faculty info
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
            $faculty = $this->userRepository->findByEmployeeId($existingCourse->getFacultyId());
            if (!$faculty || $faculty->getDepartmentId() != $departmentId) {
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
            $faculty = $this->userRepository->findByEmployeeId($existingCourse->getFacultyId());
            if (!$faculty || $faculty->getDepartmentId() != $departmentId) {
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
     * Get enrollments for a specific course
     */
    public function getCourseEnrollments($courseId)
    {
        try {
            if (!$this->requireStaff()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // Verify course exists and belongs to the staff's department
            $course = $this->courseRepository->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found'
                ]);
                return;
            }

            // Check if the course belongs to the staff's department
            $faculty = $this->userRepository->findByEmployeeId($course->getFacultyId());
            if (!$faculty || $faculty->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to view enrollments for this course'
                ]);
                return;
            }

            // Get enrollments
            $enrollments = $this->enrollmentRepository->findByCourseId($courseId);
            $count = count($enrollments);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => "Found $count enrolled students",
                'data' => [
                    'course_id' => $courseId,
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
     * Bulk enroll students in a course
     */
    public function bulkEnroll($courseId)
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

            // Verify course exists and belongs to the staff's department
            $course = $this->courseRepository->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found'
                ]);
                return;
            }

            // Check if the course belongs to the staff's department
            $faculty = $this->userRepository->findByEmployeeId($course->getFacultyId());
            if (!$faculty || $faculty->getDepartmentId() != $departmentId) {
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
                $existingStudent = $this->studentRepository->findByRollno($rollno);
                if (!$existingStudent) {
                    // Create new student with the staff's department
                    $student = new Student($rollno, $name, $departmentId);
                    $this->studentRepository->save($student);
                }

                $validatedStudents[] = [
                    'rollno' => $rollno,
                    'name' => $name
                ];
            }

            // Perform bulk enrollment
            $results = $this->enrollmentRepository->bulkEnrollStudents($courseId, $validatedStudents);

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
     * Remove a student from a course
     */
    public function removeEnrollment($courseId, $rollno)
    {
        try {
            if (!$this->requireStaff()) return;

            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // Verify course exists and belongs to the staff's department
            $course = $this->courseRepository->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course not found'
                ]);
                return;
            }

            // Check if the course belongs to the staff's department
            $faculty = $this->userRepository->findByEmployeeId($course->getFacultyId());
            if (!$faculty || $faculty->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not authorized to remove enrollments from this course'
                ]);
                return;
            }

            // Check if student is enrolled
            if (!$this->enrollmentRepository->isEnrolled($courseId, $rollno)) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student is not enrolled in this course'
                ]);
                return;
            }

            // Remove enrollment
            $this->enrollmentRepository->removeEnrollment($courseId, $rollno);

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

    /**
     * Get all students in the department
     */
    public function getDepartmentStudents()
    {
        try {
            if (!$this->requireStaff()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            $students = $this->studentRepository->findByDepartment($departmentId);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Department students retrieved successfully',
                'data' => $students
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve students',
                'error' => $e->getMessage()
            ]);
        }
    }
}
