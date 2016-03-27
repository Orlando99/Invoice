'use strict';

invoicesUnlimited.controller('AccountInfoController',['$scope','$state','userFactory','signUpFactory',
	function($scope,$state,userFactory,signUpFactory){

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			avgSale 		: 'required',
			monthlySales 	: 'required',
			bankName 		: 'required',
			routingNumber	: 'required',
			accountNumber	: 'required'

		},
		messages: {
			avgSale 		: 'Please specify your average sale per customer!',
			monthlySales 	: 'Please specify your estimated montly credit card sales!',
			bankName 		: 'Please specify your bank name!',
			routingNumber	: 'Please specify your bank routing number',
			accountNumber	: 'Please specify your bank account number'			
		}
	});

	if (userFactory.authorized) {
		if (!userFactory.getBusinessInfo()) {
			userFactory.logout();
			$state.go('signup');
		}
	} else $state.go('signup');

	$scope.accountInfo = {
		bankName		: '',
		routingNumber	: '',
		accountNumber	: '',
		avgSale			: '',
		inPerson		: 'inPerson',
		monthlySales	: ''
	};

	$scope.saveAccountInfo = function(){
		if (!$('#signUpForm').valid()) return;

		for (var field in $scope.accountInfo){
			signUpFactory.set({
				table : 'AccountInfo',
				expr  : field + ":" + $scope.accountInfo[field]
			});
		}

		signUpFactory.setObject({
			table 	: 'AccountInfo',
			params  : {
				field : "userID",
				value : signUpFactory.getParse("_User")
			}
		});

		signUpFactory.Save('AccountInfo');

		if (!userFactory.authorized) return;

		signUpFactory.Save('User',{
			accountInfo : signUpFactory.getParse("AccountInfo")
		},function(){
			$state.go('signup.signature');
		});
	};

	$scope.saveAndContinueLater = function(){
		if (!userFactory.authorized){
			var user = signUpFactory.getParse('_User');
			userFactory.login({
				username : user.get('username'),
				password : user.get('password'),
			},function(){
				$state.go('dashboard');
			});
		}
		else $state.go('dashboard');
	};

}]);
