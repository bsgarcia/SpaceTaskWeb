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

    // Whitelist allowed columns for General Risk Survey data
    $allowed_columns = ['prolificID', 'expName', 'riskScore', 'timestamp'];
    
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

    // Validate risk score is in valid range (0-10)
    if (isset($filtered_data['riskScore'])) {
        $risk_score = intval($filtered_data['riskScore']);
        if ($risk_score < 0 || $risk_score > 10) {
            sendJsonResponse('error', 'Risk score must be between 0 and 10');
        }
    }

    // Generating the placeholders for the prepared statement
    $columns = '`' . implode('`, `', array_keys($filtered_data)) . '`';
    $placeholders = ':' . implode(', :', array_keys($filtered_data));

    // Inserting data into the 'spaceprl_general_risk' table dynamically
    $stmt = $conn->prepare("INSERT INTO spaceprl_general_risk ($columns) VALUES ($placeholders)");

    // Binding parameters and executing the statement
    foreach ($filtered_data as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }

    $stmt->execute();

    sendJsonResponse('success', 'General Risk Survey data inserted successfully', ['inserted_id' => $conn->lastInsertId()]);

} catch (PDOException $e) {
    error_log("Database error in insert_general_risk.php: " . $e->getMessage());
    sendJsonResponse('error', 'Database operation failed');
} catch (Exception $e) {
    error_log("General error in insert_general_risk.php: " . $e->getMessage());
    sendJsonResponse('error', 'Operation failed');
} finally {
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

?>