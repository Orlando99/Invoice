<?php

require_once(dirname(__FILE__).'\html2pdf\vendor\autoload.php');

use Spipu\Html2Pdf\Html2Pdf;
use Spipu\Html2Pdf\Exception\Html2PdfException;
use Spipu\Html2Pdf\Exception\ExceptionFormatter;

if (!isset($_POST['html'])) {
    die("The html was not provided");
}

$html2pdf = new Html2Pdf('P', 'A4', 'en');
$html2pdf->writeHTML($_POST['html']);
$response = $html2pdf->Output('',true);

echo base64_encode($response);


?>