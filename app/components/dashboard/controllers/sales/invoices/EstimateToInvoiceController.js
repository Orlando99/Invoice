'use strict';

invoicesUnlimited.controller('EstimateToInvoiceController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'invoiceService', 'salesCommon', 'estimateService',
function($scope, $state, $controller, $q, userFactory,
	invoiceService, salesCommon, estimateService) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

var estimateId = $state.params.estimateId;
if(! estimateId) return;

var promises = [];
var p = null;

p = $q.when(estimateService.getEstimate(estimateId))
.then(function(estimate) {
	$scope.estimate = estimate;
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
		return $scope.estimate.entity.get('customer').id === cust.entity.id;
	})[0];
	return $q.when(salesCommon.customerChangedHelper({
		organization : organization,
		_scope : $scope
	}))
	.then(function() {
		var estimate = $scope.estimate;
		$scope.invoiceNo = $scope.prefs.invoiceNumber; // invoice number should be new
		$scope.poNumber = estimate.entity.referenceNumber || "";
		$scope.disableInvNo =
			($scope.prefs.numAutoGen == 1) ? true : false;

		$scope.hasDueDate = true;
		$scope.todayDate = new Date();
		salesCommon.calculateDueDate($scope);

		$scope.paymentTerms = {
			terms : [
				{name: "Due on Receipt", value : 1},
				{name: "Off", 			 value : 0}
			],
			selectedTerm : {name: "Due on Receipt", value : 1}
		};

		$scope.files = [];
		switch($scope.prefs.discountType) {
			case 0:
				$scope.itemLevelTax = false;
				$scope.invoiceLevelTax = false;
				break;

			case 1:
				$scope.itemLevelTax = true;
				$scope.invoiceLevelTax = false;
				break;

			case 2:
			case 3:
				$scope.itemLevelTax = false;
				$scope.invoiceLevelTax = true;
				break;
		}

		$scope.notes = estimate.entity.notes;
		$scope.terms = estimate.entity.termsConditions;
		
		if ($scope.prefs.shipCharges) {
			$scope.shippingCharges = estimate.entity.shippingCharges;
			$scope.showShippingCharges = true;
		}

		if ($scope.prefs.adjustments) {
			$scope.adjustments = estimate.entity.adjustments;
			$scope.showAdjustments = true;
		}

		if ($scope.prefs.salesPerson) {
			$scope.salesPerson = estimate.entity.salesPerson || "";
			$scope.showSalesPerson = true;
		}

		$scope.invoiceItems = [];
		for (var i = 0; i < estimate.estimateItems.length; ++i) {
			var estItem = estimate.estimateItems[i].entity;
			var actualItem = estItem.get('item');
			var obj = {};

			obj.selectedItem = $scope.items.filter(function(item) {
				if (item.entity.id === actualItem.id) {
					obj.id = estItem.id;
					obj.rate = (estItem.amount / estItem.quantity); //Number(item.entity.rate);
					obj.quantity = estItem.quantity;
					obj.discount = estItem.discount || 0;
					obj.taxValue = 0;
					obj.amount = estItem.amount;

					var estItemTax = estItem.get('tax');
					if (estItemTax) {
						obj.selectedTax = $scope.taxes.filter(function(tax) {
							return tax.id === estItemTax.id;
						})[0];
					} else {
						obj.selectedTax = undefined;
					}

					return true;
				}
				return false;
			})[0];

			$scope.invoiceItems.push(obj);
		}

		var customFields = [];
		if($scope.prefs.customFields) {
			$scope.prefs.customFields.forEach(function(field) {
				if (field.isChecked == 'YES') {
					customFields.push({
						name : field.name,
						value: ""
					});
				}
			});
		}
		$scope.customFields = customFields;

		salesCommon.addValidationExceptItems($scope);
		salesCommon.reCalculateSubTotal($scope);
		hideLoader();
	});
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