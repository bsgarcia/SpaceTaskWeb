<?php
require_once 'login.php';

$request_body = file_get_contents('php://input');

$data = json_decode($request_body, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonResponse('error', 'Invalid JSON data');
}

if (empty($data)) {
    sendJsonResponse('error', 'No data provided');
}

try {
    $conn = getDbConnection();

    // Whitelist allowed columns for REI-40 data
    $allowed_columns = ['prolificID', 'expName', 'timestamp', 'surveyOrder'];

    // Add question columns (q0 through q39)
    for ($i = 0; $i <= 39; $i++) {
        $allowed_columns[] = "q$i";
    }

    $filtered_data = [];
    foreach ($data as $key => $value) {
        if (in_array($key, $allowed_columns)) {
            $filtered_data[$key] = $value;
        }
    }

    if (empty($filtered_data)) {
        sendJsonResponse('error', 'No valid columns provided');
    }

    $columns = '`' . implode('`, `', array_keys($filtered_data)) . '`';
    $placeholders = ':' . implode(', :', array_keys($filtered_data));

    $stmt = $conn->prepare("INSERT INTO spaceprl_rei40 ($columns) VALUES ($placeholders)");

    foreach ($filtered_data as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }

    $stmt->execute();

    sendJsonResponse('success', 'REI-40 data inserted successfully', ['inserted_id' => $conn->lastInsertId()]);

} catch (PDOException $e) {
    error_log("Database error in insert_rei40.php: " . $e->getMessage());
    sendJsonResponse('error', 'Database operation failed');
} catch (Exception $e) {
    error_log("General error in insert_rei40.php: " . $e->getMessage());
    sendJsonResponse('error', 'Operation failed');
} finally {
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}
