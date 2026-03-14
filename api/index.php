<?php

/**
 * NBA API Entry Point
 * Main entry point for the NBA API following RESTful principles
 */

// Error reporting: log to file, never output to response (prevents JSON corruption)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Output buffer ensures no stray output pollutes JSON responses
ob_start();

// Basic Routing for Landing Page
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Normalize path: strip everything up to and including '/api/' for any folder name.
$apiWithTrailingSlashPos = strpos($path, '/api/');
if ($apiWithTrailingSlashPos !== false) {
    $path = substr($path, $apiWithTrailingSlashPos + 5);
} else {
    // Handle requests to '/api' without a trailing slash.
    $apiWithoutTrailingSlashPos = strpos($path, '/api');
    if ($apiWithoutTrailingSlashPos !== false) {
        $path = substr($path, $apiWithoutTrailingSlashPos + 4);
    }
}

$path = ltrim($path, '/');

// Serve Landing Page for root/index
if ($path === '' || $path === 'index.php') {
    require 'landing.php';
    exit;
}

// Load CORS middleware and set headers FIRST (before any output)
require_once __DIR__ . '/middleware/CorsMiddleware.php';
$corsMiddleware = new CorsMiddleware();
$corsMiddleware->setCorsHeaders();
$corsMiddleware->handlePreflight();

// Set headers for JSON API
header('Content-Type: application/json');

// Include the main router
require_once __DIR__ . '/routes/api.php';

// Flush output buffer cleanly
ob_end_flush();
