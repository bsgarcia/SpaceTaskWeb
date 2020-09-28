<?php

include 'connectDB.php';

$EXP 		= stripslashes(htmlspecialchars($_POST['exp']));
$EXPID 		= stripslashes(htmlspecialchars($_POST['expID']));
$ID 		= stripslashes(htmlspecialchars($_POST['id']));
$ELIC 		= stripslashes(htmlspecialchars($_POST['elicitation_type']));
$TEST 		= stripslashes(htmlspecialchars($_POST['test']));
$TRIAL 		= stripslashes(htmlspecialchars($_POST['trial']));
$COND 		= stripslashes(htmlspecialchars($_POST['condition']));
$CONT1 		= stripslashes(htmlspecialchars($_POST['cont_idx_1']));
$CONT2 		= stripslashes(htmlspecialchars($_POST['cont_idx_2']));
$SYML 		= stripslashes(htmlspecialchars($_POST['symL']));
$SYMR 		= stripslashes(htmlspecialchars($_POST['symR']));
$LR 		= stripslashes(htmlspecialchars($_POST['choice_left_right']));
$RTIME 		= stripslashes(htmlspecialchars($_POST['reaction_time']));
$OUT 		= stripslashes(htmlspecialchars($_POST['outcome']));
$CF_OUT 	= stripslashes(htmlspecialchars($_POST['cf_outcome']));
$CHOICE 	= stripslashes(htmlspecialchars($_POST['choice']));
$CORRECT_CHOICE 	= stripslashes(htmlspecialchars($_POST['correct_choice']));
$REW 		= stripslashes(htmlspecialchars($_POST['reward']));
$SESSION 	= stripslashes(htmlspecialchars($_POST['session']));
$P1 		= stripslashes(htmlspecialchars($_POST['p1']));
$P2 		= stripslashes(htmlspecialchars($_POST['p2']));
$OP1 		= stripslashes(htmlspecialchars($_POST['option1']));
$OP2 		= stripslashes(htmlspecialchars($_POST['option2']));
$EV1 		= stripslashes(htmlspecialchars($_POST['ev1']));
$EV2 		= stripslashes(htmlspecialchars($_POST['ev2']));
$CATCH      = stripslashes(htmlspecialchars($_POST['iscatch']));
$INV 		= stripslashes(htmlspecialchars($_POST['inverted']));
$CTIME 		= stripslashes(htmlspecialchars($_POST['choice_time']));
$DIST 		= stripslashes(htmlspecialchars($_POST['elic_distance']));
$PLOT 		= stripslashes(htmlspecialchars($_POST['p_lottery']));

$stmt = $db->prepare("INSERT INTO learning_data_r_and_c VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
$stmt->bind_param("sssiddidiiiiiiiissidiiiddiiiid",
    $EXP,$EXPID,$ID, $ELIC, $P1,$P2, $RTIME, $OUT, $CF_OUT, $CHOICE, $CORRECT_CHOICE, $TEST,$TRIAL,$COND, $CONT1, $CONT2, $SYML,$SYMR,$LR,$REW,$SESSION,$OP1,$OP2, $EV1, $EV2, $CATCH, $INV,$CTIME, $DIST, $PLOT
);
$stmt->execute();
$err = $stmt->errno ;
$data = array(
      'error' => $err,
    );
$stmt->close();
 $db->close();
echo json_encode($data);
 ?>
