'use strict';

invoicesUnlimited.controller('InvoiceSettingsController',['$q' ,'$scope', '$state', '$controller',
	'userFactory', 'invoiceService',
	
function($q, $scope, $state, $controller, userFactory, invoiceService) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}
var user = userFactory.entity[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

loadInvoicePrefs();

function loadInvoicePrefs() {
	$q.when(invoiceService.getPreferences(user))
	.then(function(prefs) {
		$scope.prefs = prefs;
		console.log(prefs);

		$scope.invoiceAg   = (prefs.numAutoGen  == 1 ? 'yes' : 'no');
		$scope.shipCharges = (prefs.shipCharges == 1 ? 'yes' : 'no');
		$scope.adjustments = (prefs.adjustments == 1 ? 'yes' : 'no');
		$scope.salesPerson = (prefs.salesPerson == 1 ? 'yes' : 'no');
		$scope.notes = prefs.notes;
		$scope.terms = prefs.terms;
		$scope.showLateFee = 'no';

		var arr = prefs.invoiceNumber.split('-');
		$scope.prefix = arr[0];
		$scope.nxtNumber = arr[1];
		$scope.customFields = prefs.customFields || [];

		$scope.customFields.forEach(function(field) {
			field.checked = field.isChecked == 'YES' ? true : false;
		})
	
		switch(prefs.discountType) {
		case 0:
			$scope.discounts = 'nodiscounts';
			break;

		case 1:
			$scope.discounts = 'atindividual';
			break;

		case 2:
			$scope.discounts = 'atinvoicelevel';
			$scope.discountPlace = 'before';
			break;

		case 3:
			$scope.discounts = 'atinvoicelevel';
			$scope.discountPlace = 'after';
			break;
		}

	}, function(error) {
		console.log(error.message);
	});
}

$scope.removeField = function(index) {
	if($scope.customFields.length > 0) {
		$scope.customFields.splice(index,1);
	}
}

$scope.addField = function() {
	$scope.customFields.push({
		name : '',
		isChecked : '',
		checked : false
	});
}

$scope.save = function() {
	showLoader();
	var prefs = {
		invoiceAg : ($scope.invoiceAg == 'yes' ? 1 : 0),
		shipCharges : ($scope.shipCharges == 'yes' ? 1 : 0),
		adjustments : ($scope.adjustments == 'yes' ? 1 : 0),
		salesPerson : ($scope.salesPerson == 'yes' ? 1 : 0),
		notes : $scope.notes,
		terms : $scope.terms,

	}

	if($scope.invoiceAg == 'yes') {
		prefs.invoiceNumber = [$scope.prefix, $scope.nxtNumber].join('-');
	}

	var newFields = [];
	$scope.customFields.forEach(function(field) {
		field.isChecked = field.checked ? 'YES' : 'NO';
		delete field.checked;
		
		newFields.push({
			isChecked : field.isChecked,
			name : field.name
		});
	});
	prefs.customFields = newFields;

	switch($scope.discounts) {
	case 'nodiscounts':
		prefs.discountType = 0;
		break;

	case 'atindividual':
		prefs.discountType = 1;
		break;

	case 'atinvoicelevel':
		prefs.discountType = ($scope.discountPlace == 'before' ? 2 : 3);
		break;
	}

//	console.log(prefs);

	$q.when(invoiceService.setPreferences(user, prefs))
	.then(function() {
		console.log('invoice prefs updated.');
		$state.reload();
		hideLoader();

	}, function(error) {
		console.log(error.message);
		hideLoader();
	});

}

}]);
