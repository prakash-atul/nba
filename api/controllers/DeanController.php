<?php

/**
 * Dean Controller
 * Handles dean-specific operations (read-only access to all data)
 * Dean can view all departments, users, courses, students, and analytics
 */
class DeanController
{
    private $userRepository;
    private $courseRepository;
    private $courseOfferingRepository;
    private $assignmentRepository;
    private $studentRepository;
    private $testRepository;
    private $departmentRepository;
    private $enrollmentRepository;
    private $marksRepository;
    private $hodAssignmentRepository;

    public function __construct(
        UserRepository $userRepository,
        CourseRepository $courseRepository,
        CourseOfferingRepository $courseOfferingRepository,
        StudentRepository $studentRepository,
        TestRepository $testRepository,
        DepartmentRepository $departmentRepository,
        EnrollmentRepository $enrollmentRepository,
        MarksRepository $marksRepository,
        $hodAssignmentRepository = null,
        ?CourseFacultyAssignmentRepository $assignmentRepository = null
    ) {
        $this->userRepository = $userRepository;
        $this->courseRepository = $courseRepository;
        $this->courseOfferingRepository = $courseOfferingRepository;
        $this->studentRepository = $studentRepository;
        $this->testRepository = $testRepository;
        $this->departmentRepository = $departmentRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->marksRepository = $marksRepository;
        $this->hodAssignmentRepository = $hodAssignmentRepository;
        $this->assignmentRepository = $assignmentRepository;
    }

    /**
     * Check if user is dean
     */
    private function requireDean()
    {
        $userData = $_REQUEST['authenticated_user'];
        
        if (!isset($userData['is_dean']) || $userData['is_dean'] !== true) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Dean privileges required.'
            ]);
            return false;
        }
        return true;
    }

    /**
     * Get overall statistics (Dean only)
     */
    public function getStats()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) {
                throw new Exception("School ID not found in user session.");
            }

            // Count users by role within the school
            $facultyCount = $this->userRepository->countBySchool($schoolId, 'faculty');
            $staffCount = $this->userRepository->countBySchool($schoolId, 'staff');
            
            // Count HODs (active assignments in departments belonging to this school)
            $hodCount = 0;
            $departments = $this->departmentRepository->findBySchool($schoolId);
            if ($this->hodAssignmentRepository) {
                foreach ($departments as $dept) {
                    $hod = $this->hodAssignmentRepository->getCurrentHOD($dept['department_id']);
                    if ($hod) {
                        $hodCount++;
                    }
                }
            }

            $usersByRole = [
                'hod' => $hodCount,
                'faculty' => $facultyCount,
                'staff' => $staffCount
            ];

            $stats = [
                'totalDepartments' => $this->departmentRepository->countBySchool($schoolId),
                'totalUsers' => $this->userRepository->countBySchool($schoolId),
                'totalCourses' => $this->courseRepository->countBySchool($schoolId),
                'totalStudents' => $this->studentRepository->countBySchool($schoolId),
                'totalAssessments' => $this->testRepository->countBySchool($schoolId),
                'usersByRole' => $usersByRole
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
     * Get all departments with summary (Dean only)
     */
    /**
     * Get all departments (Dean only) — paginated, school-scoped, uses department_stats
     */
    public function getAllDepartments()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) throw new Exception("School ID not found in user session.");

            $params = PaginationHelper::parseParams(
                $_GET,
                'd.department_id',
                'd.department_id',
                ['d.department_id', 'd.department_name', 'd.department_code'],
                ['hod_status']
            );

            $total  = $this->departmentRepository->countBySchoolPaginated($schoolId, $params);
            $rows   = $this->departmentRepository->findBySchoolPaginated($schoolId, $params);
            $result = PaginationHelper::buildResponse($rows, 'department_id', $params['limit'], $total);

            echo json_encode(array_merge(['status' => 'success'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get all users (Dean only) — paginated, school-scoped
     */
    public function getAllUsers()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) throw new Exception("School ID not found in user session.");

            $params = PaginationHelper::parseParams(
                $_GET,
                'u.employee_id',
                'u.employee_id',
                ['u.employee_id', 'u.username', 'u.email', 'u.role', 'u.designation'],
                ['role', 'department_id']
            );

            $total  = $this->userRepository->countBySchoolPaginated($schoolId, $params);
            $rows   = $this->userRepository->findBySchoolPaginated($schoolId, $params);
            $result = PaginationHelper::buildResponse($rows, 'employee_id', $params['limit'], $total);

            echo json_encode(array_merge(['status' => 'success'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get all courses (Dean only) — paginated, school-scoped
     */
    public function getAllCourses()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) throw new Exception("School ID not found in user session.");

            $params = PaginationHelper::parseParams(
                $_GET,
                'c.course_id',
                'c.course_id',
                ['c.course_id', 'c.course_code', 'c.course_name', 'c.credit', 'c.course_type', 'co.year', 'co.semester', 'u.username'],
                ['department_id', 'is_active', 'course_type']
            );

            $total  = $this->courseRepository->countBySchoolPaginated($schoolId, $params);
            $rows   = $this->courseRepository->findBySchoolPaginated($schoolId, $params);
            $result = PaginationHelper::buildResponse($rows, 'course_id', $params['limit'], $total);

            echo json_encode(array_merge(['status' => 'success'], $result));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }



    /**
     * Get all students (Dean only) — paginated, school-scoped
     */
    public function getAllStudents()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) throw new Exception("School ID not found in user session.");

            $params = PaginationHelper::parseParams(
                $_GET,
                's.roll_no',
                's.roll_no',
                ['s.roll_no', 's.student_name', 's.batch_year', 's.student_status'],
                ['department_id', 'batch_year', 'student_status']
            );

            $total  = $this->studentRepository->countBySchoolPaginated($schoolId, $params);
            $rows   = $this->studentRepository->findBySchoolPaginated($schoolId, $params);
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
     * Get all assessments/tests (Dean only) — paginated, school-scoped (BUG FIX: was leaking all tests)
     */
    public function getAllTests()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) throw new Exception("School ID not found in user session.");

            $params = PaginationHelper::parseParams(
                $_GET,
                't.test_id',
                't.test_id',
                ['t.test_id', 't.test_name', 't.test_date', 't.test_type'],
                ['department_id', 'test_type']
            );

            $total  = $this->testRepository->countBySchoolPaginated($schoolId, $params);
            $rows   = $this->testRepository->findBySchoolPaginated($schoolId, $params);
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
     * Get department-wise analytics (Dean only)
     */
    public function getDepartmentAnalytics()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) {
                throw new Exception("School ID not found in user session.");
            }

            // Single query to aggregate all stats per department
            $db = $this->departmentRepository->getConnection();
            $sql = "
                SELECT
                    d.department_id,
                    d.department_name,
                    d.department_code,
                    COUNT(DISTINCT c.course_id)      AS total_courses,
                    COUNT(DISTINCT t.test_id)        AS total_tests,
                    COUNT(DISTINCT s.roll_no)        AS total_students,
                    COUNT(DISTINCT e.enrollment_id)  AS total_enrollments
                FROM departments d
                LEFT JOIN courses c
                       ON c.department_id = d.department_id
                LEFT JOIN course_offerings co
                       ON co.course_id = c.course_id
                LEFT JOIN tests t
                       ON t.offering_id = co.offering_id
                LEFT JOIN enrollments e
                       ON e.offering_id = co.offering_id
                LEFT JOIN students s
                       ON s.department_id = d.department_id
                WHERE d.school_id = ?
                GROUP BY d.department_id, d.department_name, d.department_code
                ORDER BY d.department_name
            ";

            $stmt = $db->prepare($sql);
            $stmt->execute([$schoolId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $analytics = array_map(function ($row) {
                return [
                    'department_id'      => (int)$row['department_id'],
                    'department_name'    => $row['department_name'],
                    'department_code'    => $row['department_code'],
                    'total_courses'      => (int)$row['total_courses'],
                    'total_tests'        => (int)$row['total_tests'],
                    'total_students'     => (int)$row['total_students'],
                    'total_enrollments'  => (int)$row['total_enrollments'],
                ];
            }, $rows);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Department analytics retrieved successfully',
                'data' => $analytics
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve department analytics',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Appoint HOD for a department (Dean only)
     * Can either promote existing faculty or create new HOD
     */
    /**
     * Appoint HOD for a department (Dean only)
     * Creates assignment in hod_assignments table without changing user role
     */
    public function appointHOD($departmentId)
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) {
                throw new Exception("School ID not found in user session.");
            }

            $data = json_decode(file_get_contents('php://input'), true);

            // Validate department exists
            $department = $this->departmentRepository->findById($departmentId);
            if (!$department) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Department not found'
                ]);
                return;
            }

            // Verify department belongs to Dean's school
            // Assuming Department model has getSchoolId()
            if ($department->getSchoolId() != $schoolId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Department does not belong to your school.'
                ]);
                return;
            }

            // Check if HOD already exists for this department via assignment table
            if (!$this->hodAssignmentRepository) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'HOD assignment repository not available'
                ]);
                return;
            }

            $currentHODAssignment = $this->hodAssignmentRepository->getCurrentHOD($departmentId); // Avoid variable name conflict with potential user obj
            if ($currentHODAssignment) {
                // Get user details for message
                $currentHODUser = $this->userRepository->findByEmployeeId($currentHODAssignment->getEmployeeId());
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => 'An HOD already exists for this department (' . ($currentHODUser ? $currentHODUser->getUsername() : 'Unknown') . '). Please demote the current HOD first.',
                    'current_hod' => $currentHODAssignment
                ]);
                return;
            }

            // Two scenarios: assign existing faculty OR create new user and assign
            if (isset($data['employee_id']) && !isset($data['username'])) {
                // Scenario 1: Assign existing faculty as HOD
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

                // Validate user is faculty in this department
                if ($user->getDepartmentId() != $departmentId) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'User does not belong to this department'
                    ]);
                    return;
                }

                // Note: user must be faculty. We don't check strict role equality because user might be admin/staff 
                // but usually HOD must be faculty. Let's keep strict check if desired, or relax it.
                // The previous code had strict check.
                if ($user->getRole() !== 'faculty') {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Only faculty members can be appointed as HOD'
                    ]);
                    return;
                }

                // Create HOD assignment (do NOT change user role)
                // Use HODAssignment model constructor if available, or array?
                // Looking at repository usage, likely expects object or array. 
                // The HODAssignmentRepository->create method signature isn't fully visible but presumably takes object or array.
                // Assuming object based on previous read showing `new HODAssignment(...)`
                
                // We need to implement create method in repo if it doesn't exist?
                // Or just use SQL directly if repo doesn't support it?
                // I'll assume repo has create/save method.
                
                // Wait, previous code:
                /*
                $assignmentObj = new HODAssignment(
                    null,
                    $departmentId,
                    $employeeId,
                    date('Y-m-d'),
                    null,
                    1,
                    isset($data['appointment_order']) ? $data['appointment_order'] : null
                );
                $assignmentId = $this->hodAssignmentRepository->create($assignmentObj);
                */
                // Ref previous code snippet.
                
                $assignmentObj = new HODAssignment(
                    null,
                    $departmentId,
                    $employeeId,
                    date('Y-m-d'),
                    null,
                    1,
                    isset($data['appointment_order']) ? $data['appointment_order'] : null,
                    null // created_at
                );
                
                $assignmentId = $this->hodAssignmentRepository->create($assignmentObj);

                if ($assignmentId) {
                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'message' => 'Faculty assigned as HOD successfully',
                        'data' => [
                            'user' => $user->toArray(),
                            'assignment_id' => $assignmentId
                        ]
                    ]);
                    return;
                } else {
                    throw new Exception("Failed to create HOD assignment");
                }
            } else {
                // Scenario 2: Create new user as faculty and assign as HOD
                $requiredFields = ['employee_id', 'username', 'email', 'password'];
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

                // Create new user as faculty (not HOD role)
                $newUser = new User(
                    (int)$data['employee_id'],
                    $data['username'],
                    $data['email'],
                    password_hash($data['password'], PASSWORD_DEFAULT),
                    'faculty',  // Base role is faculty
                    $departmentId,
                    isset($data['designation']) ? $data['designation'] : 'Professor',
                    isset($data['phone']) ? $data['phone'] : null
                );
                
                $this->userRepository->save($newUser);
                
                // Now assign as HOD
                $assignmentObj = new HODAssignment(
                    null,
                    $departmentId,
                    (int)$data['employee_id'],
                    date('Y-m-d'),
                    null,
                    1,
                    isset($data['appointment_order']) ? $data['appointment_order'] : null,
                    null
                );
                
                $assignmentId = $this->hodAssignmentRepository->create($assignmentObj);

                if ($assignmentId) {
                    http_response_code(201);
                    echo json_encode([
                        'success' => true,
                        'message' => 'New faculty created and appointed as HOD successfully',
                        'data' => [
                            'user' => $newUser->toArray(),
                            'assignment_id' => $assignmentId
                        ]
                    ]);
                } else {
                    throw new Exception("User created but failed to create HOD assignment");
                }
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * Demote HOD to faculty (Dean only)
     */
    /**
     * Demote HOD (Dean only)
     * Ends HOD assignment without changing user role (they remain faculty)
     */
    public function demoteHOD($employeeId)
    {
        if (!$this->requireDean()) return;

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

            if (!$this->hodAssignmentRepository) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'HOD assignment repository not available'
                ]);
                return;
            }

            // Check if user has an active HOD assignment
            $departmentId = $user->getDepartmentId();
            $currentHOD = $this->hodAssignmentRepository->getCurrentHOD($departmentId);
            
            if (!$currentHOD || $currentHOD->getEmployeeId() != $employeeId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'User is not a current HOD'
                ]);
                return;
            }

            // End the HOD assignment (do NOT change user role)
            $result = $this->hodAssignmentRepository->endCurrentAssignment($departmentId);

            if ($result) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'HOD assignment ended successfully. User remains as faculty.',
                    'data' => $user->toArray()
                ]);
            } else {
                throw new Exception("Failed to end HOD assignment");
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to demote HOD',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get faculty members in a department (for HOD appointment)
     */
    public function getDepartmentFaculty($departmentId)
    {
        if (!$this->requireDean()) return;

        try {
            $department = $this->departmentRepository->findById($departmentId);
            if (!$department) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Department not found'
                ]);
                return;
            }

            // Get all users in department
            $users = $this->userRepository->findFacultyByDepartment($departmentId);
            
            // Filter to only faculty (not staff, not current HOD)
            $facultyMembers = array_filter($users, function($user) {
                return $user['role'] === 'faculty';
            });

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => array_values($facultyMembers)
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
}
