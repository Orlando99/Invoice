<?php

//require_once('/PHPMailer/PHPMailerAutoload.php');
require_once(dirname(__FILE__).'\PHPMailer\PHPMailerAutoload.php');

if (!isset($_POST['businessName']) || $_POST['businessName'] == '') die('Business Name not provided!');

if (!isset($_POST['email']) || $_POST['email'] == '') die('Email not provided!');

if (!isset($_POST['pdf']) || $_POST['pdf'] == '') die('PDF link not provided!');

if (!isset($_POST['receiptUrl']) || $_POST['receiptUrl'] == '') die('Receipt url not provided!');

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
$mail->Body = "<p>Thank you for your payment. We appreciate your business and look forward to assisting you in the future.</p>"
			  ."<p>Click here to view: <a href='{$_POST['receiptUrl']}'>{$_POST['receiptUrl']}</a></p>";

$mail->addStringAttachment(file_get_contents($_POST['pdf']), 'Receipt.pdf');

$mail->AddAddress($_POST['clientEmail']);

if(!$mail->Send()){
	echo "Mailer Error: " . $mail->ErrorInfo;
} else {

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
	$mail->Body = "<p>{$_POST['clientName']} paid \${$_POST['paymentAmount']} on {$_POST['paymentDate']}</p>"
				 ."<p>Click here to view: <a href='{$_POST['receiptUrl']}'>{$_POST['receiptUrl']}</a></p>";
	$mail->addStringAttachment(file_get_contents($_POST['pdf']), 'Receipt.pdf');

	$mail->AddAddress($_POST['email']);

	if (!$mail->Send()){
		echo "Mailer Error:" . $mail->ErrorInfo;
	} else {
		echo "Message has been sent";
	}
}

?>