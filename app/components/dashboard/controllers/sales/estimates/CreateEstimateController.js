'use strict';

invoicesUnlimited.controller('CreateEstimateController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'estimateService', 'coreFactory', 'taxService', 'expenseService',
	'currencyFilter',
function($scope, $state, $controller, $q, userFactory,
	estimateService,coreFactory,taxService,expenseService,currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
prepareToCreateEstimate();

$('#addEstimateForm').validate({
	rules: {
		customer : 'required',
		estimateNumber : 'required',
		estimateCreateDate : 'required',
		estimateDueDate : 'required'
	},
	messages: {
		customer : 'Please select a customer',
		estimateNumber : 'Please enter estimate number',
		estimateCreateDate : 'Please provide estimate create date',
		estimateDueDate : 'Please provide estimate due date'
	}
});

$('#extrasForm').validate({
	rules: {
		discount : {
			number : true,
			min : 0.01
		},
		shipCharges : {
			number : true,
			min : 0.01
		},
		adjustment : {
			number : true
		}
	}
});

$('#itemInfoForm').validate();

function setValidationRules() {
/*		
	if (! $('.check-item').length) {
		console.log('atleast one item');
		return false;
	}
*/	
	$('.check-item').each(function() {
		$(this).rules ('remove');
		$(this).rules('add', {
			required : true,
			messages : {
				required : 'its required'
			}
		});
	});

	$('.check-qty').each(function() {
		$(this).rules ('remove');
		$(this).rules('add', {
			required : true,
			min : 1,
			digits : true,
			messages : {
				required : 'its required',
				min : '>= 1',
				digits : 'must be integer'
			}
		});
	});

	$('.check-rate').each(function() {
		$(this).rules ('remove');
		$(this).rules('add', {
			required : true,
			min : 0.01,
			number : true,
			messages : {
				required : 'its required',
				min : '>= 0.01'
			}
		});
	});

	$('.check-discount').each(function() {
		$(this).rules ('remove');
		$(this).rules('add', {
			min : 0,
			max : 100,
			number : true,
			messages : {
				min : '>= 0.01',
				max : '<= 100'
			}
		});
	});

}

function prepareToCreateEstimate() {
	showLoader();
	var promises = [];
	var p = null;

	p = $q.when(coreFactory.getAllCustomers())
	.then(function(res) {
		$scope.customers = res.sort(function(a,b){
			return alphabeticalSort(a.entity.displayName,b.entity.displayName)
		});
	//	$scope.selectedCustomer = $scope.customers[0];
	});
	promises.push(p);

	p = $q.when(coreFactory.getAllItems({
		organization : organization
	})).then(function(items) {
		$scope.actualItems = items.filter(function(item) {
			return !item.entity.expanseId;
		});
		$scope.expenseItems = items.filter(function(item) {
			return item.entity.expanseId;
		});
		$scope.items = $scope.actualItems;
	});
	promises.push(p);

	p = $q.when(estimateService.getPreferences(user))
	.then(function(prefs) {
		$scope.prefs = prefs;
	});
	promises.push(p);

	p = $q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		$scope.userRole = role;
	});
	promises.push(p);

	// TODO: tax factory
	p = taxService.getTaxes(user, function(taxes) {
		$scope.taxes = taxes;
	});
	promises.push(p);

	$q.all(promises).then(function() {
		// TODO:
		prepareForm();
		//--

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});

}

function prepareForm() {
	if($scope.prefs.numAutoGen == 1) {
		$scope.estimateNo = $scope.prefs.estimateNumber;
		$scope.disableEstNo = true;
	} else {
		$scope.estimateNo = "";
		$scope.disableEstNo = false;
	}
	$scope.notes = $scope.prefs.notes;
	$scope.terms = $scope.prefs.terms;

	$scope.todayDate = new Date();
	$scope.subTotalStr = currencyFilter(0, '$', 2);

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
			$scope.discountStr = currencyFilter(0, '$', 2);
			break;
	}

	if ($scope.prefs.shipCharges) {
		$scope.showShippingCharges = true;
		$scope.shippingChargesStr = currencyFilter(0, '$', 2);
	}

	if ($scope.prefs.adjustments) {
		$scope.showAdjustments = true;
		$scope.adjustmentsStr = currencyFilter(0, '$', 2);
	}

	if ($scope.prefs.salesPerson)
		$scope.showSalesPerson = true;

	// put first item placeholder
	$scope.estimateItems = [{
		selectedItem : undefined,
		selectedTax : undefined,
		rate : 0,
		quantity : 1,
		discount : 0,
		amount : 0
	}];

	var customerId = $state.params.customerId;
	var expenseId = $state.params.expenseId;

	if(customerId) {
		$scope.selectedCustomer = $scope.customers.filter(function(cust) {
			return cust.entity.id == customerId;
		})[0];
		$q.when(customerChangedHelper())
		.then(function() {
		//	console.log($scope.items);
			$scope.addEstimateItem();
			$scope.estimateItems[0].selectedItem = $scope.items.filter(function(item) {
				return item.entity.expanseId == expenseId;
			})[0];
			$scope.estimateItems[0].selectedItem.create = true; // create new item everytime
			$scope.itemChanged(0);
		});
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

	hideLoader();
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}

$scope.addEstimateItem = function() {
	$scope.estimateItems.push({
		selectedItem : undefined,
		selectedTax : undefined,
		rate : 0,
		quantity : 1,
		discount : 0,
		taxValue : 0,
		amount : 0
	});
}

$scope.removeEstimateItem = function(index) {
	if ($scope.estimateItems.length > 1) {
		$scope.estimateItems.splice(index,1);
		reCalculateSubTotal();

	} else {
	/*	var item = $scope.estimateItems[0];
		item.selectedItem = undefined,
		item.selectedTax = undefined,
		item.rate = 0,
		item.quantity = 1,
		item.discount = 0,
		item.taxValue = 0,
		item.amount = 0

		$scope.totalTax = 0;
		$scope.subTotal = 0;
		$scope.subTotalStr = currencyFilter(0, '$', 2);
		$scope.reCalculateTotal();
	*/	console.log("there should be atleast 1 item in an estimate");
	}
}

$scope.reCalculateTotal = function() {
	var subTotal = Number($scope.subTotal) || 0;
	var discount = Number($scope.discount) || 0;
	var shipCharges = Number($scope.shippingCharges) || 0;
	var adjustments = Number($scope.adjustments) || 0;
	var totalTax = Number($scope.totalTax) || 0;
	var sum = subTotal + totalTax;
	var discountRatio = (100 - discount) * 0.01;

	if($scope.prefs.discountType == 2) // before tax
		sum = (subTotal * discountRatio) + totalTax;
	else if ($scope.prefs.discountType == 3) // after tax
		sum = (subTotal + totalTax) * discountRatio;

	discount = Math.abs(sum - subTotal - totalTax);
	$scope.total = sum + shipCharges + adjustments;
	$scope.discountStr = currencyFilter(discount, '$', 2);
	$scope.shippingChargesStr = currencyFilter(shipCharges, '$', 2);
	$scope.adjustmentsStr = currencyFilter(adjustments, '$', 2);
	$scope.totalStr = currencyFilter($scope.total, '$', 2);
}

function reCalculateSubTotal() {
	var items = $scope.estimateItems;
	var subTotal = 0;
	var totalTax = 0;

	// no need to check discountType,
	// itemInfo.discount is zero, so, expression will evaluate to 1.
	items.forEach(function(item) {
		subTotal += item.amount * ((100 - item.discount) * 0.01);
		item.taxValue = calculateTax(item.amount, item.selectedTax);
		totalTax += item.taxValue;
	});

	$scope.totalTax = totalTax;
	$scope.subTotal = subTotal;
	$scope.subTotalStr = currencyFilter(subTotal, '$', 2);
	$scope.reCalculateTotal();
}

$scope.reCalculateItemAmount = function(index) {
	var itemInfo = $scope.estimateItems[index];
	if (! itemInfo.selectedItem) return;

	itemInfo.amount = itemInfo.rate * itemInfo.quantity;
	reCalculateSubTotal();
}


$scope.itemChanged = function(index) {
//	console.log('item changed');
	var itemInfo = $scope.estimateItems[index];
	itemInfo.rate = Number(itemInfo.selectedItem.entity.rate);
	var tax = itemInfo.selectedItem.tax;
	if (!tax) {
	//	console.log("no tax applied");
		itemInfo.selectedTax = "";
	} else {
		var taxes = $scope.taxes;
		for (var i = 0; i < taxes.length; ++i) {
			if (tax.id == taxes[i].id) {
				itemInfo.selectedTax = taxes[i];
				break;
			}
		}
	}
	$scope.reCalculateItemAmount(index);
}

function customerChangedHelper() {
	return $q.when(expenseService.getCustomerExpenses({
		organization : organization,
		customer : $scope.selectedCustomer.entity
	}))
	.then(function(custExpenses) {
	//	console.log(custExpenses);
		// filter current customer's expenses from all expenses
		var custExpenseItems = [];
		for (var i = 0; i < custExpenses.length; ++i) {
			for (var j = 0; j < $scope.expenseItems.length; ++j) {
				if (custExpenses[i].entity.id == $scope.expenseItems[j].entity.expanseId) {
					custExpenseItems.push($scope.expenseItems[j]);
				}
			}
		}
	//	console.log(custExpenseItems);
		// check is any expense has updated
		var newExpenseItems = [];
		for(var i = 0; i < custExpenses.length; ++i) {
			var exp = custExpenses[i].entity;
			var itemExist = custExpenseItems.some(function(item) {
				return (exp.category == item.entity.title &&
					exp.amount == Number(item.entity.rate));
			});
			if (! itemExist) {
				newExpenseItems.push({
					create : true,
					tax   : exp.tax,
					entity : {
						title : exp.category,
						rate  : String(exp.amount),
						expanseId : exp.id
					}
				});
			}
		}
	//	console.log(newExpenseItems);
		// remove unrelated estimate items
		var newItems = $scope.actualItems.concat(custExpenseItems,newExpenseItems);
		$scope.estimateItems = $scope.estimateItems.filter(function(estItem) {
			if(!estItem.selectedItem || estItem.selectedItem.create)
				return false;
			return newItems.some(function(item) {
				return item.entity.id == estItem.selectedItem.entity.id;
			});
		});
	//	console.log($scope.estimateItems);
		return $scope.items = newItems;
	});
}

$scope.customerChanged = function() {
	showLoader();
	$q.when(customerChangedHelper())
	.then(function() {
		if($scope.estimateItems.length < 1) {
			$scope.addEstimateItem();
			$scope.totalTax = 0;
			$scope.subTotal = 0;
			$scope.subTotalStr = currencyFilter(0, '$', 2);
			$scope.reCalculateTotal();

		} else {
			reCalculateSubTotal();
		}

		hideLoader();
	});
}

function saveEstimate() {
	var estimate = {
		userID : user,
		organization : organization,
		customer : $scope.selectedCustomer.entity,
		estimateDate : $scope.todayDate,
		estimateNumber : $scope.estimateNo,
		status : "Draft",
		discountType : $scope.prefs.discountType,
		discounts : $scope.discount,
		shippingCharges : $scope.shippingCharges,
		adjustments : $scope.adjustments,
		subTotal : Number($scope.subTotal),
		totalAmount : Number($scope.total),
		referenceNumber : $scope.refNumber,
		salesPerson : $scope.salesPerson,
		notes : $scope.notes,
		termsConditions : $scope.terms

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
			estimate.customFields = fields;
		}
	}
	var email = $scope.selectedCustomer.entity.email;
	if(email) estimate.customerEmails = [email];

	return estimateService.createNewEstimate
		(estimate, $scope.estimateItems, $scope.userRole);
}

function saveAndSendEstimate() {
	return saveEstimate()
	.then(function(estimate) {
		return estimateService.createEstimateReceipt(estimate.id)
		.then(function(estimateObj) {
			return estimateService.sendEstimateReceipt(estimateObj);
		});
	});
}

$scope.cancel = function() {
	$state.go('dashboard.sales.estimates.all');
}

$scope.save = function() {
	setValidationRules();
	var a = $('#addEstimateForm').valid();
	var b = $('#extrasForm').valid();
	var c = $('#itemInfoForm').valid();
	if(! (a && b && c)) return;
	
	showLoader();
	$q.when(estimateService.checkEstimateNumAvailable({
		estimateNumber : $scope.estimateNo,
		organization : organization
	}))
	.then(function(avilable) {
		if (avilable) {
			return saveEstimate();

		} else {
			showEstimateNumberError();
			return Promise.reject('Estimate with this number already exists');
		}
	})
	.then(function(estimate) {
		hideLoader();
		$state.go('dashboard.sales.estimates.all');

	}, function (error) {
		hideLoader();
		console.log(error);
	});
}

$scope.saveAndSend = function () {
	setValidationRules();
	var a = $('#addEstimateForm').valid();
	var b = $('#extrasForm').valid();
	var c = $('#itemInfoForm').valid();
	if(! (a && b && c)) return;

	showLoader();
	$q.when(estimateService.checkEstimateNumAvailable({
		estimateNumber : $scope.estimateNo,
		organization : organization
	}))
	.then(function(avilable) {
		if (avilable) {
			return saveAndSendEstimate();

		} else {
			showEstimateNumberError();
			return Promise.reject('Estimate with this number already exists');
		}
	})
	.then(function(estimate) {
		hideLoader();
		$state.go('dashboard.sales.estimates.all');

	}, function (error) {
		hideLoader();
		console.log(error);
	});

}

function showEstimateNumberError () {
	var validator = $( "#addEstimateForm" ).validate();
	validator.showErrors({
		"estimateNumber": "Estimate with this number already exists"
	});
}

}]);