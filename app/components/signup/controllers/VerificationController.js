'use strict';

invoicesUnlimited.controller('VerificationController',['$scope','$state','userFullFactory','signUpFactory',
	function($scope,$state,userFullFactory,signUpFactory){
	
	if (!userFullFactory.authorized() && 
		(signUpFactory.get('User','email') == '' || signUpFactory.get('User','phonenumber') == '')) 
		$state.go('signup');

	$.validator.addMethod(
		"CodeMatch",
		function(value,element){
			return (md5(value) == signUpFactory.getVerification.code());
		}
	);

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules : {
			code : {
				required : true,
				CodeMatch : true
			}
		},
		messages : {
			code : {
				required : "Verification Code is empty!",
				CodeMatch : "Verification Code is wrong!"
			}
		}
	})

	$scope.verificationCodeProvider = signUpFactory.getVerification.provider();

	$scope.verifyCode = function(){
		var inputCode = $('#verificationCode').val();
		var inputHash = md5(inputCode);
		//if (inputHash == signUpFactory.getVerification.code()){
		if ($('#signUpForm').valid()){
			signUpFactory.Save('User');
			$state.go('signup.business-info');
		}
	};

	$scope.changePhoneNumber = function(){
		$state.go('signup');
	};

}]);
