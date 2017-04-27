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
		$scope.invoiceNotification = (user.get('getInvoiceNotification') == 1 ? 'yes' : 'no');
		$scope.notes = prefs.notes;
		$scope.terms = prefs.terms;
		$scope.showLateFee = 'no';
		$scope.invoiceThanksNotes = prefs.thanksNote;
		$scope.paymentConfirmation = (prefs.thanksNote.length > 0 ? 'yes' : 'no');

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

$scope.prepareAddFeeForm = function() {
	$scope.latefeeName = '';
	$scope.selectedFeeType = $scope.latefeeTypes[0];
	$scope.latefeeAmount = '';

	$('#addLateFeeForm').validate({
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
	$('#addLateFeeForm').validate().resetForm();
}

$scope.addLateFee = function() {
	if (! $('#addLateFeeForm').valid()) return;

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

$scope.prepareEditFeeForm = function() {
	var obj = $scope.lateFees[
		$scope.feeList.indexOf($scope.selectedFee)];
	if (! obj) return;

	var obj = obj.entity;
	$scope.latefeeName = obj.name;
	$scope.selectedFeeType = obj.type;
	$scope.latefeeAmount = obj.price;

	$('#editLateFeeForm').validate({
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
	$('#editLateFeeForm').validate().resetForm();
}

$scope.updateLateFee = function() {
	var index = $scope.feeList.indexOf($scope.selectedFee);
	var obj = $scope.lateFees[index];
	if (! (obj && $('#editLateFeeForm').valid()) ) return;
	
	showLoader();
	obj = obj.entity;
	obj.set('name', $scope.latefeeName);
	obj.set('type', $scope.selectedFeeType);
	obj.set('price', Number($scope.latefeeAmount));

	$q.when(lateFeeService.updateLateFee(obj))
	.then(function(newObj) {
		$scope.lateFees[index] = newObj;
		$scope.feeList[index] = lateFeeNameHelper(newObj);
		$scope.selectedFee = $scope.feeList[index];
		$('.edit-latefee').removeClass('show');
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
		thanksNote : ($scope.paymentConfirmation == 'yes' ? $scope.invoiceThanksNotes : "")
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

	user.set('getInvoiceNotification', $scope.invoiceNotification == 'yes' ? 1 : 0);
	user.save();
	
	$q.when(invoiceService.setPreferences(user, prefs))
	.then(function() {
		console.log('invoice prefs updated.');
        
        showSnackbar("Save Successful. Reloading page in 3 sec...");
        setTimeout(function(){ $state.reload(); }, 2000);
        /*
		$state.reload();
        showSnackbar("Save Successful");
        */
		hideLoader();

	}, function(error) {
		console.log(error.message);
		hideLoader();
	});

}

}]);
