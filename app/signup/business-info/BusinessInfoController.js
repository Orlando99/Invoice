'use strict';

invoicesUnlimited.controller('BusinessInfoController',['$scope','$state','signUpFactory',function($scope,$state,signUpFactory){

	if (!signUpFactory.getVerification.code()) $state.go('signup');

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			company 	: 'required',
			streetName	: 'required',
			city 		: 'required',
			state 		: 'required',
			zipCode 	: 'required',
			phoneNumber : 'required'
		},
		messages: {
			company 	: 'Please specify your business name!',
			streetName	: 'Please specify your street name!',
			city 		: 'Please specify your city!',
			state 		: 'Please specify your state!',
			zipCode 	: 'Please specify your zip code!',
			phoneNumber : 'Please specify your phone number!'
		}
	});

	$scope.bsnsInfo = {
		'businessName'  : signUpFactory.get('User','company'),
		'streetName'	: '',
		'city'			: '',
		'state'			: '',
		'zipCode'		: '',
		'phoneNumber'	: signUpFactory.get('User','phonenumber'),
		'products' 		: '',
		'federalTaxID'	: '',
		'ownershipType'	: ''
	}

	$scope.saveBusinessInfo = function(){
	
		if (!$('#signUpForm').valid()) return;

		for (var field in $scope.bsnsInfo){
			signUpFactory.set({
				table : 'BusinessInfo',
				expr  : field + ":" + $scope.bsnsInfo[field]
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

}]);
