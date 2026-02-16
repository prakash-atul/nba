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
    public function getAllDepartments()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) {
                throw new Exception("School ID not found in user session.");
            }

            $departments = $this->departmentRepository->findBySchool($schoolId);
            
            // Enrich with counts
            $enrichedDepartments = [];
            foreach ($departments as $dept) {
                $deptId = $dept['department_id'];
                
                // Count users in department
                // Assuming findFacultyByDepartment gets all users (name is slightly misleading based on usage elsewhere, 
                $users = $this->userRepository->findFacultyByDepartment($deptId);

                $facultyCount = 0;
                $staffCount = 0;
                
                // Use HOD Repository for accurate HOD info
                $hodName = null;
                $hodEmployeeId = null;
                if ($this->hodAssignmentRepository) {
                    $hodAssignment = $this->hodAssignmentRepository->getCurrentHOD($deptId);
                    if ($hodAssignment) {
                        $hodUser = $this->userRepository->findByEmployeeId($hodAssignment->getEmployeeId());
                        if ($hodUser) {
                            $hodName = $hodUser->getUsername();
                            $hodEmployeeId = $hodUser->getEmployeeId();
                        }
                    }
                }

                if (is_array($users)) {
                    foreach ($users as $user) {
                        // $user might be array or object depending on repository return type, previous code treated as array.
                        // UserRepository usually returns objects or arrays. Previous code used array access $user['role'].
                        // My finding suggests repository returns objects for findBy... but findAll returned arrays.
                        // Let's be safe and check.
                        $role = is_object($user) ? $user->getRole() : ($user['role'] ?? '');
                        
                        if ($role === 'faculty') $facultyCount++;
                        elseif ($role === 'staff') $staffCount++;
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
                    'hod_name' => $hodName ?? 'Not Assigned', // Explicitly set Not Assigned if null
                    'hod_employee_id' => $hodEmployeeId,
                    'faculty_count' => $facultyCount,
                    'staff_count' => $staffCount,
                    'course_count' => is_array($courses) ? count($courses) : 0,
                    'student_count' => is_array($students) ? count($students) : 0
                ];
            }
            
            echo json_encode(['status' => 'success', 'data' => $enrichedDepartments]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get all users (Dean only) - filtered by school
     */
    public function getAllUsers()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) {
                throw new Exception("School ID not found in user session.");
            }

            $users = $this->userRepository->findBySchool($schoolId);
            
            // Get department info for each user
            $enrichedUsers = [];
            foreach ($users as $user) {
                // Determine if user is HOD
                $isHod = false;
                if ($this->hodAssignmentRepository && $user->getDepartmentId()) {
                    $hodAssignment = $this->hodAssignmentRepository->getCurrentHOD($user->getDepartmentId());
                    if ($hodAssignment && $hodAssignment->getEmployeeId() == $user->getEmployeeId()) {
                        $isHod = true;
                    }
                }

                $userArray = [
                    'employee_id' => $user->getEmployeeId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail(),
                    'role' => $user->getRole(), // Base role
                    'is_hod' => $isHod, // Add explicit flag
                    'designation' => $user->getDesignation() ?? null,
                    'phone' => $user->getPhone() ?? null,
                    'department_id' => $user->getDepartmentId(),
                    'department_name' => null,
                    'department_code' => null
                ];
                
                // Get department info
                if ($user->getDepartmentId()) {
                    $dept = $this->departmentRepository->findById($user->getDepartmentId());
                    if($dept) {
                       $userArray['department_name'] = $dept->getDepartmentName();
                       $userArray['department_code'] = $dept->getDepartmentCode();
                    }
                }
                
                $enrichedUsers[] = $userArray;
            }

            echo json_encode(['status' => 'success', 'data' => $enrichedUsers]);
        } catch (Exception $e) {
             http_response_code(500);
             echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get all courses (Dean only) - filtered by school
     */
    public function getAllCourses()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) {
                throw new Exception("School ID not found in user session.");
            }

            $courses = $this->courseRepository->findBySchool($schoolId);
            
            // Enrich with faculty and department info
            $enrichedCourses = [];
            foreach ($courses as $course) {
                $courseArray = [
                    'course_id' => $course->getCourseId(),
                    'course_code' => $course->getCourseCode(),
                    'course_name' => $course->getCourseName(),
                    'year' => $course->getYear(),
                    'semester' => $course->getSemester(),
                    'department_id' => $course->getDepartmentId(),
                    'faculty_name' => null,
                    'department_name' => null,
                    'department_code' => null
                ];
                
                // Get faculty info
                $faculty = $this->userRepository->findByEmployeeId($course->getFacultyId());
                if ($faculty) {
                    $courseArray['faculty_name'] = $faculty->getUsername();
                }

                // Get department info
                if ($course->getDepartmentId()) {
                    $dept = $this->departmentRepository->findById($course->getDepartmentId());
                    if ($dept) {
                        $courseArray['department_name'] = $dept->getDepartmentName();
                        $courseArray['department_code'] = $dept->getDepartmentCode();
                    }
                }
                
                $enrichedCourses[] = $courseArray;
            }

            echo json_encode(['status' => 'success', 'data' => $enrichedCourses]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }



    /**
     * Get all students (Dean only)
     */
    public function getAllStudents()
    {
        if (!$this->requireDean()) return;

        try {
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) {
                throw new Exception("School ID not found in user session.");
            }

            $students = $this->studentRepository->findBySchool($schoolId);
            
            // Enrich with department info
            $enrichedStudents = [];
            foreach ($students as $student) {
                $studentArray = [
                    'roll_no' => $student->getRollNo(),
                    'student_name' => $student->getStudentName(),
                    'department_id' => $student->getDepartmentId(),
                    'batch_year' => $student->getBatchYear(),
                    'student_status' => $student->getStudentStatus(),
                    'email' => $student->getEmail(),
                    'phone' => $student->getPhone(),
                    'department_name' => null,
                    'department_code' => null
                ];
                
                $dept = $this->departmentRepository->findById($student->getDepartmentId());
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
            $schoolId = $_REQUEST['authenticated_user']['school_id'] ?? null;
            if (!$schoolId) {
                throw new Exception("School ID not found in user session.");
            }

            $departments = $this->departmentRepository->findBySchool($schoolId);
            
            $analytics = [];
            foreach ($departments as $dept) {
                $deptId = $dept['department_id'];
                
                // Get courses for this department
                // Assuming findByDepartment returns array of Course objects
                $courses = $this->courseRepository->findByDepartment($deptId);
                $courseIds = [];
                if (is_array($courses)) {
                    foreach ($courses as $c) {
                        if (is_object($c) && method_exists($c, 'getCourseId')) {
                            $courseIds[] = $c->getCourseId();
                        } elseif (is_array($c)) {
                            $courseIds[] = $c['course_id'];
                        }
                    }
                }
                
                // Count tests for these courses
                $testCount = 0;
                foreach ($courseIds as $courseId) {
                    $tests = $this->testRepository->findByCourseId($courseId);
                    $testCount += is_array($tests) ? count($tests) : 0;
                }
                
                // Count students
                $students = $this->studentRepository->findByDepartment($deptId);
                
                // Count enrollments
                $totalEnrollments = 0;
                foreach ($courseIds as $courseId) {
                    $enrollments = $this->enrollmentRepository->findByCourseId($courseId);
                    $totalEnrollments += is_array($enrollments) ? count($enrollments) : 0;
                }
                
                $analytics[] = [
                    'department_id' => $deptId,
                    'department_name' => $dept['department_name'],
                    'department_code' => $dept['department_code'],
                    'total_courses' => is_array($courses) ? count($courses) : 0,
                    'total_tests' => $testCount,
                    'total_students' => is_array($students) ? count($students) : 0,
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
