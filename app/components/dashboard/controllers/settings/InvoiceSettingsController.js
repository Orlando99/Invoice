'use strict';

invoicesUnlimited.controller('InvoiceSettingsController',['$q' ,'$scope', '$state', '$controller',
	'userFactory', 'invoiceService', 'coreFactory', 'lateFeeService',
	
function($q, $scope, $state, $controller, userFactory, invoiceService, coreFactory, lateFeeService) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}
var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

loadPrefs();

$('#settingsForm').validate({
	rules: {
		prefix : 'required',
		nextNumber : {
			required : true,
			digits : true,
			min : 1
		},
		discntplace : 'required'
	}
});

function setValidationRules() {
	$('.check-name').each(function() {
		$(this).rules ('remove');
		$(this).rules('add', {
			required : true,
			messages : {
				required : 'Please provide field name'
			}
		});
	});
}

function loadPrefs() {
	showLoader();

	var promise = $q.when(lateFeeService.getAllLateFees({
		organization : organization
	}));

	$q.when(invoiceService.getPreferences(user))
	.then(function(prefs) {
		$scope.prefs = prefs;
	//	console.log(prefs);

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
		
		return promise;
	})
	.then(function(objs) {
		$scope.lateFees = objs;
		$scope.feeList = objs.map(lateFeeNameHelper);
		$scope.latefeeTypes = ['%', '$'];
		$scope.selectedFeeType = '%';
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

function lateFeeNameHelper(obj) {
	var fee = obj.entity;
	return fee.name + ' ' +
		fee.price + ' (' +
		fee.type + ')';
}

$scope.prepareAddLateFee = function() {
	$('#latefeeForm').validate({
		rules: {
			name : 'required',
			type : 'required',
			amount : {
				required : true,
				number : true,
				min : 0.01
			}
		}
	});
	$('#latefeeForm').validate().resetForm();
}

$scope.addLateFee = function() {
	if (! $('#latefeeForm').valid()) return;
	
	showLoader();
	var params = {
		userID : user,
		organization : organization,
		name : $scope.latefeeName,
		type : $scope.selectedFeeType,
		price: Number($scope.latefeeAmount)
	};

	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return lateFeeService.createLateFee(params, role);
	})
	.then(function(obj) {
		$scope.lateFees.push(obj);
		$scope.feeList.push(lateFeeNameHelper(obj));
		$('.add-latefee').removeClass('show');
		hideLoader();
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
	setValidationRules();
	if (! $('#settingsForm').valid()) {
		var v = $('#settingsForm').validate();
		var offset = $(v.errorList[0].element).offset().top - 30;
		scrollToOffset(offset);
		return;	
	}

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
