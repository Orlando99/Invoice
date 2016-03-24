'use strict';

invoicesUnlimited.controller('PrincipalInfoController',['$scope','$state','signUpFactory',function($scope,$state,signUpFactory){

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			streetName 	: 'required',
			city 		: 'required',
			state 		: 'required',
			zipCode 	: 'required',
			dob			: 'required',
			ssn			: 'required'
		},
		messages: {
			streetName	: 'Please specify your street name!',
			city 		: 'Please specify your city!',
			state 		: 'Please specify your state!',
			zipCode 	: 'Please specify your zip code!',
			dob 		: 'Please specify your Date Of Birth!',
			ssn			: 'Please specify your SSN!'
		}
	});

	$scope.principalInfo = {
		streetName		: signUpFactory.get('BusinessInfo','streetName'),
		city			: signUpFactory.get('BusinessInfo','city'),
		state			: signUpFactory.get('BusinessInfo','state'),
		zipCode			: signUpFactory.get('BusinessInfo','zipCode'),
		dob				: '',
		ssn				: ''
	};

	$scope.toggleHomeChecked = true;

	$scope.toggleHomeInfo = function(){

		if (!$scope.toggleHomeChecked) {
			$scope.principalInfo.streetName = "";
			$scope.principalInfo.city = "";
			$scope.principalInfo.state = "";
			$scope.principalInfo.zipCode = "";
			return;
		}

		$scope.principalInfo.streetName = signUpFactory.get('BusinessInfo','streetName');
		$scope.principalInfo.city = signUpFactory.get('BusinessInfo','city');
		$scope.principalInfo.state = signUpFactory.get('BusinessInfo','state');
		$scope.principalInfo.zipCode = signUpFactory.get('BusinessInfo','zipCode');
	};

	$scope.savePrincipalInfo = function(){
		if (!$('#signUpForm').valid()) return;

		for (var field in $scope.principalInfo){
			signUpFactory.set({
				table : 'PrincipalInfo',
				expr  : field + ":" + $scope.principalInfo[field]
			});
		}

		signUpFactory.setObject({
			table 	: 'PrincipalInfo',
			params  : {
				field : "userID",
				value : signUpFactory.getParse("_User")
			}
		});

		signUpFactory.Save('PrincipalInfo');

		$state.go('signup.account-info');
	};

	$scope.saveAndContinueLater = function(){
		Parse.User.logIn(signUpFactory.get('User','username'),
						 signUpFactory.get('User','password'), {
						 	success : function(user){
						 		$state.go('dashboard');
						 	},
						 	error : function(user, error){
						 		console.log(error.message);
						 	}
						});
	};

}]);
