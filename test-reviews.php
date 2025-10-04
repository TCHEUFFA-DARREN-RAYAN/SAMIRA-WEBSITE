<?php
// Minimal test file to diagnose the issue
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Test 1: Can we output anything?
echo json_encode([
    'test' => 'PHP is working',
    'method' => $_SERVER['REQUEST_METHOD'],
    'time' => date('c')
]);

// Stop here to see if basic output works
exit();
?>