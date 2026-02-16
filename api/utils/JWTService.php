<?php

/**
 * JWT Authentication Service
 * Follows Single Responsibility Principle - handles only JWT operations
 * Follows Interface Segregation Principle - focused interface
 */
class JWTService
{
    private $secretKey;
    private $algorithm;
    private $tokenExpiry;

    public function __construct($secretKey = null, $tokenExpiry = 3600)
    {
        $this->secretKey = $secretKey ?: 'your-secret-key-change-this-in-production';
        $this->algorithm = 'HS256';
        $this->tokenExpiry = $tokenExpiry; // 1 hour default
    }

    /**
     * Generate JWT token for user
     * @param User $user
     * @param array $flags Optional array with keys: is_hod, is_dean, hod_department_id, school_id
     * @return string
     */
    public function generateToken(User $user, array $flags = [])
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => $this->algorithm]);
        
        $payloadData = [
            'employee_id' => $user->getEmployeeId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'department_id' => $user->getDepartmentId(),
            'designation' => $user->getDesignation(),
            'phone' => $user->getPhone(),
            'iat' => time(),
            'exp' => time() + $this->tokenExpiry
        ];

        // Add assignment flags if provided
        if (isset($flags['is_hod'])) {
            $payloadData['is_hod'] = $flags['is_hod'];
        }
        if (isset($flags['is_dean'])) {
            $payloadData['is_dean'] = $flags['is_dean'];
        }
        if (isset($flags['hod_department_id'])) {
            $payloadData['hod_department_id'] = $flags['hod_department_id'];
        }
        if (isset($flags['school_id'])) {
            $payloadData['school_id'] = $flags['school_id'];
        }

        $payload = json_encode($payloadData);

        $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $this->secretKey, true);
        $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }

    /**
     * Validate JWT token
     * @param string $token
     * @return array|null Decoded payload or null if invalid
     */
    public function validateToken($token)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        $header = $parts[0];
        $payload = $parts[1];
        $signature = $parts[2];

        // Verify signature
        $expectedSignature = hash_hmac('sha256', $header . "." . $payload, $this->secretKey, true);
        $expectedSignatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignature));

        if (!hash_equals($signature, $expectedSignatureEncoded)) {
            return null;
        }

        // Decode payload
        $payloadDecoded = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);

        // Check expiry
        if (isset($payloadDecoded['exp']) && $payloadDecoded['exp'] < time()) {
            return null;
        }

        return $payloadDecoded;
    }

    /**
     * Get user data from token
     * @param string $token
     * @return array|null
     */
    public function getUserFromToken($token)
    {
        $payload = $this->validateToken($token);
        if (!$payload) {
            return null;
        }

        return [
            'employee_id' => $payload['employee_id'],
            'username' => $payload['username'],
            'email' => $payload['email'],
            'role' => $payload['role'],
            'department_id' => isset($payload['department_id']) ? $payload['department_id'] : null,
            'is_hod' => isset($payload['is_hod']) ? $payload['is_hod'] : false,
            'is_dean' => isset($payload['is_dean']) ? $payload['is_dean'] : false,
            'hod_department_id' => isset($payload['hod_department_id']) ? $payload['hod_department_id'] : null,
            'school_id' => isset($payload['school_id']) ? $payload['school_id'] : null
        ];
    }

    /**
     * Check if token is expired
     * @param string $token
     * @return bool
     */
    public function isTokenExpired($token)
    {
        $payload = $this->validateToken($token);
        return !$payload || (isset($payload['exp']) && $payload['exp'] < time());
    }
}
