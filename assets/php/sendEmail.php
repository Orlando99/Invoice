<?php
require_once('/PHPMailer/PHPMailerAutoload.php');
if (!isset($_POST['businessName']) || $_POST['businessName'] == '') die('Business Name not provided!');

$mail = new PHPMailer();
$mail->IsSMTP();
$mail->SMTPDebug = 1;
$mail->SMTPAuth = true;
$mail->SMTPSecure = 'ssl';
$mail->Host = "smtp.gmail.com";
$mail->Port = 465; // or 587
$mail->IsHTML(true);
$mail->Username = "no-reply@invoicesunlimited.com";
$mail->Password = "Johnk@420";
$mail->SetFrom("no-reply@invoicesunlimited.com");
$mail->Subject = "{$_POST['businessName']} - Payment Received";
$mail->Body = "";

$mail->AddAddress($_POST['clientEmail']);

if(!$mail->Send()){
	echo "Mailer Error: " . $mail->ErrorInfo;
} else {
	echo "Email sent successfully.";
}

?>