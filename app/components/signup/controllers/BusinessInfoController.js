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
	['$scope','$state','signUpFactory','userFactory','roleFactory',
	function($scope,$state,signUpFactory,userFactory,roleFactory){

	if (!userFactory.entity.length){
		$state.go('signup');
		return;
	}

	if (!signUpFactory.getVerification.code()) {
		userFactory.logout();
		$state.go('signup');
		return;
	}

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
		var user = signUpFactory.getFactory('User');
		
		['BusinessInfo',
		 'Organization',
		 'Role'].forEach(function(table){
		 	signUpFactory.setField(table,'userID',user.entity[0]);
		 });

		['Organization',
		 'Role'].forEach(function(table){
		 	signUpFactory.setField(table,'name',user.entity[0].company);
		 });

		signUpFactory.setField('Organization',"email",user.entity[0].email);

		var org  = signUpFactory.create('Organization');

		/*org.then(function(obj){
			signUpFactory.setField('BusinessInfo','organization',obj);
		})*/

/*
		var Organization = Parse.Object.extend('Organization');
		var org = new Organization();
		org.set('userID', user.entity[0]);
		org.set('name', signUpFactory.getField('User', 'company'));
		org.set('email', signUpFactory.getField('User', 'email'));
		org.set('invoiceNumber', 'INV-0001');
		org.set('estimateNumber', 'EST-0001');
		org.set('creditNumber', 'CN-0001');
		org.set('fiscalYearStart', 'January');
		org.set('dateFormat', 'MM/dd/yyyy');
		org.set('fieldSeparator', '/');
		org.set('language', 'en-us');
		// set timezone somehow
		org.set('timeZone', '( PDT ) America/Los_Angeles ( Pacific Standard Time )');

		var data = {};
		org.save().then(function(obj) {
			data.organization = obj;
			signUpFactory.setField('BusinessInfo', 'organization', obj);

			var Currency = Parse.Object.extend('Currency');
			var currency = new Currency();

			return currency.save({
				'userID' : user.entity[0],
				'organization' : obj,
				'currencySymbol' : '$',
				'decimalPlace' : 2,
				'format' : '###,###,###',
				'title' : 'USD - US Dollar'
			});
		})
		.then(function(obj) {
			data.currency = obj;
			
			var business = signUpFactory.create('BusinessInfo');

			if (!business) {
				$state.go('signup');
				return;
			}

			return business;	
		})
		.then(function(obj){
			var save = signUpFactory.save('User',{
				'businessInfo' : obj,
				'organizations' : [data.organization],
				'selectedOrganization' : data.organization,
				'currency' : data.currency
			});
			if (save) return save;
			window.reload();
		},function(error){
			console.log(error.message);
		}).then(function(){
*/
		
		var business 	= signUpFactory.create('BusinessInfo');
		var role 		= signUpFactory.create("Role");

		Parse.Promise.when([business,role,org])
		.then(function(busObj, roleObj, orgObj){
			busObj.setACL(roleFactory.createACL());
			orgObj.setACL(roleFactory.createACL());
			busObj.set('organization',orgObj);
			return Parse.Promise.when([busObj.save(),orgObj.save()]);
		},errorCallback)
		.then(function(busObj,orgObj){
			return signUpFactory.save('User',{'businessInfo':busObj});
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

}]);
