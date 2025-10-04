<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Use absolute path for Render
$reviewsFile = __DIR__ . '/reviews.json';

// Load reviews from file
function loadReviews($file) {
    if (!file_exists($file)) {
        return [];
    }
    
    $data = file_get_contents($file);
    if ($data === false) {
        return [];
    }
    
    $reviews = json_decode($data, true);
    return $reviews ?: [];
}

// Save reviews to file
function saveReviews($file, $reviews) {
    $data = json_encode($reviews, JSON_PRETTY_PRINT);
    if ($data === false) {
        throw new Exception('Failed to encode JSON');
    }
    
    $result = file_put_contents($file, $data);
    if ($result === false) {
        throw new Exception('Failed to write file. Check permissions.');
    }
    
    return true;
}

// Validate review data
function validateReview($review) {
    $errors = [];
    
    if (!isset($review['name']) || trim($review['name']) === '') {
        $errors[] = 'Name is required';
    }
    
    if (!isset($review['review']) || trim($review['review']) === '') {
        $errors[] = 'Review text is required';
    }
    
    if (!isset($review['rating']) || $review['rating'] < 1 || $review['rating'] > 5) {
        $errors[] = 'Rating must be between 1 and 5';
    }
    
    return $errors;
}

// Sanitize input
function sanitizeInput($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $reviews = loadReviews($reviewsFile);
        
        // Sort by date (newest first)
        usort($reviews, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });
        
        echo json_encode($reviews);
        
    } elseif ($method === 'POST') {
        
        $rawInput = file_get_contents('php://input');
        
        if (empty($rawInput)) {
            http_response_code(400);
            echo json_encode([
                'error' => 'No data received',
                'debug' => 'Raw input was empty'
            ]);
            exit();
        }
        
        $input = json_decode($rawInput, true);
        
        if ($input === null) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Invalid JSON',
                'debug' => json_last_error_msg(),
                'received' => substr($rawInput, 0, 100)
            ]);
            exit();
        }
        
        // Validate
        $errors = validateReview($input);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Validation failed',
                'errors' => $errors
            ]);
            exit();
        }
        
        // Create review
        $newReview = [
            'id' => (string)(time() . rand(100, 999)),
            'name' => sanitizeInput($input['name']),
            'review' => sanitizeInput($input['review']),
            'rating' => (int)$input['rating'],
            'date' => date('c'),
            'approved' => true
        ];
        
        // Load existing
        $reviews = loadReviews($reviewsFile);
        
        // Add new review at the beginning
        array_unshift($reviews, $newReview);
        
        // Check if file is writable
        if (file_exists($reviewsFile) && !is_writable($reviewsFile)) {
            http_response_code(500);
            echo json_encode([
                'error' => 'File is not writable',
                'debug' => 'reviews.json exists but cannot be modified',
                'path' => $reviewsFile
            ]);
            exit();
        }
        
        // Check if directory is writable
        if (!is_writable(dirname($reviewsFile))) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Directory is not writable',
                'debug' => 'Cannot write to directory',
                'path' => dirname($reviewsFile)
            ]);
            exit();
        }
        
        // Try to save
        try {
            saveReviews($reviewsFile, $reviews);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to save',
                'debug' => $e->getMessage(),
                'path' => $reviewsFile
            ]);
            exit();
        }
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Review added successfully',
            'review' => $newReview
        ]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'debug' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>