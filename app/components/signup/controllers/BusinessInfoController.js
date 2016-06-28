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

invoicesUnlimited.controller('BusinessInfoController',
	['$scope','$state','signUpFactory','userFactory',
	function($scope,$state,signUpFactory,userFactory){

	if (!userFactory.entity.length) {
		$state.go('signup');
		return;
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

	$('#phone').mask("(Z00) 000-0000",{
		translation : {
			'Z': {
				pattern : /[2-9]/g
			}
		}
	}).val(signUpFactory.getField('User','phonenumber'));

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

		showLoader();

		for (var field in $scope.bsnsInfo){
			signUpFactory.setField('BusinessInfo',{
				field : field,
				value : $scope.bsnsInfo[field]
			});
		}

		var user = signUpFactory.getFactory('User');

		signUpFactory.setField('BusinessInfo',
							   'userID',
							   user.entity[0]);

		var business = signUpFactory.create('BusinessInfo');

		if (!business) {
			$state.go('signup');
			return;
		}

		business.then(function(obj){
			var save = signUpFactory.save('User',{'businessInfo':obj});
			if (save) return save;
			window.reload();
		},function(error){
			console.log(error.message);
		}).then(function(){
			hideLoader();
			$state.go('signup.principal-info');
		},function(error){
			console.log(error.message);
		});
	};

}]);
