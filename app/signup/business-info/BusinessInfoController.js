'use strict';

$(document).ready(function(){
	$.validator.addMethod(
		"OwhershipTypeNotSelected",
		function(value,element){
			return value != "ownershipTitle";
		}
	);
	$.validator.addMethod(
		"FederalTaxIDisMissing",
		function(value,element){
			if ($(element).css('display') == 'none') return true;
			else if (value == "") return false;
			return true;
		}
	)
});

invoicesUnlimited.controller('BusinessInfoController',['$scope','$state','userFactory','signUpFactory',
	function($scope,$state,userFactory,signUpFactory){

	if (userFactory.authorized()){
		if (userFactory.getBusinessInfo()) $state.go('signup.principal-info');
		else {
			userFactory.logout();
			$state.go('signup');
		}		
	}

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			company 	: 'required',
			streetName	: 'required',
			city 		: 'required',
			state 		: 'required',
			zipCode 	: 'required',
			phoneNumber : 'required',
			businessDescription : 'required',
			ownershipType : {
				OwhershipTypeNotSelected : true
			},
			federalTaxID : {
				FederalTaxIDisMissing : true
			}
		},
		messages: {
			company 	: 'Please specify your business name!',
			streetName	: 'Please specify your street name!',
			city 		: 'Please specify your city!',
			state 		: 'Please specify your state!',
			zipCode 	: 'Please specify your zip code!',
			phoneNumber : 'Please specify your phone number!',
			businessDescription : 'Please specify your business description!',
			ownershipType : {
				OwhershipTypeNotSelected : "Please select your ownership type!"
			},
			federalTaxID : {
				FederalTaxIDisMissing : 'Please specify your phone number!'
			}
		}
	});

	$scope.bsnsInfo = {
		'businessName'  : signUpFactory.get('User','company'),
		'streetName'	: '',
		'city'			: '',
		'state'			: '',
		'zipCode'		: '',
		'phoneNumber'	: signUpFactory.get('User','phonenumber'),
		'businessDescription' : '',
		'federalTaxID'	: '',
		ownershipType	: 'Ownership Type'
	}

	$scope.options = [{
   		name: 'ownershipTitle',
   		value: 'Ownership Type'
	}, {
   		name: 'Sole Proprietor',
   		value: 'Sole Proprietor'
	},
	{
   		name: 'LLC',
   		value: 'LLC'
	},
	{
   		name: 'Corporation and Non Profit',
   		value: 'Corporation and Non Profit'
	}];

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

		userFactory.login({
			username : signUpFactory.get('User','username'),
			password : signUpFactory.get('User','password')
		},function(){

			if (!userFactory.authorized) return;

			signUpFactory.Save('User',{
				businessInfo : signUpFactory.getParse("BusinessInfo")
			});

			$state.go('signup.principal-info');

		});
	};

}]);
