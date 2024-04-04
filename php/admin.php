<?php
// Database connection parameters
$servername = "localhost";
$username = "username"; // Your MySQL username
$password = "password"; // Your MySQL password
$database = "dbname"; // Your MySQL database name

// Create connection
$conn = new mysqli($servername, $username, $password, $database);  

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// SQL query to retrieve the last row for each prolificID for today
/* $sql = "SELECT t1.prolificID, t1.session, t1.t
FROM spaceprl t1
INNER JOIN (

SELECT prolificID, MAX( datetime ) AS max_created_at
FROM spaceprl
WHERE DATE( datetime ) = CURDATE( )
GROUP BY prolificID
)t2 ON t1.prolificID = t2.prolificID
AND t1.datetime = t2.max_created_at
LIMIT 0 , 30";
 */
// SQL query to retrieve the last row for each prolificID
$sql = "SELECT t1.prolificID, t1.session, t1.t, t1.datetime
FROM spaceprl t1
INNER JOIN (

SELECT prolificID, MAX( datetime ) AS max_created_at
FROM spaceprl
GROUP BY prolificID
)t2 ON t1.prolificID = t2.prolificID
AND t1.datetime = t2.max_created_at
LIMIT 0 , 100";

$result = $conn->query($sql);


$data = array(); // Initialize an empty array to store data

if ($result->num_rows > 0) {
    // Output data of each row
    while ($row = $result->fetch_assoc()) {
       if (strlen($row['prolificID']) > 10 && strpos($row['prolificID'], 'random') === false) {
            // Add row data to the array
            $data[] = $row;
        }
    }
} else {
    // No results found
    $data = array("message" => "No results found");
}

// Close connection
$conn->close();

// Output data in JSON format
header('Content-Type: application/json');
echo json_encode($data);
?>