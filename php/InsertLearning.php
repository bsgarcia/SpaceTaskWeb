?php

include 'connectDB.php';

$prolificID             = stripslashes(htmlspecialchars($_POST['prolificID']));
$choice                 = stripslashes(htmlspecialchars($_POST['choice']));
$choseLeft              = stripslashes(htmlspecialchars($_POST['choseLeft']));
$corr                   = stripslashes(htmlspecialchars($_POST['corr']));
$outcome                = stripslashes(htmlspecialchars($_POST['outcome']));
$cfoutcome              = stripslashes(htmlspecialchars($_POST['cfoutcome']));
$feedbackInfo           = stripslashes(htmlspecialchars($_POST['feedbackInfo']));
$session                = stripslashes(htmlspecialchars($_POST['session']));
$p1                     = stripslashes(htmlspecialchars($_POST['p1']));
$p2                     = stripslashes(htmlspecialchars($_POST['p2']));
$optFile1               = stripslashes(htmlspecialchars($_POST['optFile1']));
$optFile2               = stripslashes(htmlspecialchars($_POST['optFile2']));
$fireCount              = stripslashes(htmlspecialchars($_POST['fireCount']));
$upCount                = stripslashes(htmlspecialchars($_POST['upCount']));
$downCount              = stripslashes(htmlspecialchars($_POST['downCount']));
$leftCount              = stripslashes(htmlspecialchars($_POST['leftCount']));
$rightCount             = stripslashes(htmlspecialchars($_POST['rightCount']));
$con                    = stripslashes(htmlspecialchars($_POST['con']));
$t                      = stripslashes(htmlspecialchars($_POST['t']));
$rt                     = stripslashes(htmlspecialchars($_POST['rt']));
$missedTrial            = stripslashes(htmlspecialchars($_POST['missedTrial']));
$score                  = stripslashes(htmlspecialchars($_POST['score']));


if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT INTO spaceRL_test (prolificID, choice, choseLeft, corr, outcome, cfoutcome, feedbackInfo, session, p1, p2, optFile1, optFile2, fireCount, upCount, downCount, leftCount, rightCount, con, t, rt, missedTrial, score) VALUES ('$prolificID', $choice, $choseLeft, $corr, $outcome, $cfoutcome, $feedbackInfo, $session, $p1, $p2, '$optFile1', '$optFile2', $fireCount, $upCount, $downCount, $leftCount, $rightCount, $con, $t, $rt, $missedTrial, $score)";

if ($conn->query($sql) === TRUE) {
  echo "New record created successfully";
} else {
  echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
 ?>
