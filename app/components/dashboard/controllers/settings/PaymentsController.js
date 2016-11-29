'use strict';

invoicesUnlimited.controller('PaymentsController',['$rootScope','$scope', '$state',
	'$controller', '$q', 'userFactory', 'signUpFactory',
function($rootScope,$scope,$state,$controller,$q,userFactory,signUpFactory){

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
signUpFactory.setDefaultValues();
    
    if(!$scope.userLogo){
        var selectedorganization = userFactory.entity[0].get("selectedOrganization");
        var query = new Parse.Query('Organization');
        query.get(selectedorganization.id, {
              success: function(obj) {
                  $scope.org = obj;
                  var logo = obj.get('logo');
                  if(logo){
                    $scope.userLogo = logo._url;
                  }
                  else{
                      $scope.userLogo = './assets/images/user-icon.png';
                  }
                  $scope.$apply();

              },
              error: function(obj, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
        });
    }


var incompleteAccountMsg = 'You have not completed the merchant account application. \
Please click continue below to resume where you left off.';

var processingMsg = 'Your application has been submitted. \
Please wait two business days for the approval process. <br/>\
If you have not heard anything from us within two business days, \
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