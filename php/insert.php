<?php

$request_body = file_get_contents('php://input');

// Decoding the JSON into an associative array
$data = json_decode($request_body, true);

// Establishing a connection to your database (replace placeholders with your actual database credentials)
$servername = "localhost";
$username = "";
$password = "";
$dbname = "";

try {
    // Creating a PDO connection (preferred for modern PHP)
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Generating the placeholders for the prepared statement
    $columns = implode(', ', array_keys($data));
    $placeholders = ':' . implode(', :', array_keys($data));

    // Inserting data into the 'spaceprl' table dynamically
    $stmt = $conn->prepare("INSERT INTO spaceprl ($columns) VALUES ($placeholders)");

    // Binding parameters and executing the statement
    foreach ($data as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }

    $stmt->execute();

    echo "Records inserted successfully";
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}

// Closing the connection
$conn = null;
?>