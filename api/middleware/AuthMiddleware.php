<?php

/**
 * Authentication Middleware
 * Follows Single Responsibility Principle - handles only authentication middleware
 */
class AuthMiddleware
{
    private $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Authenticate request using JWT token
     * @param string $token JWT token from Authorization header
     * @return array|null User data or null if authentication fails
     */
    public function authenticate($token)
    {
        if (empty($token)) {
            return null;
        }

        // Remove "Bearer " prefix if present
        if (strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);
        }

        return $this->authService->validateToken($token);
    }

    /**
     * Get token from Authorization header
     * @return string|null
     */
    public function getTokenFromHeader()
    {
        $headers = [];
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if ($headers === false) {
                $headers = [];
            }
        }
        
        $authHeader = '';
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($_SERVER['Authorization'])) {
            $authHeader = $_SERVER['Authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
             $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (empty($authHeader)) {
            return null;
        }

        // Remove "Bearer " prefix if present
        if (strpos($authHeader, 'Bearer ') === 0) {
            return substr($authHeader, 7);
        }

        return $authHeader;
    }

    /**
     * Require authentication for endpoint
     * @return array|null User data or sends error response and exits
     */
    public function requireAuth()
    {
        $token = $this->getTokenFromHeader();
        $user = $this->authenticate($token);

        if (!$user) {
            $this->sendUnauthorizedResponse();
            exit;
        }

        return $user;
    }

    /**
     * Send unauthorized response
     */
    private function sendUnauthorizedResponse()
    {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Unauthorized access',
            'error' => 'Invalid or missing authentication token'
        ]);
    }
}
