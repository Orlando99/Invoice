<?php

require_once(dirname(__FILE__).'/html2pdf/vendor/autoload.php');

use Spipu\Html2Pdf\Html2Pdf;
use Spipu\Html2Pdf\Exception\Html2PdfException;
use Spipu\Html2Pdf\Exception\ExceptionFormatter;

if (!isset($_POST['html'])) {
    die("The html was not provided");
}



try {
    ob_start();
    ob_clean();
    $html2pdf = new Html2Pdf('P', 'A4', 'en');
    $html2pdf->writeHTML($_POST['html']);
    ob_clean();
    ob_end_clean();
    $response = $html2pdf->Output('',true);
    echo file_put_contents("test1.pdf",$response);
    //ob_clean();
    //ob_end_clean();
    //$html2pdf->Output('exemple04.pdf');

    echo base64_encode($response);
    //echo "abc";
} catch (Html2PdfException $e) {
    $formatter = new ExceptionFormatter($e);
    echo $formatter->getHtmlMessage();
}

?>