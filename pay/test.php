<?php

//require_once dirname(__FILE__).'\..\vendor\autoload.php';
require_once(dirname(__FILE__).'\html2pdf\vendor\autoload.php');
use Spipu\Html2Pdf\Html2Pdf;
use Spipu\Html2Pdf\Exception\Html2PdfException;
use Spipu\Html2Pdf\Exception\ExceptionFormatter;

$html2pdf = new Html2Pdf('P','A4','en');

echo "hello";

?>