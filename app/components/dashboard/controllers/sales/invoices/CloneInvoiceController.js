'use strict';

invoicesUnlimited.controller('CloneInvoiceController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'invoiceService', 'salesCommon',
function($scope, $state, $controller, $q, userFactory,
	invoiceService, salesCommon) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});


var invoiceId = $state.params.invoiceId;
if(! invoiceId) return;

var promises = [];
var p = null;

p = $q.when(invoiceService.getInvoice(invoiceId))
.then(function(invoice) {
	$scope.invoice = invoice;
});
promises.push(p);

p = $q.when(salesCommon.loadRequiredData({
	user : user,
	organization : organization,
	_scope : $scope
}))
.then(function(data) {
	Object.assign($scope, data);
});
promises.push(p);

$q.all(promises)
.then(function() {
	prepareForm();
});

function prepareForm() {
	$scope.invoiceItems = [];
	$scope.selectedCustomer = $scope.customers.filter(function(cust) {
		return $scope.invoice.entity.get('customer').id === cust.entity.id;
	})[0];
	return $q.when(salesCommon.customerChangedHelper({
		organization : organization,
		_scope : $scope
	}))
	.then(function(data) {
		Object.assign($scope, data);
		return salesCommon.fillInvoiceForm($scope);
	})
	.then(function(data) {
		$scope.invoiceNo = $scope.prefs.invoiceNumber; // invoice number should be new
		salesCommon.addValidationExceptItems($scope);
		salesCommon.reCalculateSubTotal($scope);
		hideLoader();
	})
}

function saveInvoice() {
	var invoice = {
		userID : user,
		organization : organization,
		customer : $scope.selectedCustomer.entity,
		invoiceDate : $scope.todayDate,
		invoiceNumber : $scope.invoiceNo,
		status : "Unpaid",
		discountType : $scope.prefs.discountType,
		discounts : $scope.discount,
		shippingCharges : $scope.shippingCharges,
		adjustments : $scope.adjustments,
		subTotal : Number($scope.subTotal),
		total : Number($scope.total),
		balanceDue : Number($scope.total),
		poNumber : $scope.poNumber,
		salesPerson : $scope.salesPerson,
		notes : $scope.notes,
		terms : $scope.terms

	};
	if($scope.customFields.length) {
		var fields = [];
		$scope.customFields.forEach(function(field) {
			if (field.value) {
				var obj = {};
				obj[field.name] = field.value;
				fields.push(obj);
			}
		});
		if (fields.length) {
			invoice.customFields = fields;
		}
	}
	if($scope.selectedLateFee) {
		invoice.lateFee = $scope.selectedLateFee.entity;
	}
	if ($scope.paymentTerms.selectedTerm.value == 1)
		invoice.dueDate = $scope.dueDate;

	var email = $scope.selectedCustomer.entity.email;
	if(email) invoice.customerEmails = [email];

	return invoiceService.createNewInvoice
		(invoice, $scope.invoiceItems, $scope.userRole, $scope.files);
}

function saveAndSendInvoice() {
	return saveInvoice()
	.then(function(invoice) {
		return invoiceService.copyInInvoiceInfo(invoice)
		.then(function(invoiceInfo) {
			return invoiceService.createInvoiceReceipt(invoice.id, invoiceInfo.id);
		})
		.then(function(invoiceObj) {
			return invoiceService.sendInvoiceReceipt(invoiceObj);
		});
	});
}

$scope.save = function() {
	if (! salesCommon.validateForms())	return;

	showLoader();
	$q.when(invoiceService.checkInvoiceNumAvailable({
		invoiceNumber : $scope.invoiceNo,
		organization : organization
	}))
	.then(function(avilable) {
		if (avilable) {
			return saveInvoice();

		} else {
			salesCommon.showInvoiceNumberError();
			scrollToOffset();
			return Promise.reject('Invoice with this number already exists');
		}
	})
	.then(function(invoice) {
		hideLoader();
		$state.go('dashboard.sales.invoices.all');

	}, function (error) {
		hideLoader();
		console.log(error);
	});
}

$scope.saveAndSend = function () {
	if (! salesCommon.validateForms())	return;

	showLoader();
	$q.when(invoiceService.checkInvoiceNumAvailable({
		invoiceNumber : $scope.invoiceNo,
		organization : organization
	}))
	.then(function(avilable) {
		if (avilable) {
			return saveAndSendInvoice()

		} else {
			salesCommon.showInvoiceNumberError();
			scrollToOffset();
			return Promise.reject('Invoice with this number already exists');
		}
	})
	.then(function(invoice) {
		hideLoader();
		$state.go('dashboard.sales.invoices.all');

	}, function (error) {
		hideLoader();
		console.log(error);
	});
}

$scope.cancel = function() {
	$state.go('dashboard.sales.invoices.all');
}

$scope.addNewFile = function(obj) {
	var file = obj.files[0];
	file.fileName = file.name; // to avoid naming conflict
	$scope.files.push(file);
	$scope.$apply();
}

$scope.removeFile = function(index) {
	$scope.files.splice(index,1);
}

$scope.calculateDueDate = function() {		
	salesCommon.calculateDueDate($scope);
}

$scope.paymentTermsChanged = function() {
	salesCommon.paymentTermsChanged($scope);
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
		case 2: $scope.openPicker2 = true; break;
	}
}

$scope.addInvoiceItem = function() {
	salesCommon.addInvoiceItem($scope);
}

$scope.reCalculateTotal = function() {
	salesCommon.reCalculateTotal($scope);
}

$scope.reCalculateItemAmount = function(index) {
	salesCommon.reCalculateItemAmount({
		index : index,
		_scope : $scope
	});
}

$scope.removeInvoiceItem = function(index) {
	salesCommon.removeInvoiceItem({
		index : index,
		_scope : $scope
	});
}

$scope.itemChanged = function(index) {
	salesCommon.itemChanged({
		index : index,
		_scope : $scope
	})
}

$scope.customerChanged = function() {
	salesCommon.customerChanged({
		organization : organization,
		_scope : $scope
	});
}

}]);