<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

const REVIEWS_FILE = __DIR__ . '/data/reviews.json';

// Ensure data directory exists
function ensureDataDirectory() {
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
}

// Load reviews from file
function loadReviews() {
    if (!file_exists(REVIEWS_FILE)) {
        return [];
    }
    
    $data = file_get_contents(REVIEWS_FILE);
    if ($data === false) {
        return [];
    }
    
    $reviews = json_decode($data, true);
    return $reviews ?: [];
}

// Save reviews to file
function saveReviews($reviews) {
    ensureDataDirectory();
    $data = json_encode($reviews, JSON_PRETTY_PRINT);
    if (file_put_contents(REVIEWS_FILE, $data) === false) {
        throw new Exception('Failed to save reviews');
    }
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
    
    if (isset($review['name']) && strlen($review['name']) > 100) {
        $errors[] = 'Name must be less than 100 characters';
    }
    
    if (isset($review['review']) && strlen($review['review']) > 1000) {
        $errors[] = 'Review must be less than 1000 characters';
    }
    
    return $errors;
}

// Sanitize input to prevent XSS
function sanitizeInput($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

// Get request method and handle routing
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Parse the path to get the ID if present
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$endpoint = end($pathParts);

try {
    switch ($method) {
        case 'GET':
            if ($endpoint === 'stats') {
                // GET /reviews.php/stats - Get review statistics
                $reviews = loadReviews();
                
                $totalReviews = count($reviews);
                $averageRating = $totalReviews > 0 
                    ? round(array_sum(array_column($reviews, 'rating')) / $totalReviews, 1)
                    : 0;
                
                $ratingDistribution = [
                    '5' => count(array_filter($reviews, fn($r) => $r['rating'] === 5)),
                    '4' => count(array_filter($reviews, fn($r) => $r['rating'] === 4)),
                    '3' => count(array_filter($reviews, fn($r) => $r['rating'] === 3)),
                    '2' => count(array_filter($reviews, fn($r) => $r['rating'] === 2)),
                    '1' => count(array_filter($reviews, fn($r) => $r['rating'] === 1))
                ];
                
                echo json_encode([
                    'totalReviews' => $totalReviews,
                    'averageRating' => $averageRating,
                    'ratingDistribution' => $ratingDistribution
                ]);
            } elseif (ctype_digit($endpoint)) {
                // GET /reviews.php/{id} - Get specific review
                $reviews = loadReviews();
                $review = array_filter($reviews, fn($r) => $r['id'] === $endpoint);
                
                if (empty($review)) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Review not found']);
                } else {
                    echo json_encode(array_values($review)[0]);
                }
            } else {
                // GET /reviews.php - Get all reviews
                $reviews = loadReviews();
                // Sort by date (newest first)
                usort($reviews, function($a, $b) {
                    return strtotime($b['date']) - strtotime($a['date']);
                });
                echo json_encode($reviews);
            }
            break;
            
        case 'POST':
            // POST /reviews.php - Add new review
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON data']);
                break;
            }
            
            // Validate input
            $errors = validateReview($input);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode(['errors' => $errors]);
                break;
            }
            
            // Create sanitized review
            $sanitizedReview = [
                'id' => (string)(time() * 1000 + rand(0, 999)), // Simple ID generation
                'name' => sanitizeInput($input['name']),
                'review' => sanitizeInput($input['review']),
                'rating' => (int)$input['rating'],
                'date' => date('c'), // ISO 8601 format
                'approved' => true
            ];
            
            // Load existing reviews
            $reviews = loadReviews();
            
            // Add new review
            $reviews[] = $sanitizedReview;
            
            // Save to file
            saveReviews($reviews);
            
            http_response_code(201);
            echo json_encode([
                'message' => 'Review added successfully',
                'review' => $sanitizedReview
            ]);
            break;
            
        case 'DELETE':
            // DELETE /reviews.php/{id} - Delete review
            if (!ctype_digit($endpoint)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid review ID']);
                break;
            }
            
            $reviews = loadReviews();
            $reviewIndex = array_search($endpoint, array_column($reviews, 'id'));
            
            if ($reviewIndex === false) {
                http_response_code(404);
                echo json_encode(['error' => 'Review not found']);
                break;
            }
            
            array_splice($reviews, $reviewIndex, 1);
            saveReviews($reviews);
            
            echo json_encode(['message' => 'Review deleted successfully']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
?>