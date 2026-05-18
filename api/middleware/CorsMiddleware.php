<?php

/**
 * CORS Middleware
 * Follows Single Responsibility Principle - handles only CORS headers
 */
class CorsMiddleware
{

    /**
     * Handle CORS preflight request
     */
    public function handlePreflight()
    {
        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'CorsMiddleware', 'Preflight OPTIONS request handled'); }
            $this->setCorsHeaders();
            http_response_code(200);
            exit;
        }
    }

    /**
     * Set CORS headers for all responses
     */
    public function setCorsHeaders()
    {
        // Allow from specific origins (Production & Local Development)
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed_origins = [
            'https://nba.wily.in',    // Production Frontend
            'http://localhost:5173',  // Local Development
            'http://localhost:3000'   // Local Development (Alternative)
        ];

        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            // Default fallback (optional, can be removed for stricter security)
            header('Access-Control-Allow-Origin: *');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400'); // 24 hours
    }
}
