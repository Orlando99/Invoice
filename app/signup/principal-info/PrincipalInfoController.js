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
			dob			: 'required'
		},
		messages: {
			streetName	: 'Please specify your street name!',
			city 		: 'Please specify your city!',
			state 		: 'Please specify your state!',
			zipCode 	: 'Please specify your zip code!',
			dob 		: 'Please specify your Date Of Birth!'
		}
	});

	$scope.principalInfo = {
		'streetName'	: signUpFactory.get('BusinessInfo','streetName'),
		'city'			: signUpFactory.get('BusinessInfo','city'),
		'state'			: signUpFactory.get('BusinessInfo','state'),
		'zipCode'		: signUpFactory.get('BusinessInfo','zipCode'),
		'dob'			: '',
		'ssn'			: ''
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
			table 	: 'BusinessInfo',
			params  : {
				field : "userID",
				value : signUpFactory.getParse("_User")
			}
		});

		signUpFactory.Save('BusinessInfo');

		signUpFactory.setObject({
			table	: 'User',
			params	: {
				field : 'BusinessInfo',
				value : signUpFactory.getParse("BusinessInfo")
			}
		});

		signUpFactory.Update("_User");

		$state.go('principal-info');
	};

	$scope.saveAndContinueLater = function(){

	};

}]);
