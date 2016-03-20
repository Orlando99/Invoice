<?php

require_once('./twilio-php/Services/Twilio.php');
require_once('/PHPMailer/PHPMailerAutoload.php');

$sid = "AC439073eae4b847809b8ee31d2259c6e4"; 
$token = "afb444494d89fda4372a4d2048841359"; 

if (!isset($_POST['dest'])) die('Destination not set!');

$verification_code = mt_rand(1000,9999);

if ($_POST['dest'] == "phone") {
	if (!isset($_POST['phonenumber'])) die("Phone number not provided!");
	$client = new Services_Twilio($sid, $token);
	echo "before try";
	try {
		$message = $client->account->messages->sendMessage(
			'14247813414', 
	  		$_POST['phonenumber'],
	  		"Thanks for using Invoices Unlimited!\n"
			."Your verification code is: {$verification_code}."
		);
		echo "Code:".md5($verification_code).";\n";
		echo $message;
	
	} catch(Services_Twilio_RestException $e){
		die($e->getMessage());
	}
} else if ($_POST['dest'] == "email") {

	if (!isset($_POST['email'])) die('Email not provided!');
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
	$mail->Subject = "Invoices Unlimited Verification Code";
	$mail->Body = "<p>Thanks for using Invoices Unlimited!</p>"
				  ."<p>Your verification code is: {$verification_code}.</p>";
	$mail->AddAddress($_POST['email']);

	if(!$mail->Send()){
		echo "Mailer Error: " . $mail->ErrorInfo;
	} else {
		echo "Code:".md5($verification_code).";\n";
		echo "Message has been sent";
	}
}

?>