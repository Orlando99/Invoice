<?php

if (!isset($_POST['xmlstr'])) {
    die("The xml string was not provided");
}

$resultXml = $_POST['xmlstr'];

echo base64_encode($resultXml);

?>