'use strict';

invoicesUnlimited.controller('AccountInfoController',['$scope','$state','userFullFactory','signUpFactory',
	function($scope,$state,userFullFactory,signUpFactory){

	if (userFullFactory.authorized()) {
		if (!userFullFactory.getBusinessInfo() || !signUpFactory.getParse("BusinessInfo")) {
			userFullFactory.logout();
			$state.go('signup');
		}
	} else $state.go('signup');

	$.validator.addMethod(
		"AvgSaleRequired",
		function(value,element){
			return value != "avgSaleTitle";
		}
	);

	$.validator.addMethod(
		"MonthlySalesRequired",
		function(value,element){
			return value != 'monthlySalesTitle';
		}
	);

	$('[name=routingNumber]').mask('000000000');
	$('[name=accountNumber]').mask('0000000000');

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			avgSale 		: {
				required : true,
				AvgSaleRequired : true
			},
			monthlySales 	: {
				required : true,
				MonthlySalesRequired : true
			},
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

	$scope.avgSaleList = [];
	$scope.monthlySalesList = [];
	
	var moneyVal = 0;
	
	do {
		if (!moneyVal) moneyVal = 1;
		else if (moneyVal == 1) moneyVal = 5;
		else if (moneyVal < 100) moneyVal += 5;
		else if (moneyVal < 1000) moneyVal += 50;
		else if (moneyVal < 10000) moneyVal += 500;
		else moneyVal += 5000;
		$scope.avgSaleList.push({value:"$ " + (moneyVal == 50000 ? moneyVal + "+" : moneyVal)});
	} while(moneyVal != 50000)

	moneyVal = 0;

	do {
		if (moneyVal < 25000) moneyVal += 500;
		else moneyVal += 5000;
		$scope.monthlySalesList.push({value:"$ " + (moneyVal == 100000 ? moneyVal + "+" : moneyVal)});
	} while(moneyVal != 100000)

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

		showLoader();

		for (var field in $scope.accountInfo){
			signUpFactory.set({
				table : 'AccountInfo',
				expr  : field + ":" + $scope.accountInfo[field]
			});
		}

		signUpFactory.set({
			table 	: 'AccountInfo',
			expr	: 'inPerson:' + ($scope.accountInfo['inPerson'] == 'inPerson'? 'true':'false')
		});

		signUpFactory.setObject({
			table 	: 'AccountInfo',
			params  : {
				field : "userID",
				value : signUpFactory.getParse("_User")
			}
		});

		signUpFactory.Save({
			tableName : 'AccountInfo',
			callback  : function(){
				if (!userFullFactory.authorized) return;
				signUpFactory.Save('User',{
					accountInfo : signUpFactory.getParse("AccountInfo")
				},function(){
					hideLoader();
					$state.go('signup.signature');
				});
			}
		});
	};

	$scope.saveAndContinueLater = function(){
		/*if (!userFullFactory.authorized){
			var user = signUpFactory.getParse('_User');
			userFullFactory.login({
				username : user.get('username'),
				password : user.get('password'),
			},function(){
				$state.go('dashboard');
			});
		}
		else*/
		if (userFullFactory.authorized())
			$state.go('dashboard');
	};

}]);
