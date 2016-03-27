'use strict';

invoicesUnlimited.controller('VerificationController',['$scope','$state','userFactory','signUpFactory',
	function($scope,$state,userFactory,signUpFactory){
	
	if (!userFactory.authorized() && signUpFactory.get('User','email') == '') 
		$state.go('signup');

	$scope.verificationCodeProvider = signUpFactory.getVerification.provider();

	$scope.verifyCode = function(){
		var inputCode = $('#verificationCode').val();
		var inputHash = md5(inputCode);
		if (inputHash == signUpFactory.getVerification.code()){
			signUpFactory.Save('User');
			$state.go('signup.business-info');
		}
	};

}]);
