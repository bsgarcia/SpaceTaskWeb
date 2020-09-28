<?php

include 'connectDB.php';

$EXPID = stripslashes(htmlspecialchars($_POST['expID']));
$ID = stripslashes(htmlspecialchars($_POST['id']));
$EXP = stripslashes(htmlspecialchars($_POST['exp']));
$CONV = stripslashes(htmlspecialchars($_POST['conversionRate']));
$BROW = stripslashes(htmlspecialchars($_POST['browser']));

$stmt = $db->prepare("INSERT INTO experiment_data_r_and_c VALUE(?,?,?,?,?,NOW())");
$stmt->bind_param("ssssd",$EXPID,$ID,$EXP,$BROW, $CONV);
$stmt->execute();
$err = $stmt->errno ;
$data = array(
      'error' => $err,
    );
$stmt->close();
 $db->close();
echo json_encode($data);
 ?>
