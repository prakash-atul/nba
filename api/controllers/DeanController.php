<?php

/**
 * Dean Controller
 * Handles dean-specific operations (read-only access to all data)
 * Dean can view all departments, users, courses, students, and analytics
 */
class DeanController
{
    protected $auditService;

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
    , ?AuditService $auditService = null) {
        $this->auditService = $auditService;

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
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('DeanController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
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
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('DeanController', 'getStats prompt', ['error' => $e->getMessage()]); }
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
                ['department_id', 'is_active', 'course_type', 'year', 'semester']
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
                ['department_id', 'batch_year', 'student_status', 'course_code']
            );

            $total  = $this->studentRepository->countBySchoolPaginated($schoolId, $params);
            $rows   = $this->studentRepository->findBySchoolPaginated($schoolId, $params);
            $result = PaginationHelper::buildResponse($rows, 'roll_no', $params['limit'], $total);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(array_merge(['success' => true, 'message' => 'Students retrieved successfully'], $result));
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('DeanController', 'getAllStudents prompt', ['error' => $e->getMessage()]); }
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
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('DeanController', 'getAllTests prompt', ['error' => $e->getMessage()]); }
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
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('DeanController', 'getDepartmentAnalytics prompt', ['error' => $e->getMessage()]); }
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
     * Creates an hod_assignments record to track which faculty/staff member
     * is the serving HOD. This is record-keeping only — the selected user's
     * role is NOT changed. The HOD interface is always accessed via the
     * permanent dedicated HOD account (e.g. hod_cse@tezu.ac.in).
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
                if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->warn('DeanController', 'Unauthorized access attempt', ['user' => $_REQUEST['authenticated_user'] ?? 'anonymous']); }
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

            // Assign existing faculty as HOD
            if (empty($data['employee_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'employee_id is required'
                ]);
                return;
            }

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

            if ($user->getRole() === 'hod') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Dedicated HOD accounts cannot be appointed — select a faculty or staff member'
                ]);
                return;
            }

            if (!in_array($user->getRole(), ['faculty', 'staff'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Only faculty or staff members can be recorded as serving HOD'
                ]);
                return;
            }

            // Create HOD assignment record
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
                // Record-only — do NOT change the user's role.
                // The HOD interface is accessed via the permanent HOD account.

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Faculty recorded as serving HOD successfully',
                    'data' => [
                        'user' => $user->toArray(),
                        'assignment_id' => $assignmentId
                    ]
                ]);
            } else {
                throw new Exception("Failed to create HOD assignment");
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * End HOD assignment (Dean only)
     * Ends the hod_assignments record. The user's role is NOT changed
     * because it was never changed — appointments are record-only.
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

            // End the HOD assignment and revert user role to faculty
            $result = $this->hodAssignmentRepository->endCurrentAssignment($departmentId);

            if ($result) {
                // Record-only — do NOT change user role.

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'HOD assignment ended successfully.',
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
    /**
     * Get full HOD assignment history for all departments in the Dean's school
     */
    public function getHODHistory()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) throw new Exception('School ID not found in user session.');

            // Get all departments in this school
            $departments = $this->departmentRepository->findBySchool($schoolId);

            $history = [];
            foreach ($departments as $dept) {
                $records = $this->hodAssignmentRepository->getHistoryByDepartment($dept['department_id']);
                foreach ($records as $record) {
                    $record['department_name'] = $dept['department_name'];
                    $record['department_code'] = $dept['department_code'];
                    $history[] = $record;
                }
            }

            // Sort by start_date descending
            usort($history, function($a, $b) {
                return strcmp($b['start_date'], $a['start_date']);
            });

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $history
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

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
            
            // Filter to faculty and staff (exclude dedicated HOD accounts)
            $facultyMembers = array_filter($users, function($user) {
                return in_array($user['role'], ['faculty', 'staff']);
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
