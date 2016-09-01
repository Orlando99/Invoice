'use strict';

invoicesUnlimited.controller('CurrencyController',['$q','$scope','$state', '$controller',
	'userFactory', 'currencyFactory', 'coreFactory',
function($q,$scope,$state,$controller, userFactory, currencyFactory, coreFactory){

if(!userFactory.entity.length) {
	console.log('User not logged in');
	$state.go('login');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
loadCurrencies();

$scope.availableCurrencies = ['AUD - Australian Dollar',
	'CAD - Canadian Dollar', 'PCNY - Yuan Renminbi',
	'EUR - Euro', 'GBP - Pound sertling',
	'PKR - Pakistani Rupee', 'USD - US Dollar'];

function loadCurrencies() {
	$q.when(currencyFactory.loadAll({
		organization : organization
	}))
	.then(function(currencies) {
		$scope.currencies = currencies;
		hideLoader();
	});
}

$scope.prepareAddCurrency = function() {
	$scope.currencyObj = {
		title : undefined,
		currencySymbol : undefined,
		decimalPlace : '0',
		format : '###,###,###',
		exchangeRate : undefined
	}
	$('#addCurrencyForm').validate({
		rules : {
			currencyCode : 'required',
			currencySymbol : 'required',
			exchangeRate : {
				number : true,
				min : 0,
			}
		}
	});
	$('#addCurrencyForm').validate().resetForm();
}

$scope.prepareEditCurrency = function(index) {
	var currency = $scope.currencies[index].entity;
	$scope.selectedIndex = index;
	$scope.currencyObj = {
		title : currency.title,
		currencySymbol : currency.currencySymbol,
		decimalPlace : currency.decimalPlace + '',
		format : currency.format,
		exchangeRate : currency.exchangeRate
	}
	$('.edit-currency').addClass('show');
	$('#editCurrencyForm').validate({
		rules : {
			currencyCode : 'required',
			currencySymbol : 'required',
			exchangeRate : {
				number : true,
				min : 0,
			}
		}
	});
	$('#editCurrencyForm').validate().resetForm();
}

$scope.saveNewCurrency = function() {
	if(! $('#addCurrencyForm').valid()) return;

	showLoader();
	var params = $scope.currencyObj;
	params.userID = user;
	params.organization = organization;
	params.decimalPlace = Number(params.decimalPlace);
	params.exchangeRate = Number(params.exchangeRate) || undefined;

	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return currencyFactory.createNewCurrency(params, role);
	})
	.then(function(currency) {
		$scope.currencies.push(currency);
		$('.new-currency').removeClass('show');
		hideLoader();
	});
}

$scope.saveEditedCurrency = function() {
	if(! $('#editCurrencyForm').valid()) return;

	showLoader();
	var currency = $scope.currencies[$scope.selectedIndex].entity;
	var params = $scope.currencyObj;
	params.decimalPlace = Number(params.decimalPlace);
	params.exchangeRate = Number(params.exchangeRate) || undefined;

	['title', 'currencySymbol', 'decimalPlace', 'format']
	.forEach(function(field) {
		currency.set(field, params[field]);
	});
	if(params.exchangeRate)
		currency.set('exchangeRate', params.exchangeRate);
	else
		currency.unset('exchangeRate');

	$q.when(currencyFactory.saveEditedCurrency(currency))
	.then(function(obj) {
		$scope.currencies[$scope.selectedIndex] = obj;
		$('.edit-currency').removeClass('show');
		hideLoader();
	});

}

$scope.setDefaultCurrency = function() {
	console.log('set selected currency to be default of user, simple.')
}

$scope.deleteCurrency = function() {
	console.log('lookip ios what delete means, -selectedCurrency-');
}

$scope.currencyChanged = function() {
	if($scope.currencyObj)
		$scope.currencyObj.currencySymbol =
			$scope.currencyObj.title.split(' ')[0];

}

}]);