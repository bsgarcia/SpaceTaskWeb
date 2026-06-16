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

    // Whitelist allowed columns for CFI data
    $allowed_columns = ['prolificID', 'expName', 'timestamp', 'score'];

    // Add question columns (q0 through q19)
    for ($i = 0; $i <= 19; $i++) {
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

    // Validate that we have all 20 questions
    $question_count = 0;
    for ($i = 0; $i <= 19; $i++) {
        if (isset($filtered_data["q$i"])) {
            $question_count++;
        }
    }

    if ($question_count < 20) {
        sendJsonResponse('error', "Incomplete CFI data: only $question_count/20 questions provided");
    }

    $columns = '`' . implode('`, `', array_keys($filtered_data)) . '`';
    $placeholders = ':' . implode(', :', array_keys($filtered_data));

    $stmt = $conn->prepare("INSERT INTO spaceprl_cfi ($columns) VALUES ($placeholders)");

    foreach ($filtered_data as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }

    $stmt->execute();

    sendJsonResponse('success', 'CFI data inserted successfully', ['inserted_id' => $conn->lastInsertId()]);

} catch (PDOException $e) {
    error_log("Database error in insert_cfi.php: " . $e->getMessage());
    sendJsonResponse('error', 'Database operation failed');
} catch (Exception $e) {
    error_log("General error in insert_cfi.php: " . $e->getMessage());
    sendJsonResponse('error', 'Operation failed');
} finally {
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}
