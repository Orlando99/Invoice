'use strict';

invoicesUnlimited.controller('VerificationController',['$scope','$state','signUpFactory',function($scope,$state,signUpFactory){

	if (!signUpFactory.getVerification.code()) $state.go('signup');

	$scope.verificationCodeProvider = signUpFactory.getVerification.provider();

	$scope.verifyCode = function(){
		var inputCode = $('#verificationCode').val();
		var inputHash = md5(inputCode);
		if (inputHash == signUpFactory.getVerification.code()){
			signUpFactory.Save('User');
			$state.go('business-info');
		}
	};

}]);
