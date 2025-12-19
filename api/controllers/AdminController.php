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

    public function __construct(
        UserRepository $userRepository,
        CourseRepository $courseRepository,
        StudentRepository $studentRepository,
        TestRepository $testRepository,
        DepartmentRepository $departmentRepository
    ) {
        $this->userRepository = $userRepository;
        $this->courseRepository = $courseRepository;
        $this->studentRepository = $studentRepository;
        $this->testRepository = $testRepository;
        $this->departmentRepository = $departmentRepository;
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
     * Get all courses (Admin only)
     */
    public function getAllCourses()
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

            $courses = $this->courseRepository->findAll();

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Courses retrieved successfully',
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
     * Get all students (Admin only)
     */
    public function getAllStudents()
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

            $students = $this->studentRepository->findAll();

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Students retrieved successfully',
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

    /**
     * Get all tests (Admin only)
     */
    public function getAllTests()
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

            $tests = $this->testRepository->findAll();

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Tests retrieved successfully',
                'data' => $tests
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
}
