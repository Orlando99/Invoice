<?php
  require './vendor/autoload.php';
  use net\authorize\api\contract\v1 as AnetAPI;
  use net\authorize\api\controller as AnetController;

  define("AUTHORIZENET_LOG_FILE", "phplog");

  
// Common setup for API credentials
$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
$merchantAuthentication->setName($_POST['AuthNet']);
$merchantAuthentication->setTransactionKey($_POST['AuthKey']);
$refId = 'ref' . time();

// Create the payment data for a credit card
$creditCard = new AnetAPI\CreditCardType();
$creditCard->setCardNumber($_POST['CardNo']);
$creditCard->setExpirationDate("XXXX");
$paymentOne = new AnetAPI\PaymentType();
$paymentOne->setCreditCard($creditCard);
//create a transaction
$transactionRequest = new AnetAPI\TransactionRequestType();
$transactionRequest->setTransactionType( "refundTransaction");
$transactionRequest->setRefTransId($_POST['TransID']);
$transactionRequest->setAmount($_POST['Amount']);
$transactionRequest->setPayment($paymentOne);


$request = new AnetAPI\CreateTransactionRequest();
$request->setMerchantAuthentication($merchantAuthentication);
$request->setRefId($refId);
$request->setTransactionRequest( $transactionRequest);
$controller = new AnetController\CreateTransactionController($request);
$response = $controller->executeWithApiResponse( \net\authorize\api\constants\ANetEnvironment::PRODUCTION);

if ($response != null)
{
  if($response->getMessages()->getResultCode() == "Ok")
  {
	$tresponse = $response->getTransactionResponse();

	  if ($tresponse != null && $tresponse->getMessages() != null)   
	{
	  echo " Transaction Response code : " . $tresponse->getResponseCode() . "\n";
	  echo "Refund SUCCESS: " . $tresponse->getTransId() . "\n";
	  echo " Code : " . $tresponse->getMessages()[0]->getCode() . "\n"; 
		echo " Description : " . $tresponse->getMessages()[0]->getDescription() . "\n";
	}
	else
	{
	  echo "Transaction Failed \n";
	  if($tresponse->getErrors() != null)
	  {
		echo " Error code  : " . $tresponse->getErrors()[0]->getErrorCode() . "\n";
		echo " Error message : " . $tresponse->getErrors()[0]->getErrorText() . "\n";            
	  }
	}
  }
  else
  {
	echo "Transaction Failed \n";
	$tresponse = $response->getTransactionResponse();
	if($tresponse != null && $tresponse->getErrors() != null)
	{
	  echo " Error code  : " . $tresponse->getErrors()[0]->getErrorCode() . "\n";
	  echo " Error message : " . $tresponse->getErrors()[0]->getErrorText() . "\n";                      
	}
	else
	{
	  echo " Error code  : " . $response->getMessages()->getMessage()[0]->getCode() . "\n";
	  echo " Error message : " . $response->getMessages()->getMessage()[0]->getText() . "\n";
	}
  }      
}
else
{
  echo  "No response returned \n";
}

return $response;
  
?>