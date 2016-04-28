<?php

if (!isset($_POST['htmlUrl'])) {
    die("The html url was not provided");
}

if (!isset($_POST['xmlUrl'])) {
	die("New xml url was not provided!");
}

$html = file_get_contents($_POST['htmlUrl']);


$resultHtml = preg_replace('/Connect.open\("GET",.*"http.*"/','Connect.open("GET","' . $_POST['xmlUrl'] . '"',$html);

echo base64_encode($resultHtml);

?>