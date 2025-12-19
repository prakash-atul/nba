<?php

/**
 * API Routes Configuration
 * Follows Single Responsibility Principle - handles only routing
 */

// Include all necessary classes
require_once __DIR__ . '/../config/DatabaseConfig.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/UserRepository.php';
require_once __DIR__ . '/../models/Department.php';
require_once __DIR__ . '/../models/DepartmentRepository.php';
require_once __DIR__ . '/../models/Course.php';
require_once __DIR__ . '/../models/CourseRepository.php';
require_once __DIR__ . '/../models/Test.php';
require_once __DIR__ . '/../models/TestRepository.php';
require_once __DIR__ . '/../models/Question.php';
require_once __DIR__ . '/../models/QuestionRepository.php';
require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../models/StudentRepository.php';
require_once __DIR__ . '/../models/RawMarks.php';
require_once __DIR__ . '/../models/RawMarksRepository.php';
require_once __DIR__ . '/../models/Marks.php';
require_once __DIR__ . '/../models/MarksRepository.php';
require_once __DIR__ . '/../models/Enrollment.php';
require_once __DIR__ . '/../models/EnrollmentRepository.php';
require_once __DIR__ . '/../models/AttainmentScale.php';
require_once __DIR__ . '/../models/AttainmentScaleRepository.php';
require_once __DIR__ . '/../utils/JWTService.php';
require_once __DIR__ . '/../utils/AuthService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/ValidationMiddleware.php';
require_once __DIR__ . '/../middleware/CorsMiddleware.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/AssessmentController.php';
require_once __DIR__ . '/../controllers/MarksController.php';
require_once __DIR__ . '/../controllers/EnrollmentController.php';
require_once __DIR__ . '/../controllers/AttainmentController.php';
require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../controllers/HODController.php';

/**
 * Router Class
 * Handles HTTP request routing
 */
class Router
{
    private $corsMiddleware;
    private $authMiddleware;
    private $userController;
    private $assessmentController;
    private $marksController;
    private $enrollmentController;
    private $attainmentController;
    private $adminController;
    private $hodController;

    public function __construct()
    {
        // Initialize database connection
        $dbConfig = new DatabaseConfig();
        $db = $dbConfig->getConnection();

        // Initialize repositories and services
        $userRepository = new UserRepository($db);
        $departmentRepository = new DepartmentRepository($db);
        $courseRepository = new CourseRepository($db);
        $testRepository = new TestRepository($db);
        $questionRepository = new QuestionRepository($db);
        $studentRepository = new StudentRepository($db);
        $rawMarksRepository = new RawMarksRepository($db);
        $marksRepository = new MarksRepository($db);
        $attainmentScaleRepository = new AttainmentScaleRepository($db);
        $jwtService = new JWTService();
        $authService = new AuthService($userRepository, $jwtService, $departmentRepository);

        // Initialize middleware
        $this->corsMiddleware = new CorsMiddleware();
        $this->authMiddleware = new AuthMiddleware($authService);

        // Initialize validation middleware
        $validationMiddleware = new ValidationMiddleware();

        // Initialize controllers
        $this->userController = new UserController($authService, $userRepository, $departmentRepository, $validationMiddleware);
        $this->assessmentController = new AssessmentController($courseRepository, $testRepository, $questionRepository, $validationMiddleware);
        $this->marksController = new MarksController($studentRepository, $rawMarksRepository, $marksRepository, $questionRepository, $testRepository, $validationMiddleware, $courseRepository);
        $this->enrollmentController = new EnrollmentController($db);
        $this->attainmentController = new AttainmentController($courseRepository, $attainmentScaleRepository);
        $this->adminController = new AdminController($userRepository, $courseRepository, $studentRepository, $testRepository, $departmentRepository);
        $this->hodController = new HODController($userRepository, $courseRepository, $departmentRepository, $validationMiddleware);
    }

    /**
     * Handle incoming request
     */
    public function handleRequest()
    {
        // Set CORS headers for all requests
        $this->corsMiddleware->setCorsHeaders();

        // Handle preflight requests
        $this->corsMiddleware->handlePreflight();

        // Get request method and path
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Remove base path (/nba/api/)
        $basePath = '/nba/api/';
        if (strpos($path, $basePath) === 0) {
            $path = substr($path, strlen($basePath));
        }

        // Route requests
        switch ($path) {
            case '':
            case '/':
                // Root endpoint - API info
                $this->sendWelcome();
                break;

            case 'login':
                if ($method === 'POST') {
                    $this->userController->login();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'profile':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->userController->getProfile();
                } elseif ($method === 'PUT') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->userController->updateProfile();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'logout':
                if ($method === 'POST') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $_REQUEST['token'] = $this->authMiddleware->getTokenFromHeader();
                    $this->userController->logout();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'department':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->userController->getDepartmentByEmployeeId();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'departments':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->userController->getAllDepartments();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            // Admin routes
            case 'admin/stats':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->adminController->getStats();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'admin/users':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->userController->getAllUsers();
                } elseif ($method === 'POST') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->userController->createUser();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'admin/courses':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->adminController->getAllCourses();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'admin/students':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->adminController->getAllStudents();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'admin/tests':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->adminController->getAllTests();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            // HOD routes
            case 'hod/stats':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->hodController->getStats();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'hod/courses':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->hodController->getDepartmentCourses();
                } elseif ($method === 'POST') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->hodController->createCourse();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'hod/faculty':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->hodController->getDepartmentFaculty();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'courses':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->assessmentController->getFacultyCourses();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'assessment':
                if ($method === 'POST') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->assessmentController->createAssessment();
                } elseif ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->assessmentController->getAssessment();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'course-tests':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->assessmentController->getCourseTests();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'marks/by-question':
                if ($method === 'POST') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->marksController->saveMarksByQuestion();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'marks/by-co':
                if ($method === 'POST') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->marksController->saveMarksByCO();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'marks':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->marksController->getMarks();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'marks/test':
                if ($method === 'GET') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->marksController->getTestMarks();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            case 'marks/bulk':
                if ($method === 'POST') {
                    $user = $this->authMiddleware->requireAuth();
                    $_REQUEST['authenticated_user'] = $user;
                    $this->marksController->bulkSaveMarks();
                } else {
                    $this->sendMethodNotAllowed();
                }
                break;

            default:
                // Handle dynamic routes
                if (preg_match('#^courses/(\d+)/enroll$#', $path, $matches)) {
                    $courseId = $matches[1];
                    if ($method === 'POST') {
                        $user = $this->authMiddleware->requireAuth();
                        $this->enrollmentController->bulkEnroll($courseId, $user['employee_id']);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } elseif (preg_match('#^courses/(\d+)/enrollments$#', $path, $matches)) {
                    $courseId = $matches[1];
                    if ($method === 'GET') {
                        $user = $this->authMiddleware->requireAuth();
                        $this->enrollmentController->getEnrollments($courseId, $user['employee_id']);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } elseif (preg_match('#^courses/(\d+)/attainment-config$#', $path, $matches)) {
                    $courseId = (int)$matches[1];
                    if ($method === 'GET') {
                        $user = $this->authMiddleware->requireAuth();
                        $this->attainmentController->getConfig($courseId);
                    } elseif ($method === 'POST') {
                        $user = $this->authMiddleware->requireAuth();
                        $this->attainmentController->saveConfig($courseId);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } elseif (preg_match('#^courses/(\d+)/enroll/([A-Za-z0-9]+)$#', $path, $matches)) {
                    $courseId = $matches[1];
                    $rollno = $matches[2];
                    if ($method === 'DELETE') {
                        $user = $this->authMiddleware->requireAuth();
                        $this->enrollmentController->removeEnrollment($courseId, $rollno, $user['employee_id']);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } elseif (preg_match('#^questions/(\d+)$#', $path, $matches)) {
                    $questionId = $matches[1];
                    if ($method === 'PUT') {
                        $user = $this->authMiddleware->requireAuth();
                        $_REQUEST['authenticated_user'] = $user;
                        $this->assessmentController->updateQuestion($questionId);
                    } elseif ($method === 'DELETE') {
                        $user = $this->authMiddleware->requireAuth();
                        $_REQUEST['authenticated_user'] = $user;
                        $this->assessmentController->deleteQuestion($questionId);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } elseif (preg_match('#^marks/raw/(\d+)$#', $path, $matches)) {
                    $rawMarksId = $matches[1];
                    if ($method === 'PUT') {
                        $user = $this->authMiddleware->requireAuth();
                        $_REQUEST['authenticated_user'] = $user;
                        $this->marksController->updateRawMarks($rawMarksId);
                    } elseif ($method === 'DELETE') {
                        $user = $this->authMiddleware->requireAuth();
                        $_REQUEST['authenticated_user'] = $user;
                        $this->marksController->deleteRawMarks($rawMarksId);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } elseif (preg_match('#^marks/student/(\d+)/([A-Za-z0-9]+)$#', $path, $matches)) {
                    $testId = $matches[1];
                    $studentId = $matches[2];
                    if ($method === 'DELETE') {
                        $user = $this->authMiddleware->requireAuth();
                        $_REQUEST['authenticated_user'] = $user;
                        $this->marksController->deleteStudentMarks($testId, $studentId);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } elseif (preg_match('#^admin/users/(\d+)$#', $path, $matches)) {
                    $employeeId = $matches[1];
                    if ($method === 'DELETE') {
                        $user = $this->authMiddleware->requireAuth();
                        $_REQUEST['authenticated_user'] = $user;
                        $this->userController->deleteUser($employeeId);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } elseif (preg_match('#^hod/courses/(\d+)$#', $path, $matches)) {
                    $courseId = $matches[1];
                    if ($method === 'PUT') {
                        $user = $this->authMiddleware->requireAuth();
                        $_REQUEST['authenticated_user'] = $user;
                        $this->hodController->updateCourse($courseId);
                    } elseif ($method === 'DELETE') {
                        $user = $this->authMiddleware->requireAuth();
                        $_REQUEST['authenticated_user'] = $user;
                        $this->hodController->deleteCourse($courseId);
                    } else {
                        $this->sendMethodNotAllowed();
                    }
                } else {
                    $this->sendNotFound();
                }
                break;
        }
    }

    /**
     * Send welcome message for root endpoint
     */
    private function sendWelcome()
    {
        http_response_code(200);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'NBA Assessment API v1.0',
            'version' => '1.0.0',
            'documentation' => '/nba/docs/APIDocumentation.md',
            'endpoints' => [
                'auth' => [
                    'POST /auth/login',
                    'GET /auth/profile',
                    'PUT /auth/profile',
                    'POST /auth/logout'
                ],
                'courses' => [
                    'GET /courses'
                ],
                'assessment' => [
                    'POST /assessment',
                    'GET /assessment',
                    'GET /course-tests',
                    'PUT /questions/{id}',
                    'DELETE /questions/{id}'
                ],
                'marks' => [
                    'POST /marks/by-question',
                    'POST /marks/by-co',
                    'POST /marks/bulk',
                    'GET /marks',
                    'GET /marks/test',
                    'PUT /marks/raw/{id}',
                    'DELETE /marks/raw/{id}',
                    'DELETE /marks/student/{testId}/{studentId}'
                ],
                'enrollment' => [
                    'POST /courses/{courseId}/enroll',
                    'GET /courses/{courseId}/enrollments',
                    'DELETE /courses/{courseId}/enroll/{rollno}'
                ],
                'attainment' => [
                    'GET /courses/{courseId}/attainment-config',
                    'POST /courses/{courseId}/attainment-config'
                ]
            ]
        ]);
    }

    /**
     * Send 404 Not Found response
     */
    private function sendNotFound()
    {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint not found'
        ]);
    }

    /**
     * Send 405 Method Not Allowed response
     */
    private function sendMethodNotAllowed()
    {
        http_response_code(405);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }
}

// Initialize and handle request
$router = new Router();
$router->handleRequest();
