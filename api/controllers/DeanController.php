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
    private $studentRepository;
    private $testRepository;
    private $departmentRepository;
    private $enrollmentRepository;
    private $marksRepository;
    private $hodAssignmentRepository;

    public function __construct(
        UserRepository $userRepository,
        CourseRepository $courseRepository,
        StudentRepository $studentRepository,
        TestRepository $testRepository,
        DepartmentRepository $departmentRepository,
        EnrollmentRepository $enrollmentRepository,
        MarksRepository $marksRepository,
        $hodAssignmentRepository = null
    ) {
        $this->userRepository = $userRepository;
        $this->courseRepository = $courseRepository;
        $this->studentRepository = $studentRepository;
        $this->testRepository = $testRepository;
        $this->departmentRepository = $departmentRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->marksRepository = $marksRepository;
        $this->hodAssignmentRepository = $hodAssignmentRepository;
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
            // Count users by role
            $allUsers = $this->userRepository->findAll();
            $usersByRole = [
                'hod' => 0,
                'faculty' => 0,
                'staff' => 0
            ];
            foreach ($allUsers as $user) {
                $role = $user['role'];
                if (isset($usersByRole[$role])) {
                    $usersByRole[$role]++;
                }
            }

            $stats = [
                'totalDepartments' => $this->departmentRepository->countAll(),
                'totalUsers' => $this->userRepository->countAll(),
                'totalCourses' => $this->courseRepository->countAll(),
                'totalStudents' => $this->studentRepository->countAll(),
                'totalAssessments' => $this->testRepository->countAll(),
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
    public function getAllDepartments()
    {
        if (!$this->requireDean()) return;

        try {
            $departments = $this->departmentRepository->findAll();
            
            // Enrich with counts
            $enrichedDepartments = [];
            foreach ($departments as $dept) {
                $deptId = $dept['department_id'];
                
                // Count users in department
                $users = $this->userRepository->findFacultyByDepartment($deptId);
                $facultyCount = 0;
                $staffCount = 0;
                $hodName = null;
                $hodEmployeeId = null;
                
                foreach ($users as $user) {
                    if ($user['role'] === 'faculty') $facultyCount++;
                    elseif ($user['role'] === 'staff') $staffCount++;
                    elseif ($user['role'] === 'hod') {
                        $hodName = $user['username'];
                        $hodEmployeeId = $user['employee_id'];
                    }
                }
                
                // Count courses in department
                $courses = $this->courseRepository->findByDepartment($deptId);
                
                // Count students in department
                $students = $this->studentRepository->findByDepartment($deptId);
                
                $enrichedDepartments[] = [
                    'department_id' => $deptId,
                    'department_name' => $dept['department_name'],
                    'department_code' => $dept['department_code'],
                    'hod_name' => $hodName,
                    'hod_employee_id' => $hodEmployeeId,
                    'faculty_count' => $facultyCount,
                    'staff_count' => $staffCount,
                    'course_count' => count($courses),
                    'student_count' => count($students)
                ];
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Departments retrieved successfully',
                'data' => $enrichedDepartments
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve departments',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get all users (Dean only)
     */
    public function getAllUsers()
    {
        if (!$this->requireDean()) return;

        try {
            $users = $this->userRepository->findAll();
            
            // Get department info for each user
            $enrichedUsers = [];
            foreach ($users as $user) {
                $userArray = [
                    'employee_id' => $user['employee_id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'designation' => $user['designation'] ?? null,
                    'phone' => $user['phone'] ?? null,
                    'department_id' => $user['department_id'],
                    'department_name' => $user['department_name'] ?? null,
                    'department_code' => $user['department_code'] ?? null
                ];
                
                // If department info not already in $user (though findAll was updated to include it)
                if (!$userArray['department_name'] && $user['department_id']) {
                    $dept = $this->departmentRepository->findById($user['department_id']);
                    if ($dept) {
                        $userArray['department_name'] = $dept->getDepartmentName();
                        $userArray['department_code'] = $dept->getDepartmentCode();
                    }
                }
                
                $enrichedUsers[] = $userArray;
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => $enrichedUsers
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get all courses with details (Dean only)
     */
    public function getAllCourses()
    {
        if (!$this->requireDean()) return;

        try {
            $courses = $this->courseRepository->findAll();
            
            // Enrich with faculty and department info
            $enrichedCourses = [];
            foreach ($courses as $course) {
                $courseArray = $course;
                
                // Get faculty info
                $faculty = $this->userRepository->findByEmployeeId($course['faculty_id']);
                if ($faculty) {
                    $courseArray['faculty_name'] = $faculty->getUsername();
                    
                    // Get department info from faculty
                    $deptId = $faculty->getDepartmentId();
                    if ($deptId) {
                        $dept = $this->departmentRepository->findById($deptId);
                        if ($dept) {
                            $courseArray['department_name'] = $dept->getDepartmentName();
                            $courseArray['department_code'] = $dept->getDepartmentCode();
                        }
                    }
                }
                
                // Get enrollment count
                $enrollments = $this->enrollmentRepository->findByCourseId($course['course_id']);
                $courseArray['enrollment_count'] = count($enrollments);
                
                // Get test count
                $tests = $this->testRepository->findByCourseId($course['course_id']);
                $courseArray['test_count'] = count($tests);
                
                $enrichedCourses[] = $courseArray;
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Courses retrieved successfully',
                'data' => $enrichedCourses
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
     * Get all students (Dean only)
     */
    public function getAllStudents()
    {
        if (!$this->requireDean()) return;

        try {
            $students = $this->studentRepository->findAll();
            
            // Enrich with department info
            $enrichedStudents = [];
            foreach ($students as $student) {
                $studentArray = $student;
                
                $dept = $this->departmentRepository->findById($student['department_id']);
                if ($dept) {
                    $studentArray['department_name'] = $dept->getDepartmentName();
                    $studentArray['department_code'] = $dept->getDepartmentCode();
                }
                
                $enrichedStudents[] = $studentArray;
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Students retrieved successfully',
                'data' => $enrichedStudents
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

    /**
     * Get all assessments/tests (Dean only)
     */
    public function getAllTests()
    {
        if (!$this->requireDean()) return;

        try {
            $tests = $this->testRepository->findAll();
            
            // Enrich with course and department info
            $enrichedTests = [];
            foreach ($tests as $test) {
                $testArray = $test;
                
                // Get course info
                $course = $this->courseRepository->findById($test['course_id']);
                if ($course) {
                    $testArray['course_code'] = $course->getCourseCode();
                    $testArray['course_name'] = $course->getCourseName();
                    
                    // Get faculty info
                    $faculty = $this->userRepository->findByEmployeeId($course->getFacultyId());
                    if ($faculty) {
                        $testArray['faculty_name'] = $faculty->getUsername();
                        
                        // Get department info
                        $deptId = $faculty->getDepartmentId();
                        if ($deptId) {
                            $dept = $this->departmentRepository->findById($deptId);
                            if ($dept) {
                                $testArray['department_name'] = $dept->getDepartmentName();
                                $testArray['department_code'] = $dept->getDepartmentCode();
                            }
                        }
                    }
                }
                
                $enrichedTests[] = $testArray;
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Tests retrieved successfully',
                'data' => $enrichedTests
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
     * Get department-wise analytics (Dean only)
     */
    public function getDepartmentAnalytics()
    {
        if (!$this->requireDean()) return;

        try {
            $departments = $this->departmentRepository->findAll();
            
            $analytics = [];
            foreach ($departments as $dept) {
                $deptId = $dept['department_id'];
                
                // Get courses for this department
                $courses = $this->courseRepository->findByDepartment($deptId);
                $courseIds = array_column($courses, 'id');
                
                // Count tests for these courses
                $testCount = 0;
                foreach ($courseIds as $courseId) {
                    $tests = $this->testRepository->findByCourseId($courseId);
                    $testCount += count($tests);
                }
                
                // Count students
                $students = $this->studentRepository->findByDepartment($deptId);
                
                // Count enrollments
                $totalEnrollments = 0;
                foreach ($courseIds as $courseId) {
                    $enrollments = $this->enrollmentRepository->findByCourseId($courseId);
                    $totalEnrollments += count($enrollments);
                }
                
                $analytics[] = [
                    'department_id' => $deptId,
                    'department_name' => $dept['department_name'],
                    'department_code' => $dept['department_code'],
                    'total_courses' => count($courses),
                    'total_tests' => $testCount,
                    'total_students' => count($students),
                    'total_enrollments' => $totalEnrollments
                ];
            }

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

            // Check if HOD already exists for this department via assignment table
            if (!$this->hodAssignmentRepository) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'HOD assignment repository not available'
                ]);
                return;
            }

            $currentHOD = $this->hodAssignmentRepository->getCurrentHOD($departmentId);
            if ($currentHOD) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => 'An HOD already exists for this department. Please demote the current HOD first.',
                    'current_hod' => $currentHOD
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

                if ($user->getRole() !== 'faculty') {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Only faculty members can be appointed as HOD'
                    ]);
                    return;
                }

                // Create HOD assignment (do NOT change user role)
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

                if ($this->userRepository->save($newUser)) {
                    // Create HOD assignment
                    $assignmentObj = new HODAssignment(
                        null,
                        $departmentId,
                        (int)$data['employee_id'],
                        date('Y-m-d'),
                        null,
                        1,
                        isset($data['appointment_order']) ? $data['appointment_order'] : null
                    );
                    $assignmentId = $this->hodAssignmentRepository->create($assignmentObj);

                    if ($assignmentId) {
                        http_response_code(201);
                        echo json_encode([
                            'success' => true,
                            'message' => 'User created and assigned as HOD successfully',
                            'data' => [
                                'user' => $newUser->toArray(),
                                'assignment_id' => $assignmentId
                            ]
                        ]);
                    } else {
                        throw new Exception("Failed to create HOD assignment");
                    }
                } else {
                    throw new Exception("Failed to create user");
                }
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to appoint HOD',
                'error' => $e->getMessage()
            ]);
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
