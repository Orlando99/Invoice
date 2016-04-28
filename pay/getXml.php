<?php

if (!isset($_POST['xmlUrl'])) {
    die("The xml url was not provided");
}

$xml = file_get_contents($_POST['xmlUrl']);

$patterns = array();
$patterns[0] = '/<disablePay>.*<\/disablePay>/';
$patterns[1] = '/<refundtotal>.*<\/refundtotal>/';
$patterns[2] = '/<headerTitle>.*<\/headerTitle>/';
$patterns[3] = '/<paymentMadePrice>.*<\/paymentMadePrice>/';

$replacement = array();
$replacement[0] = "<disablePay><text>true</text></disablePay>";
$replacement[1] = '<refundtotal><text>\$'.$_POST['balanceDue'].'</text></refundtotal>';
$replacement[2] = "<headerTitle><text>Payment Made</text></headerTitle>";
$replacement[3] = '<paymentMadePrice><text>\$'.$_POST['paymentMade'].'</text></paymentMadePrice>';

$resultXml = preg_replace($patterns,$replacement,$xml);

echo base64_encode($resultXml);

?>