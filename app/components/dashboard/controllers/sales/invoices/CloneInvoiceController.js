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
}));
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
	.then(function() {
		return salesCommon.fillInvoiceForm($scope);
	})
	.then(function() {
		$scope.invoiceNo = $scope.prefs.invoiceNumber; // invoice number should be new
		salesCommon.addValidationExceptItems($scope);
		salesCommon.reCalculateSubTotal($scope);
		hideLoader();
	})
}

$scope.save = function() {
	salesCommon.save({
		_scope : $scope,
		user : user,
		organization : organization
	});
}

$scope.saveAndSend = function() {
	salesCommon.saveAndSend({
		_scope : $scope,
		user : user,
		organization : organization
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

$scope.prepareCreateItem = function() {
	salesCommon.prepareCreateItem({
		_scope : $scope
	});
}

$scope.createNewItem = function() {
	salesCommon.createNewItem({
		_scope : $scope,
		user : user,
		organization : organization
	});
}

}]);