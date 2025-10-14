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

    // Whitelist allowed columns for Risk Assessment data
    $allowed_columns = ['prolificID', 'expName', 'selected', 'amount'];
    
    // Add choice columns (choice_0 through choice_9)
    for ($i = 0; $i <= 9; $i++) {
        $allowed_columns[] = "choice_$i";
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

    // Validate that we have the required lottery choices
    $choice_count = 0;
    for ($i = 0; $i <= 9; $i++) {
        if (isset($filtered_data["choice_$i"])) {
            $choice_count++;
        }
    }
    
    if ($choice_count < 10) {
        sendJsonResponse('error', "Incomplete risk assessment data: only $choice_count/10 lottery choices provided");
    }

    // Generating the placeholders for the prepared statement
    $columns = '`' . implode('`, `', array_keys($filtered_data)) . '`';
    $placeholders = ':' . implode(', :', array_keys($filtered_data));

    // Inserting data into the 'spaceprl_risk' table dynamically
    $stmt = $conn->prepare("INSERT INTO spaceprl_risk_kerstin ($columns) VALUES ($placeholders)");

    // Binding parameters and executing the statement
    foreach ($filtered_data as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }

    $stmt->execute();

    sendJsonResponse('success', 'Risk assessment data inserted successfully', ['inserted_id' => $conn->lastInsertId()]);

} catch (PDOException $e) {
    error_log("Database error in insert_risk.php: " . $e->getMessage());
    sendJsonResponse('error', 'Database operation failed');
} catch (Exception $e) {
    error_log("General error in insert_risk.php: " . $e->getMessage());
    sendJsonResponse('error', 'Operation failed');
} finally {
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

?> 