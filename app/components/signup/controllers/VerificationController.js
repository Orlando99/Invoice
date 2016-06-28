'use strict';

invoicesUnlimited.controller('VerificationController',
	['$scope','$state','userFullFactory',
	 'signUpFactory','userFactory',
	function($scope,$state,userFullFactory,signUpFactory,userFactory){
	
	/*if (!userFullFactory.authorized() && 
		(signUpFactory.get('User','email') == '' || signUpFactory.get('User','phonenumber') == '')) 
		$state.go('signup');*/

	if (!signUpFactory.getVerification.code()) $state.go('signup');

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
		if (!$('#signUpForm').valid()) return;
		signUpFactory.signup().then(function(){
			$state.go('signup.business-info');
		},function(error){
			console.log(error.message);
		})
	};

	$scope.changePhoneNumber = function(){
		$state.go('signup');
	};
}]);
