<?php

/**
 * Admin Controller
 * Handles admin-specific operations like dashboard stats and data management
 */
class AdminController
{
    private $userRepository;
    private $courseRepository;
    private $studentRepository;
    private $testRepository;
    private $departmentRepository;
    private $deanAssignmentRepository;
    private $schoolRepository;

    public function __construct(
        UserRepository $userRepository,
        CourseRepository $courseRepository,
        StudentRepository $studentRepository,
        TestRepository $testRepository,
        DepartmentRepository $departmentRepository,
        ?DeanAssignmentRepository $deanAssignmentRepository = null,
        ?SchoolRepository $schoolRepository = null
    ) {
        $this->userRepository = $userRepository;
        $this->courseRepository = $courseRepository;
        $this->studentRepository = $studentRepository;
        $this->testRepository = $testRepository;
        $this->departmentRepository = $departmentRepository;
        $this->deanAssignmentRepository = $deanAssignmentRepository;
        $this->schoolRepository = $schoolRepository;
    }

    /**
     * Get dashboard statistics (Admin only)
     */
    public function getStats()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            // Check if user is admin
            if ($userData['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ]);
                return;
            }

            $stats = [
                'totalUsers' => $this->userRepository->countAll(),
                'totalCourses' => $this->courseRepository->countAll(),
                'totalStudents' => $this->studentRepository->countAll(),
                'totalAssessments' => $this->testRepository->countAll()
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
     * Get all courses (Admin only) — paginated
     */
    public function getAllCourses()
    {
        try {
            if (!$this->requireAdmin()) return;

            $params = PaginationHelper::parseParams(
                $_GET,
                'c.course_id',
                'c.course_id',
                ['c.course_id', 'c.course_code', 'c.course_name', 'c.course_type', 'c.credit', 'co.year', 'co.semester', 'u.username'],
                ['department_id', 'is_active', 'course_type']
            );

            $total = $this->courseRepository->countPaginated($params);
            $rows  = $this->courseRepository->findPaginated($params);
            $result = PaginationHelper::buildResponse($rows, 'course_id', $params['limit'], $total);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(array_merge(['success' => true, 'message' => 'Courses retrieved successfully'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve courses', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get all departments enriched (Admin only) — paginated
     */
    public function getAllDepartments()
    {
        try {
            if (!$this->requireAdmin()) return;

            $params = PaginationHelper::parseParams(
                $_GET,
                'd.department_id',
                'd.department_id',
                ['d.department_id', 'd.department_name', 'd.department_code'],
                ['school_id']
            );

            $total = $this->departmentRepository->countEnrichedPaginated($params);
            $rows  = $this->departmentRepository->findEnrichedPaginated($params);
            $result = PaginationHelper::buildResponse($rows, 'department_id', $params['limit'], $total);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(array_merge(['success' => true, 'message' => 'Departments retrieved successfully'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve departments', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get all students (Admin only) — paginated
     */
    public function getAllStudents()
    {
        try {
            if (!$this->requireAdmin()) return;

            $params = PaginationHelper::parseParams(
                $_GET,
                's.roll_no',
                's.roll_no',
                ['s.roll_no', 's.student_name', 's.batch_year', 's.student_status'],
                ['department_id', 'batch_year', 'student_status']
            );

            $total = $this->studentRepository->countPaginated($params);
            $rows  = $this->studentRepository->findPaginated($params);
            $result = PaginationHelper::buildResponse($rows, 'roll_no', $params['limit'], $total);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(array_merge(['success' => true, 'message' => 'Students retrieved successfully'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve students', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get all tests (Admin only) — paginated
     */
    public function getAllTests()
    {
        try {
            if (!$this->requireAdmin()) return;

            $params = PaginationHelper::parseParams(
                $_GET,
                't.test_id',
                't.test_id',
                ['t.test_id', 't.test_name', 't.test_date', 't.test_type'],
                ['department_id', 'test_type']
            );

            $total = $this->testRepository->countPaginated($params);
            $rows  = $this->testRepository->findPaginated($params);
            $result = PaginationHelper::buildResponse($rows, 'test_id', $params['limit'], $total);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(array_merge(['success' => true, 'message' => 'Tests retrieved successfully'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve tests', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Check if user is admin
     */
    private function requireAdmin()
    {
        $userData = $_REQUEST['authenticated_user'];

        if ($userData['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Admin privileges required.'
            ]);
            return false;
        }
        return true;
    }

    /**
     * Get all schools (Admin only)
     */
    public function getAllSchools()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];
            
            // Start of Selection
            if ($userData['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Admin privileges required.'
                ]);
                return;
            }

            $schools = $this->schoolRepository->findAll();

            // Enrich with Dean info and department count
            foreach ($schools as &$school) {
                $school['dean'] = null;
                if ($this->deanAssignmentRepository) {
                    $deanAssignment = $this->deanAssignmentRepository->getCurrentDean($school['school_id']);
                    if ($deanAssignment) {
                        $deanUser = $this->userRepository->findByEmployeeId($deanAssignment->getEmployeeId());
                        if ($deanUser) {
                            $school['dean'] = [
                                'employee_id' => $deanUser->getEmployeeId(),
                                'username' => $deanUser->getUsername(),
                                'email' => $deanUser->getEmail()
                            ];
                        }
                    }
                }

            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Schools retrieved successfully',
                'data' => $schools
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve schools',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new school (Admin only)
     */
    public function createSchool()
    {
        try {
            if (!$this->requireAdmin()) return;

            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input['school_name']) || empty($input['school_code'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'School name and code are required'
                ]);
                return;
            }

            $school = new School(
                null,
                $input['school_code'],
                $input['school_name'],
                isset($input['description']) ? $input['description'] : null
            );

            $schoolId = $this->schoolRepository->create($school);

            if ($schoolId) {
                $school->setSchoolId($schoolId);

                // Auto-create a dean login account for this school
                try {
                    $deanUsername = 'dean_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $input['school_code']));
                    $deanEmail = $deanUsername . '@tezu.ernet.in';
                    $deanPassword = password_hash('password123', PASSWORD_BCRYPT);
                    
                    $newEmpId = $this->userRepository->generateSystemAccountId('dean');
                    
                    if ($this->userRepository->findByUsername($deanUsername)) {
                        $deanUsername .= '_' . rand(10, 99);
                        $deanEmail = $deanUsername . '@tezu.ernet.in';
                    }

                    $deanUser = new User(
                        $newEmpId,
                        'Dean ' . strtoupper($input['school_code']),
                        $deanEmail,
                        $deanPassword,
                        'dean',
                        null,
                        'Dean',
                        null,
                        null,
                        null,
                        $schoolId
                    );
                    
                    $this->userRepository->save($deanUser);
                } catch (Exception $userEx) {
                    error_log("Failed to create default dean account for school: " . $userEx->getMessage());
                }

                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'School and Dean account created successfully',
                    'data' => $school->toArray()
                ]);
            } else {
                throw new Exception("Failed to create school");
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create school',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update a school (Admin only)
     */
    public function updateSchool($schoolId)
    {
        try {
            if (!$this->requireAdmin()) return;

            $input = json_decode(file_get_contents('php://input'), true);
            
            $existingSchool = $this->schoolRepository->findById($schoolId);
            if (!$existingSchool) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'School not found'
                ]);
                return;
            }

            if (isset($input['school_name'])) {
                $existingSchool->setSchoolName($input['school_name']);
            }
            if (isset($input['school_code'])) {
                $existingSchool->setSchoolCode($input['school_code']);
            }
            if (isset($input['description'])) {
                $existingSchool->setDescription($input['description']);
            }

            if ($this->schoolRepository->update($existingSchool)) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'School updated successfully',
                    'data' => $existingSchool->toArray()
                ]);
            } else {
                // If no rows updated, it might mean no changes were made, but distinct from failure
                http_response_code(200);
                 echo json_encode([
                    'success' => true,
                    'message' => 'School updated successfully (no changes detected)',
                    'data' => $existingSchool->toArray()
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update school',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a school (Admin only)
     */
    public function deleteSchool($schoolId)
    {
        try {
            if (!$this->requireAdmin()) return;

            // Check if school exists
            $school = $this->schoolRepository->findById($schoolId);
            if (!$school) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'School not found'
                ]);
                return;
            }

            // Get auto-generated dean accounts to clean up
            $deanIds = $this->userRepository->getSystemAccessorIdsBySchool($schoolId);

            // Attempt delete (will fail if constraints exist, caught by catch block)
            if ($this->schoolRepository->delete($schoolId)) {
                
                // Clean up auto-generated Dean accounts associated with this school
                foreach ($deanIds as $empId) {
                    $this->userRepository->delete($empId);
                }

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'School deleted successfully'
                ]);
            } else {
                throw new Exception("Failed to delete school");
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete school',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new department (Admin only)
     */
    public function createDepartment()
    {
        try {
            if (!$this->requireAdmin()) return;

            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            if (empty($input['department_name']) || empty($input['department_code'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Department name and code are required'
                ]);
                return;
            }

            $departmentName = trim($input['department_name']);
            $departmentCode = strtoupper(trim($input['department_code']));

            // Check if code already exists
            if ($this->departmentRepository->codeExists($departmentCode)) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => 'Department code already exists'
                ]);
                return;
            }

            // Check if name already exists
            if ($this->departmentRepository->nameExists($departmentName)) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => 'Department name already exists'
                ]);
                return;
            }

            // Create department
            $department = new Department(
                null, 
                $departmentName, 
                $departmentCode,
                isset($input['school_id']) ? $input['school_id'] : null,
                isset($input['description']) ? $input['description'] : null
            );
            $result = $this->departmentRepository->save($department);

            if ($result) {
                // Auto-create an HOD login account for this department
                try {
                    $hodUsername = 'hod_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $departmentCode));
                    $hodEmail = $hodUsername . '@tezu.ernet.in';
                    $hodPassword = password_hash('password123', PASSWORD_BCRYPT);
                    
                    $newEmpId = $this->userRepository->generateSystemAccountId('hod');
                    
                    if ($this->userRepository->findByUsername($hodUsername)) {
                        $hodUsername .= '_' . rand(10, 99);
                        $hodEmail = $hodUsername . '@tezu.ernet.in';
                    }

                    $hodUser = new User(
                        $newEmpId,
                        'HOD ' . $departmentCode,
                        $hodEmail,
                        $hodPassword,
                        'hod',
                        $department->getDepartmentId(),
                        'Professor',
                        null,
                        null,
                        null,
                        null
                    );
                    
                    $this->userRepository->save($hodUser);
                } catch (Exception $userEx) {
                    error_log("Failed to create default HOD account for department: " . $userEx->getMessage());
                }

                http_response_code(201);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'Department and HOD account created successfully',
                    'data' => [
                        'department_id' => $department->getDepartmentId(),
                        'department_name' => $department->getDepartmentName(),
                        'department_code' => $department->getDepartmentCode()
                    ]
                ]);
            } else {
                throw new Exception('Failed to create department');
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create department',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update a department (Admin only)
     */
    public function updateDepartment($departmentId)
    {
        try {
            if (!$this->requireAdmin()) return;

            $input = json_decode(file_get_contents('php://input'), true);

            // Find existing department
            $department = $this->departmentRepository->findById($departmentId);
            if (!$department) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Department not found'
                ]);
                return;
            }

            // Validate at least one field to update
            if (
                empty($input['department_name']) && 
                empty($input['department_code']) && 
                !array_key_exists('school_id', $input) && 
                !array_key_exists('description', $input)
            ) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'At least one field to update is required'
                ]);
                return;
            }

            // Update fields
            if (!empty($input['department_name'])) {
                $newName = trim($input['department_name']);
                if (
                    $newName !== $department->getDepartmentName() &&
                    $this->departmentRepository->nameExists($newName, $departmentId)
                ) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Department name already exists'
                    ]);
                    return;
                }
                $department->setDepartmentName($newName);
            }

            if (!empty($input['department_code'])) {
                $newCode = strtoupper(trim($input['department_code']));
                if (
                    $newCode !== $department->getDepartmentCode() &&
                    $this->departmentRepository->codeExists($newCode, $departmentId)
                ) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Department code already exists'
                    ]);
                    return;
                }
                $department->setDepartmentCode($newCode);
            }

            if (array_key_exists('school_id', $input)) {
                $department->setSchoolId($input['school_id']);
            }

            if (array_key_exists('description', $input)) {
                $department->setDescription($input['description']);
            }

            $result = $this->departmentRepository->save($department);

            if ($result) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'Department updated successfully',
                    'data' => [
                        'department_id' => $department->getDepartmentId(),
                        'department_name' => $department->getDepartmentName(),
                        'department_code' => $department->getDepartmentCode()
                    ]
                ]);
            } else {
                throw new Exception('Failed to update department');
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update department',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a department (Admin only)
     */
    public function deleteDepartment($departmentId)
    {
        try {
            if (!$this->requireAdmin()) return;

            // Find existing department
            $department = $this->departmentRepository->findById($departmentId);
            if (!$department) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Department not found'
                ]);
                return;
            }

            // Check if department has real non-system users
            $userCount = $this->userRepository->countByDepartment($departmentId, true);
            if ($userCount > 0) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => "Cannot delete department. It has {$userCount} real user(s) assigned."
                ]);
                return;
            }

            // Get auto-generated HOD accounts to clean up
            $hodIds = $this->userRepository->getSystemAccessorIdsByDepartment($departmentId);

            $result = $this->departmentRepository->delete($departmentId);

            if ($result) {
                // Clean up auto-generated HOD accounts associated with this department
                foreach ($hodIds as $empId) {
                    $this->userRepository->delete($empId);
                }

                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'Department deleted successfully'
                ]);
            } else {
                throw new Exception('Failed to delete department');
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete department',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Appoint Dean for a school (Admin only)
     * Creates assignment in dean_assignments table without changing user role
     */
    public function appointDean($schoolId)
    {
        if (!$this->requireAdmin()) return;

        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Validate school exists
            if (!$this->schoolRepository) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'School repository not available'
                ]);
                return;
            }

            $school = $this->schoolRepository->findById($schoolId);
            if (!$school) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'School not found'
                ]);
                return;
            }

            // Check if Dean already exists for this school via assignment table
            if (!$this->deanAssignmentRepository) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Dean assignment repository not available'
                ]);
                return;
            }

            $currentDean = $this->deanAssignmentRepository->getCurrentDean($schoolId);
            if ($currentDean) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => 'A Dean already exists for this school. Please demote the current Dean first.',
                    'current_dean' => [
                        'employee_id' => $currentDean->getEmployeeId(),
                        'start_date' => $currentDean->getStartDate()
                    ]
                ]);
                return;
            }

            // Two scenarios: assign existing user (faculty/staff) OR create new user and assign
            if (isset($data['employee_id']) && !isset($data['username'])) {
                // Scenario 1: Assign existing user as Dean
                $employeeId = (int)$data['employee_id'];
                $user = $this->userRepository->findByEmployeeId($employeeId);
                
                if (!$user) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'User not found'
                    ]);
                    return;
                }

                // Validate user is faculty or staff
                if (!in_array($user->getRole(), ['faculty', 'staff', 'dean'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Only faculty, staff, or dean members can be appointed as Dean'
                    ]);
                    return;
                }

                // Create Dean assignment (do NOT change user role)
                $assignmentObj = new DeanAssignment(
                    null,
                    $schoolId,
                    $employeeId,
                    date('Y-m-d'),
                    null,
                    1,
                    isset($data['appointment_order']) ? $data['appointment_order'] : null
                );
                $assignmentId = $this->deanAssignmentRepository->create($assignmentObj);

                if ($assignmentId) {
                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'message' => 'User assigned as Dean successfully',
                        'data' => [
                            'user' => $user->toArray(),
                            'assignment_id' => $assignmentId
                        ]
                    ]);
                } else {
                    throw new Exception("Failed to create Dean assignment");
                }
            } else {
                // Scenario 2: Create new user and assign as Dean
                $requiredFields = ['employee_id', 'username', 'email', 'password', 'role'];
                $errors = [];
                foreach ($requiredFields as $field) {
                    if (empty($data[$field])) {
                        $errors[] = "$field is required";
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

                // Validate role is faculty or staff
                if (!in_array($data['role'], ['faculty', 'staff', 'dean'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Dean must have role of faculty, staff, or dean'
                    ]);
                    return;
                }

                // Check if employee_id already exists
                if ($this->userRepository->findByEmployeeId($data['employee_id'])) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Employee ID already exists'
                    ]);
                    return;
                }

                // Check if email already exists
                if ($this->userRepository->emailExists($data['email'])) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Email already exists'
                    ]);
                    return;
                }

                // Create new user
                $newUser = new User(
                    (int)$data['employee_id'],
                    $data['username'],
                    $data['email'],
                    password_hash($data['password'], PASSWORD_DEFAULT),
                    $data['role'],  // faculty or staff
                    isset($data['department_id']) ? (int)$data['department_id'] : null,
                    isset($data['designation']) ? $data['designation'] : 'Dean',
                    isset($data['phone']) ? $data['phone'] : null
                );

                if ($this->userRepository->save($newUser)) {
                    // Create Dean assignment
                    $assignmentObj = new DeanAssignment(
                        null,
                        $schoolId,
                        (int)$data['employee_id'],
                        date('Y-m-d'),
                        null,
                        1,
                        isset($data['appointment_order']) ? $data['appointment_order'] : null
                    );
                    $assignmentId = $this->deanAssignmentRepository->create($assignmentObj);

                    if ($assignmentId) {
                        http_response_code(201);
                        echo json_encode([
                            'success' => true,
                            'message' => 'User created and assigned as Dean successfully',
                            'data' => [
                                'user' => $newUser->toArray(),
                                'assignment_id' => $assignmentId
                            ]
                        ]);
                    } else {
                        throw new Exception("Failed to create Dean assignment");
                    }
                } else {
                    throw new Exception("Failed to create user");
                }
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to appoint Dean',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Demote Dean (Admin only)
     * Ends Dean assignment without changing user role
     */
    public function demoteDean($employeeId)
    {
        if (!$this->requireAdmin()) return;

        try {
            $user = $this->userRepository->findByEmployeeId($employeeId);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'User not found'
                ]);
                return;
            }

            if (!$this->deanAssignmentRepository) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Dean assignment repository not available'
                ]);
                return;
            }

            // Find user's active Dean assignment
            // Since user may not have department_id or school_id, we need to find their assignment differently
            $allCurrentDeans = $this->deanAssignmentRepository->getAllCurrentDeans();
            $userDeanAssignment = null;
            $schoolId = null;
            
            foreach ($allCurrentDeans as $deanData) {
                if ($deanData['employee_id'] == $employeeId) {
                    $userDeanAssignment = $deanData;
                    $schoolId = $deanData['school_id'];
                    break;
                }
            }

            if (!$userDeanAssignment) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'User is not a current Dean'
                ]);
                return;
            }

            // End the Dean assignment
            $result = $this->deanAssignmentRepository->endCurrentAssignment($schoolId, date('Y-m-d'));

            if ($result) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Dean demoted successfully. User role remains unchanged.',
                    'data' => [
                        'user' => $user->toArray()
                    ]
                ]);
            } else {
                throw new Exception('Failed to end Dean assignment');
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to demote Dean',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getDeanHistory() {
        if (!$this->requireAdmin()) return;
        try {
            $schools = $this->schoolRepository->findAll();
            $history = [];
            foreach ($schools as $school) {
                if ($this->deanAssignmentRepository) {
                    $records = $this->deanAssignmentRepository->getHistoryBySchool($school['school_id']);
                    foreach ($records as $record) {
                        $record['school_name'] = $school['school_name'];
                        $record['school_code'] = $school['school_code'];
                        $history[] = $record;
                    }
                }
            }
            usort($history, function ($a, $b) {
                return strtotime($b['start_date']) - strtotime($a['start_date']);
            });
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Dean history retrieved successfully', 'data' => $history]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

}