'use strict';

invoicesUnlimited.controller('VerificationController',
	['$scope','$state','userFullFactory',
	 'signUpFactory','userFactory',
	function($scope,$state,userFullFactory,signUpFactory,userFactory){
	
	if (!signUpFactory.getVerification.code()) {
		$state.go('signup');
		return;
	}

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
		if (!$('#signUpForm').valid()) {
			alert('Code is wrong!');
			return;
		}
		showLoader();
		signUpFactory.signup()
		.then(function(){
			
			var user = userFactory.entity[0];
			
			['BusinessInfo',
			 'AccountInfo',
			 'PrincipalInfo',
			 'Organization',
			 'Signature',
			 'Currency',
			 'Role'].forEach(function(table){
			 	signUpFactory.setField(table,'userID',user);
			 });

			['Organization',
			 'Role'].forEach(function(table){
			 	signUpFactory.setField(table,'name',user.company);
			 });

			signUpFactory.setField('Organization',"email",user.email);

			return signUpFactory.create('Role');
			
		},function(error){
			console.log(error.message);
		})
		.then(function(){
			var org = signUpFactory.create('Organization');
			return org;
		},function(err){
			console.log(err.message);
		})
		.then(function(orgObj){
			['BusinessInfo',
			 'AccountInfo',
			 'PrincipalInfo',
			 'Signature',
			 'Currency'].forEach(function(table){
				signUpFactory.setField(table,'organization',orgObj);
			});
			var curr = signUpFactory.create('Currency');
			return curr;
		},function(err){
			console.log(err.message);
		})
		.then(function(currObj) {
			hideLoader();
			$state.go('signup.business-info');
		},function(err){
			console.log(err.message);
		});
	};

	$scope.changePhoneNumber = function(){
		$state.go('signup');
	};
}]);
