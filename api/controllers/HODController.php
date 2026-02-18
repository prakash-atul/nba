<?php

/**
 * HOD Controller
 * Handles HOD-specific operations like department course management
 */
class HODController
{
    private $userRepository;
    private $courseRepository;
    private $courseOfferingRepository;
    private $courseFacultyAssignmentRepository;
    private $departmentRepository;
    private $validationMiddleware;

    public function __construct(
        ?UserRepository $userRepository = null,
        ?CourseRepository $courseRepository = null,
        ?CourseOfferingRepository $courseOfferingRepository = null,
        ?CourseFacultyAssignmentRepository $courseFacultyAssignmentRepository = null,
        ?DepartmentRepository $departmentRepository = null,
        ?ValidationMiddleware $validationMiddleware = null
    ) {
        $this->userRepository = $userRepository;
        $this->courseRepository = $courseRepository;
        $this->courseOfferingRepository = $courseOfferingRepository;
        $this->courseFacultyAssignmentRepository = $courseFacultyAssignmentRepository;
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
     * Can be filtered by year and semester
     */
    /**
     * Get courses in the HOD's department — paginated
     */
    public function getDepartmentCourses()
    {
        try {
            if (!$this->requireHOD()) return;

            $departmentId = (int)($_REQUEST['authenticated_user']['department_id'] ?? 0);
            if (!$departmentId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Department not assigned']);
                return;
            }

            $params = PaginationHelper::parseParams(
                $_GET,
                'c.course_id',
                'c.course_id',
                ['c.course_id', 'c.course_code', 'c.course_name', 'c.credit'],
                ['is_active', 'course_type']
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
     * Get faculty/staff in the HOD's department — paginated
     */
    public function getDepartmentFaculty()
    {
        try {
            if (!$this->requireHOD()) return;

            $departmentId = (int)($_REQUEST['authenticated_user']['department_id'] ?? 0);
            if (!$departmentId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Department not assigned']);
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
     * Create a new course offering (and template if needed) for the department
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
            if (!$faculty || ($faculty->getDepartmentId() != $departmentId && $faculty->getRole() !== 'HOD')) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Faculty must belong to your department'
                ]);
                return;
            }

            // 1. Get or Create Course Template
            $course = $this->courseRepository->findByCourseCode($input['course_code']);
            if (!$course) {
                $course = new Course(
                    null,
                    $input['course_code'],
                    $input['name'],
                    intval($input['credit']),
                    $departmentId
                );
                $this->courseRepository->save($course);
            } else {
                // If course template exists, optionally update name/credit if they differ?
                // For now, let's keep it simple.
            }

            // 2. Check if offering already exists for this year/sem
            $existingOffering = $this->courseOfferingRepository->findByCourseYearSem($course->getCourseId(), $input['year'], $input['semester']);
            if ($existingOffering) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering already exists for this year and semester'
                ]);
                return;
            }

            // 3. Create Course Offering
            $offering = new CourseOffering(
                $course->getCourseId(),
                intval($input['year']),
                intval($input['semester']),
                $input['co_threshold'] ?? 40.00,
                $input['passing_threshold'] ?? 60.00
            );
            $this->courseOfferingRepository->save($offering);

            // 4. Create Faculty Assignment
            $assignment = new CourseFacultyAssignment(
                null,
                $offering->getOfferingId(),
                $input['faculty_id'],
                'Primary'
            );
            $this->courseFacultyAssignmentRepository->save($assignment);

            // Get the created offering with full details (for consistency with UI)
            $createdOffering = $this->courseOfferingRepository->findById($offering->getOfferingId());

            http_response_code(201);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Course offering created successfully',
                'data' => $createdOffering
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create course offering',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update a course offering and its details
     */
    public function updateCourse($offeringId)
    {
        try {
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // 1. Get existing offering
            $offering = $this->courseOfferingRepository->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Course offering not found'
                ]);
                return;
            }

            // 2. Get course template to verify ownership
            $course = $this->courseRepository->findById($offering->getCourseId());
            if (!$course || $course->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only update courses in your department'
                ]);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            // 3. Update Course Template Fields (if provided)
            $templateChanged = false;
            if (isset($input['course_code'])) {
                // Check for conflicts
                $conflicting = $this->courseRepository->findByCourseCode($input['course_code']);
                if ($conflicting && $conflicting->getCourseId() != $course->getCourseId()) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Course code already exists']);
                    return;
                }
                $course->setCourseCode($input['course_code']);
                $templateChanged = true;
            }
            if (isset($input['name'])) { $course->setCourseName($input['name']); $templateChanged = true; }
            if (isset($input['credit'])) { $course->setCredit(intval($input['credit'])); $templateChanged = true; }
            
            if ($templateChanged) {
                $this->courseRepository->save($course);
            }

            // 4. Update Offering Fields
            if (isset($input['year'])) $offering->setYear(intval($input['year']));
            if (isset($input['semester'])) $offering->setSemester(intval($input['semester']));
            if (isset($input['co_threshold'])) $offering->setCoThreshold(floatval($input['co_threshold']));
            if (isset($input['passing_threshold'])) $offering->setPassingThreshold(floatval($input['passing_threshold']));
            
            $this->courseOfferingRepository->save($offering);

            // 5. Update Faculty Assignment (if provided)
            if (isset($input['faculty_id'])) {
                // Verify new faculty belongs to department
                $newFaculty = $this->userRepository->findByEmployeeId($input['faculty_id']);
                if (!$newFaculty || ($newFaculty->getDepartmentId() != $departmentId && $newFaculty->getRole() !== 'HOD')) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Faculty must belong to your department']);
                    return;
                }

                // Get current primary assignment
                $assignments = $this->courseFacultyAssignmentRepository->getAssignmentsByOffering($offeringId);
                $primaryAssignment = null;
                foreach ($assignments as $a) {
                    if ($a['assignment_type'] === 'Primary') {
                        $primaryAssignment = $a;
                        break;
                    }
                }

                if ($primaryAssignment) {
                    // Update existing assignment (in a real app, maybe end previous and start new)
                    // For now, simplicity: update employee_id
                    $stmt = $this->courseOfferingRepository->getDb()->prepare(
                        "UPDATE course_faculty_assignments SET employee_id = ? WHERE id = ?"
                    );
                    $stmt->execute([$input['faculty_id'], $primaryAssignment['id']]);
                } else {
                    // Create new primary assignment
                    $newAssign = new CourseFacultyAssignment(null, $offeringId, $input['faculty_id'], 'Primary');
                    $this->courseFacultyAssignmentRepository->save($newAssign);
                }
            }

            // Get updated offering with full info
            $updatedOffering = $this->courseOfferingRepository->findById($offeringId);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Course updated successfully',
                'data' => $updatedOffering
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
     * Delete a course offering (and potentially its data)
     */
    public function deleteCourse($offeringId)
    {
        try {
            if (!$this->requireHOD()) return;
            
            $userData = $_REQUEST['authenticated_user'];
            $departmentId = $userData['department_id'];

            // 1. Get existing offering
            $offering = $this->courseOfferingRepository->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            // 2. Verify ownership via template
            $course = $this->courseRepository->findById($offering->getCourseId());
            if (!$course || $course->getDepartmentId() != $departmentId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You can only delete courses in your department']);
                return;
            }

            // 3. Delete offering (this will cascade to assignments, enrollments, tests, etc.)
            $this->courseOfferingRepository->delete($offeringId);

            // Optional: If no more offerings exist for this course, delete the template?
            // For now, let's keep templates.

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Course offering deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete course offering',
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
                $departmentId,
                $input['designation'] ?? null,
                $input['phone'] ?? null
            );

            $this->userRepository->save($user);

            http_response_code(201);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => ucfirst($input['role']) . ' created successfully',
                'data' => $user->toArray()
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
            $designation = isset($input['designation']) ? $input['designation'] : $existingUser->getDesignation();
            $phone = isset($input['phone']) ? $input['phone'] : $existingUser->getPhone();
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
                $departmentId,
                $designation,
                $phone
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
