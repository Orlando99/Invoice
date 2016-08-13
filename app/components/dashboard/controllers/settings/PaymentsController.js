'use strict';

invoicesUnlimited.controller('PaymentsController',['$rootScope','$scope', '$state',
	'$controller', '$q', 'userFactory',
function($rootScope,$scope,$state,$controller,$q,userFactory){

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});


var incompleteAccountMsg = 'You have not completed the merchant account application. \
Please click continue below to resume where you left off.';

var processingMsg = 'Your application has been submitted. \
Please wait two business days for the approval process. \
If you have not heard anything from us within two business days,\
please call or email us at:';

var approvedMsg = 'You have been approved to process credit cards.';

var bInfo = user.get('businessInfo');
var pInfo = user.get('principalInfo');
var aInfo = user.get('accountInfo');
var signature = user.get('signatureImage');

var merchantID = user.get('merchantID');
var EPNusername = user.get('EPNusername');
var EPNrestrictKey = user.get('EPNrestrictKey');

if (! (bInfo && pInfo && aInfo && signature)) {
	$scope.incompleteProfile = true;
	$scope.infoMsg = incompleteAccountMsg;

} else if (! (merchantID && EPNusername && EPNrestrictKey)) {
	$scope.processingRequest = true;
	$scope.infoMsg = processingMsg;
	$scope.phoneNumber = '(800) 554-4777';
	$scope.email = 'support@invoicesunlimited.com';

} else {
	$scope.approved = true;
	$scope.infoMsg = approvedMsg;
	$scope.merchantID = merchantID;
	$scope.businessName = user.get('company');
	$scope.accountSupportNumber = '(800) 554-4777';
	$scope.softwareSupportNumber = '(888) 995-9614';
	$scope.email = 'support@invoicesunlimited.com';
}

hideLoader();

$scope.continueProcess = function() {
	$rootScope.fromPaymentSettings = true;

	if(! bInfo) {
		$state.go('signup.business-info');

	} else if(! pInfo) {
		$state.go('signup.principal-info');

	} else if(! aInfo) {
		$state.go('signup.account-info');

	} else if(! signature) {
		$state.go('signup.signature');
	}
}

}]);