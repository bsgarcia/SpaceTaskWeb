<?php
require_once 'login.php';

$request_body = file_get_contents('php://input');

// Decoding the JSON into an associative array
$data = json_decode($request_body, true);

// Validate JSON input
if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonResponse('error', 'Invalid JSON data');
}

if (empty($data)) {
    sendJsonResponse('error', 'No data provided');
}

try {
    // Get database connection
    $conn = getDbConnection();

    // Whitelist allowed columns for feedback data based on screenshot structure
    $allowed_columns = ['prolificID'];
    
    // Add question response columns (q0 through q4)
    for ($i = 0; $i <= 4; $i++) {
        $allowed_columns[] = "q$i";
    }
    
    // Add open-ended question columns (open_q0 through open_q4)  
    for ($i = 0; $i <= 4; $i++) {
        $allowed_columns[] = "open_q$i";
    }
    
    // Filter data to only include allowed columns
    $filtered_data = [];
    foreach ($data as $key => $value) {
        if (in_array($key, $allowed_columns)) {
            $filtered_data[$key] = $value;
        }
    }
    
    if (empty($filtered_data)) {
        sendJsonResponse('error', 'No valid columns provided');
    }

    // Generating the placeholders for the prepared statement
    $columns = '`' . implode('`, `', array_keys($filtered_data)) . '`';
    $placeholders = ':' . implode(', :', array_keys($filtered_data));

    // Inserting data into the 'spaceprl_feedback' table dynamically
    $stmt = $conn->prepare("INSERT INTO spaceprl_feedback_kerstin ($columns) VALUES ($placeholders)");

    // Binding parameters and executing the statement
    foreach ($filtered_data as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }

    $stmt->execute();

    sendJsonResponse('success', 'Feedback data inserted successfully', ['inserted_id' => $conn->lastInsertId()]);

} catch (PDOException $e) {
    error_log("Database error in insert_feedback.php: " . $e->getMessage());
    sendJsonResponse('error', 'Database operation failed');
} catch (Exception $e) {
    error_log("General error in insert_feedback.php: " . $e->getMessage());
    sendJsonResponse('error', 'Operation failed');
} finally {
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

?>