<?php

/**
 * Authentication Service
 * Follows Single Responsibility Principle - handles only authentication logic
 * Follows Dependency Inversion Principle - depends on abstractions
 */
class AuthService
{
    private $userRepository;
    private $jwtService;
    private $departmentRepository;
    private $hodAssignmentRepository;
    private $deanAssignmentRepository;

    public function __construct(
        UserRepository $userRepository, 
        JWTService $jwtService, 
        ?DepartmentRepository $departmentRepository = null,
        ?HODAssignmentRepository $hodAssignmentRepository = null,
        ?DeanAssignmentRepository $deanAssignmentRepository = null
    ) {
        $this->userRepository = $userRepository;
        $this->jwtService = $jwtService;
        $this->departmentRepository = $departmentRepository;
        $this->hodAssignmentRepository = $hodAssignmentRepository;
        $this->deanAssignmentRepository = $deanAssignmentRepository;
    }

    /**
     * Authenticate user with employee ID/email and password
     * @param string $employeeIdOrEmail
     * @param string $password
     * @return array|null Token and user data or array with error if authentication fails
     */
    public function authenticate($employeeIdOrEmail, $password)
    {
        // Find user by employee ID or email
        $user = $this->userRepository->findByEmployeeIdOrEmail($employeeIdOrEmail);

        if (!$user) {
            return ['error' => 'user_not_found']; // User not found
        }

        // Verify password
        if (!password_verify($password, $user->getPassword())) {
            return ['error' => 'invalid_password']; // Invalid password
        }

        // Check HOD assignment
        $flags = [
            'is_hod' => false,
            'is_dean' => false,
            'hod_department_id' => null,
            'school_id' => null
        ];

        // If user role is 'hod', they are a dedicated HOD account
        if ($user->getRole() === 'hod') {
            $flags['is_hod'] = true;
            $flags['hod_department_id'] = $user->getDepartmentId();
        }

        // Check Dean assignment - check if user is a current Dean for any school
        if ($this->deanAssignmentRepository) {
            $allCurrentDeans = $this->deanAssignmentRepository->getAllCurrentDeans();
            foreach ($allCurrentDeans as $deanData) {
                if ($deanData['employee_id'] == $user->getEmployeeId()) {
                    $flags['is_dean'] = true;
                    $flags['school_id'] = $deanData['school_id'];
                    break;
                }
            }
        }

        // Generate token with assignment flags
        $token = $this->jwtService->generateToken($user, $flags);

        // Prepare user data with department info
        $userData = $user->toArray();
        $userData['is_hod'] = $flags['is_hod'];
        $userData['is_dean'] = $flags['is_dean'];
        $userData['hod_department_id'] = $flags['hod_department_id'];
        $userData['school_id'] = $flags['school_id'];

        // Add department name if user has a department and repository is available
        if ($this->departmentRepository && $user->getDepartmentId()) {
            $department = $this->departmentRepository->findById($user->getDepartmentId());
            if ($department) {
                $userData['department_name'] = $department->getDepartmentName();
                $userData['department_code'] = $department->getDepartmentCode();
            }
        }

        return [
            'token' => $token,
            'user' => $userData
        ];
    }

    /**
     * Validate authentication token
     * @param string $token
     * @return array|null User data or null if invalid
     */
    public function validateToken($token)
    {
        return $this->jwtService->getUserFromToken($token);
    }

    /**
     * Logout user (client-side token removal, server-side could implement token blacklisting)
     * @param string $token
     * @return bool
     */
    public function logout($token)
    {
        // In a more advanced implementation, you might add the token to a blacklist
        // For now, we just validate that the token exists
        return $this->validateToken($token) !== null;
    }
}
