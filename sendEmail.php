<?php
try
{
   // $to = "wasiq.aftab.ch@gmail.com";
    $to = "zashraf080@gmail.com";
    $subject = "Congratulations Your EIN has arrived.";
    
    $message = "
    <!DOCTYPE html>
    <head>

    </head>
    <body>
     <b> Email Comes From Cron job At . </b>" . date('D, F, Y, g:i a') . "<br>

    </body>
    </html>
    ";


    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";

    // More headers
    $headers .= 'From: <notifications@ein-tax-id.com>' . "\r\n";
    //$headers .= 'Cc: myboss@example.com' . "\r\n";
    //$headers .= 'Bcc: zashraf080@gmail.com' . "\r\n";

    $headers .= 'Bcc: fayyazahmedcs@gmail.com,mianazhar2005@gmail.com' . "\r\n";
    $retval = mail($to, $subject, $message, $headers);
    echo "Mail Function Responce:".$retval;

    echo 'Email sent to '.$to;
                                    // END SEND MAIL TO USER
}
catch (Exception $e) 
{
    echo 'Caught exception: ',  $e->getMessage(), "\n";
}

?>

                           