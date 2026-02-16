<?php

/**
 * User Controller
 * Follows Single Responsibility Principle - handles only user-related HTTP requests
 * Follows Dependency Inversion Principle - depends on abstractions
 */
class UserController
{
    private $authService;
    private $userRepository;
    private $departmentRepository;
    private $validationMiddleware;

    public function __construct(AuthService $authService, UserRepository $userRepository, DepartmentRepository $departmentRepository, ValidationMiddleware $validationMiddleware)
    {
        $this->authService = $authService;
        $this->userRepository = $userRepository;
        $this->departmentRepository = $departmentRepository;
        $this->validationMiddleware = $validationMiddleware;
    }

    /**
     * Handle user login
     */
    public function login()
    {
        try {
            $data = $this->validationMiddleware->getJsonInput();

            if (!$data) {
                throw new Exception("Invalid JSON input");
            }

            // Validate input
            $errors = $this->validationMiddleware->validateLoginData($data);
            if (!empty($errors)) {
                $this->validationMiddleware->sendValidationErrorResponse($errors);
                return;
            }

            // Attempt authentication
            $result = $this->authService->authenticate($data['employeeIdOrEmail'], $data['password']);

            if (!$result) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ]);
                return;
            }

            // Success response
            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'data' => $result
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle user profile retrieval
     */
    public function getProfile()
    {
        try {
            // Authentication is handled by middleware, user data is passed
            $userData = $_REQUEST['authenticated_user'];

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Profile retrieved successfully',
                'data' => $userData
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve profile',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle user profile update
     */
    public function updateProfile()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];
            $data = $this->validationMiddleware->getJsonInput();

            if (!$data) {
                throw new Exception("Invalid JSON input");
            }

            // Validate input
            $errors = $this->validationMiddleware->validateProfileUpdateData($data);
            if (!empty($errors)) {
                $this->validationMiddleware->sendValidationErrorResponse($errors);
                return;
            }

            // Get current user
            $user = $this->userRepository->findByEmployeeId($userData['employee_id']);
            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'User not found'
                ]);
                return;
            }

            // Update user data
            if (isset($data['username'])) {
                // Check if username is already taken
                if ($this->userRepository->usernameExists($data['username'], $user->getEmployeeId())) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Username already exists'
                    ]);
                    return;
                }
                $user->setUsername($data['username']);
            }

            if (isset($data['email'])) {
                // Check if email is already taken
                if ($this->userRepository->emailExists($data['email'], $user->getEmployeeId())) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Email already exists'
                    ]);
                    return;
                }
                $user->setEmail($data['email']);
            }

            if (isset($data['password'])) {
                $user->setPassword(password_hash($data['password'], PASSWORD_DEFAULT));
            }

            if (isset($data['designation'])) {
                $user->setDesignation($data['designation']);
            }

            if (isset($data['phone'])) {
                $user->setPhone($data['phone']);
            }

            // Note: Role changes are not allowed via self-profile update for security reasons
            // Only admins can change user roles via dedicated endpoints

            // Save updated user
            if ($this->userRepository->save($user)) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'data' => $user->toArray()
                ]);
            } else {
                throw new Exception("Failed to update profile");
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle user logout
     */
    public function logout()
    {
        try {
            $userData = $_REQUEST['authenticated_user'];

            // In a stateless JWT system, logout is mainly client-side
            // Server-side could implement token blacklisting if needed
            $result = $this->authService->logout($_REQUEST['token']);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Logout successful'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get department information by employee ID
     */
    public function getDepartmentByEmployeeId()
    {
        try {
            // Authentication is handled by middleware, user data is passed
            $userData = $_REQUEST['authenticated_user'];

            // Get user's department
            $department = null;
            if ($userData['department_id']) {
                $department = $this->departmentRepository->findById($userData['department_id']);
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Department information retrieved successfully',
                'data' => $department ? $department->toArray() : null
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve department information',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get all users (Admin only)
     */
    public function getAllUsers()
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

            $users = $this->userRepository->findAll();
            
            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => $users
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
     * Get all departments
     */
    public function getAllDepartments()
    {
        try {
            $departments = $this->departmentRepository->findAll();
            
            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Departments retrieved successfully',
                'data' => $departments
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
     * Create a new user (Admin only)
     */
    public function createUser()
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

            $data = $this->validationMiddleware->getJsonInput();

            if (!$data) {
                throw new Exception("Invalid JSON input");
            }

            // Validate required fields
            $requiredFields = ['employee_id', 'username', 'email', 'password', 'role'];
            $errors = [];
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    $errors[] = "$field is required";
                }
            }

            if (!empty($errors)) {
                $this->validationMiddleware->sendValidationErrorResponse($errors);
                return;
            }

            // Validate role (HOD and Dean are assignments, not base roles)
            $validRoles = ['admin', 'faculty', 'staff'];
            if (!in_array($data['role'], $validRoles)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid role. Valid roles are: ' . implode(', ', $validRoles)
                ]);
                return;
            }

            // HOD and Dean uniqueness is now managed via assignment tables, not user role
            // Removed HOD/Dean uniqueness checks from user creation

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
                $data['role'],
                isset($data['department_id']) ? (int)$data['department_id'] : null,
                $data['designation'] ?? null,
                $data['phone'] ?? null
            );

            if ($this->userRepository->save($newUser)) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'User created successfully',
                    'data' => $newUser->toArray()
                ]);
            } else {
                throw new Exception("Failed to create user");
            }
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
     * Delete a user (Admin only)
     */
    public function deleteUser($employeeId)
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

            // Prevent deleting self
            if ($userData['employee_id'] == $employeeId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot delete your own account'
                ]);
                return;
            }

            // Check if user exists
            $user = $this->userRepository->findByEmployeeId($employeeId);
            if (!$user) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'User not found'
                ]);
                return;
            }

            if ($this->userRepository->delete($employeeId)) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'User deleted successfully'
                ]);
            } else {
                throw new Exception("Failed to delete user");
            }
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
