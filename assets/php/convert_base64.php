<?php

if (!isset($_POST['str'])) {
    die("string to encode is missing.");
}

$resultStr = $_POST['str'];

echo base64_encode($resultStr);

?>