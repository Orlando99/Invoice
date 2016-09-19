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
	$.validator.addMethod(
		"exactlength",
		function(value, element, param) {
 			return value.length == param;
		}
	);
});

invoicesUnlimited.controller('BusinessInfoController',
	['$rootScope','$scope','$state','signUpFactory','userFactory','roleFactory',
	function($rootScope,$scope,$state,signUpFactory,userFactory,roleFactory){

	if (!userFactory.entity.length){
		$state.go('signup');
		return;
	}

	if (!signUpFactory.getVerification.code() && ! $rootScope.fromPaymentSettings) {
		userFactory.logout();
		$state.go('signup');
		return;
	}

	// User object in signUpFactory doesn't have data.
	if($rootScope.fromPaymentSettings) {
		var user = userFactory.entity[0];
		signUpFactory.setField('User','company', user.get('company'));
		signUpFactory.setField('User','phonenumber', user.get('phonenumber'));
		signUpFactory.setField('BusinessInfo', 'organization',
			user.get('selectedOrganization'));
	}
        
        $("input").keyup(function(event){
            var id = event.target.id;
            $('#' + id + '-' + 'error').css('display', 'none');
       
            $('#' + id).removeClass('error');
    });

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			company 			: 'required',
			streetName			: 'required',
			city 				: 'required',
			state 				: 'required',
			zipCode 			: 'required',
			phoneNumber 		: 'required',
			businessDescription : 'required',
			ownershipType : {
				OwhershipTypeNotSelected : true
			},
			federalTaxID : {
				FederalTaxIDisMissing : true,
				exactlength : 10

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
				FederalTaxIDisMissing : 'Please specify your Federal Tax ID!',
				exactlength : 'Please enter exactly 9 digits'
			}
		}
	});

	$('input[name="federalTaxID"]').mask('00-0000000');

	$scope.bsnsInfo = {
		'businessName'  : signUpFactory.getField('User','company'),
		'streetName'	: '',
		'city'			: '',
		'state'			: '',
		'zipCode'		: '',
		'phoneNumber'	: signUpFactory.getField('User','phonenumber'),
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
		
		var business 	= signUpFactory.create('BusinessInfo');

		business
		.then(function(busObj){
			return signUpFactory.save('User',{
				'businessInfo' : busObj,
			});
		},
		function(err){
			if (!err.length) console.log(err.message);
			err.forEach(function(er){
				console.log(er.message);
			});
		})
		.then(function(){
			hideLoader();
			$state.go('signup.principal-info');
		},errorCallback);
	};

	$scope.federalTaxIdClick = function() {
		var checked = $('.federal-tax-id').prop('checked');
		$('.federal-tax-id-input').hide();
		$scope.bsnsInfo.federalTaxID = '';
		if(checked == true)
			$('.federal-tax-id-input').show();
	}

}]);
