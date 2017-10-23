<?php

//require_once 'lib/php-epn.php';

$params = '';

foreach ($_POST as $key => $value){
	if ($params == '') $params .= "{$key}={$value}";
	$params .= "&{$key}={$value}";
}

$ch = curl_init();

$options = array(
    CURLOPT_URL             => 'https://www.eprocessingnetwork.com/cgi-bin/tdbe/transact.pl',
    CURLOPT_RETURNTRANSFER  => true,
    CURLOPT_FOLLOWLOCATION  => true,
    CURLOPT_POST            => true,
    CURLOPT_POSTFIELDS      => $params,
    CURLOPT_SSL_VERIFYHOST  => 2,
    CURLOPT_SSL_VERIFYPEER  => true,
    CURLOPT_SSLVERSION      => CURL_SSLVERSION_TLSv1_2
);

curl_setopt_array($ch, $options);

$response = curl_exec($ch);

if (curl_errno($ch)) { 
   echo curl_error($ch); 
} 

curl_close($ch);

echo $response;

?>