'use strict';

invoicesUnlimited.controller('VerificationController',
	['$rootScope','$scope','$state','userFullFactory',
	 'signUpFactory','userFactory',
	function($rootScope,$scope,$state,userFullFactory,signUpFactory,userFactory){
	
	if (!signUpFactory.getVerification.code()) {
		$state.go('signup');
		return;
	}

	$.validator.addMethod(
		"CodeMatch",
		function(value,element){
            return true;
			//return (md5(value) == signUpFactory.getVerification.code());
		}
	);

	$("#signUpForm").validate({
		onkeyup : function(element) {$(element).valid()},
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

	var dirty = false;
	$scope.codeChanged = function() {
		if(dirty) {
			$('#signUpForm').validate().resetForm();
			dirty = false;
		}
	}

	$scope.verificationCodeProvider = signUpFactory.getVerification.provider();

	$scope.verifyCode = function(){
		if (!$('#signUpForm').valid()) {
		//	alert('Code is wrong!');
			dirty = true;
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
			 'Preferences',
			 'Role'].forEach(function(table){
			 	signUpFactory.setField(table,'userID',user);
			 });

			['Organization',
			 'Role'].forEach(function(table){
			 	signUpFactory.setField(table,'name',user.company);
			 });

			signUpFactory.setField('Organization',"email",user.email);

			return signUpFactory.create('Role');
            //return;
			
		},function(error){
			console.log(error.message);
		})
		.then(function(){
			var org = signUpFactory.create('Organization');
			return org;
		},function(err){
			console.log(err.message);
		})
		.then(function(orgObj) {
			return signUpFactory.copyDefaultCategories({
				user : userFactory.entity[0],
				organization : orgObj
			})
			.then(function() {
				return orgObj;
			});
		})
		.then(function(orgObj){
			['BusinessInfo',
			 'AccountInfo',
			 'PrincipalInfo',
			 'Signature',
			 'Preferences',
			 'Currency'].forEach(function(table){
				signUpFactory.setField(table,'organization',orgObj);
			});
			var curr = signUpFactory.create('Currency');
			var pref = signUpFactory.create('Preferences');
			return Parse.Promise.when([curr,pref]);
		},function(err){
			console.log(err.message);
		})
		.then(function(currObj,prefObj) {
			hideLoader();
			$rootScope.fromPaymentSettings = false;
			$state.go('signup.business-info');
		},function(err){
			if (!err.length) {
				console.log(err.message);
				return;
			}
			err.forEach(function(er){console.log(er.message);});
		});
	};

	$scope.changePhoneNumber = function(){
		$state.go('signup');
	};
}]);
