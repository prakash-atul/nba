<?php

/**
 * HOD Controller
 * Handles HOD-specific operations like department course management
 */
class HODController
{
    private $userRepository;
    private $courseRepository;
    private $departmentRepository;
    private $validationMiddleware;

    public function __construct(
        UserRepository $userRepository,
        CourseRepository $courseRepository,
        DepartmentRepository $departmentRepository,
        ValidationMiddleware $validationMiddleware
    ) {
        $this->userRepository = $userRepository;
        $this->courseRepository = $courseRepository;
        $this->departmentRepository = $departmentRepository;
        $this->validationMiddleware = $validationMiddleware;
    }

    /**
     * Check if user is HOD
     */
    private function requireHOD()
    {
        $userData = $_REQUEST['authenticated_user'];
        
        if (!isset($userData['is_hod']) || $userData['is_hod'] !== true) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. HOD privileges required.'
            ]);
            return false;
        }
        return true;
    }

    /**
     * Get HOD dashboard statistics
     */
    public function getStats()
    {
        try {
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            $stats = [
                'totalCourses' => $this->courseRepository->countByDepartment($departmentId),
                'totalFaculty' => $this->userRepository->countFacultyByDepartment($departmentId),
                'totalStudents' => $this->userRepository->countStudentsByDepartment($departmentId),
                'totalAssessments' => $this->courseRepository->countAssessmentsByDepartment($departmentId)
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
     * Get all courses for the HOD's department
     */
    public function getDepartmentCourses()
    {
        try {
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

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
     * Get all faculty members in the HOD's department
     */
    public function getDepartmentFaculty()
    {
        try {
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

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
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

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
            if (!$faculty || ($faculty->getDepartmentId() != $departmentId && $faculty->getRole() !== 'hod')) {
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
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

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
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

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
     * Create a new faculty or staff member for the department
     */
    public function createUser()
    {
        try {
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $requiredFields = ['employee_id', 'username', 'email', 'password', 'role'];
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

            // Validate role (HOD can only create faculty or staff)
            if (!in_array($input['role'], ['faculty', 'staff'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid role. HOD can only create faculty or staff members.'
                ]);
                return;
            }

            // Check if employee_id already exists
            $existingUser = $this->userRepository->findByEmployeeId($input['employee_id']);
            if ($existingUser) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Employee ID already exists'
                ]);
                return;
            }

            // Check if email already exists
            $existingEmail = $this->userRepository->findByEmail($input['email']);
            if ($existingEmail) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email already exists'
                ]);
                return;
            }

            // Hash password
            $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

            // Create user with HOD's department
            $user = new User(
                $input['employee_id'],
                $input['username'],
                $input['email'],
                $hashedPassword,
                $input['role'],
                $departmentId
            );

            $this->userRepository->save($user);

            http_response_code(201);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => ucfirst($input['role']) . ' created successfully',
                'data' => [
                    'employee_id' => $user->getEmployeeId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail(),
                    'role' => $user->getRole(),
                    'department_id' => $user->getDepartmentId()
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update a faculty or staff member
     */
    public function updateUser($employeeId)
    {
        try {
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // Get existing user
            $existingUser = $this->userRepository->findByEmployeeId($employeeId);
            if (!$existingUser) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'User not found'
                ]);
                return;
            }

            // Check user belongs to HOD's department
            if ($existingUser->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only update users in your department'
                ]);
                return;
            }

            // HOD cannot update other HODs or admins
            if (in_array($existingUser->getRole(), ['hod', 'admin', 'dean'])) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You cannot update this user'
                ]);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            // Update fields
            $username = isset($input['username']) ? $input['username'] : $existingUser->getUsername();
            $email = isset($input['email']) ? $input['email'] : $existingUser->getEmail();
            $role = isset($input['role']) ? $input['role'] : $existingUser->getRole();
            $password = $existingUser->getPassword();

            // Validate role if provided
            if (isset($input['role']) && !in_array($input['role'], ['faculty', 'staff'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid role. Can only be faculty or staff.'
                ]);
                return;
            }

            // Check if email already exists (for another user)
            if (isset($input['email'])) {
                $emailUser = $this->userRepository->findByEmail($input['email']);
                if ($emailUser && $emailUser->getEmployeeId() != $employeeId) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Email already exists'
                    ]);
                    return;
                }
            }

            // Update password if provided
            if (isset($input['password']) && !empty($input['password'])) {
                $password = password_hash($input['password'], PASSWORD_DEFAULT);
            }

            $updatedUser = new User(
                $employeeId,
                $username,
                $email,
                $password,
                $role,
                $departmentId
            );

            $this->userRepository->save($updatedUser);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => [
                    'employee_id' => $updatedUser->getEmployeeId(),
                    'username' => $updatedUser->getUsername(),
                    'email' => $updatedUser->getEmail(),
                    'role' => $updatedUser->getRole(),
                    'department_id' => $updatedUser->getDepartmentId()
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a faculty or staff member
     */
    public function deleteUser($employeeId)
    {
        try {
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // Get existing user
            $existingUser = $this->userRepository->findByEmployeeId($employeeId);
            if (!$existingUser) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'User not found'
                ]);
                return;
            }

            // Check user belongs to HOD's department
            if ($existingUser->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only delete users in your department'
                ]);
                return;
            }

            // HOD cannot delete other HODs or admins
            if (in_array($existingUser->getRole(), ['hod', 'admin', 'dean'])) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You cannot delete this user'
                ]);
                return;
            }

            $this->userRepository->delete($employeeId);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ]);
        }
    }
}
