'use strict';

invoicesUnlimited.controller('CloneEstimateController',
	['$scope', '$state', '$controller', '$q', 'userFactory', 'estimateService',
	'coreFactory', 'taxService', 'expenseService', 'currencyFilter',
function($scope, $state, $controller, $q, userFactory, estimateService,
	coreFactory, taxService, expenseService, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});


var estimateId = $state.params.estimateId;
if(! estimateId) return;

prepareToClone();

$('#addEstimateForm').validate({
	rules: {
		customer : 'required',
		estimateNumber : 'required',
		estimateCreateDate : 'required'
	},
	messages: {
		customer : 'Please select a customer',
		estimateNumber : 'Please enter estimate number',
		estimateCreateDate : 'Please provide estimate Create date'
	}
});

$('#extrasForm').validate({
	rules: {
		discount : {
			number : true,
			min : 0
		},
		shipCharges : {
			number : true,
			min : 0
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
				required : 'Please select an item'
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
				required : 'Please provide item quantity',
				min : 'quantity should be >= 1',
				digits : 'quantity must be integer'
			}
		});
	});

	$('.check-rate').each(function() {
		$(this).rules ('remove');
		$(this).rules('add', {
			required : true,
			min : 0,
			number : true,
			messages : {
				required : 'Please provide item rate',
				min : 'rate should be >= 0'
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
				min : 'discount should be >= 0',
				max : 'discount should be <= 100'
			}
		});
	});

}

$scope.dateOptions = {
	showWeeks : false
};
	
function prepareToClone() {
	showLoader();
	$q.when(LoadRequiredData())
	.then(function(msg) {
		return $q.when(estimateService.getEstimate(estimateId));
	})
	.then(function (estimate) {
		console.log(estimate);

		$scope.estimate = estimate;
		$scope.estimateItems = [];
		$scope.deletedItems = [];
		$scope.itemsWithOutId = 0;
		$scope.itemsWithIdinDel = 0;
		
		$scope.selectedCustomer = $scope.customers.filter(function(cust) {
			return estimate.entity.get('customer').id == cust.entity.id;
		})[0];
		return $q.when(customerChangedHelper());
	})
	.then(function() {
		prepareEditForm();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

function LoadRequiredData() {
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

	p = taxService.getTaxes(user, function(taxes) {
		$scope.taxes = taxes;
	});
	promises.push(p);

	return $q.all(promises);
}

$scope.addNewFile = function(obj) {
		var file = obj.files[0];
        
        var n = file.name;
        
        if(!(n.toLowerCase().endsWith('.pdf') || n.toLowerCase().endsWith('.png') || n.toLowerCase().endsWith('.jpg') || n.toLowerCase().endsWith('.jpeg'))){
            $('#file-error').show();
            return;
        }
        $('#file-error').hide();
		file.fileName = file.name; // to avoid naming conflict
		$scope.files.push(file);
		if(!$scope.$$phase)
			$scope.$apply();
	}

	$scope.removeFile = function(index) {
		$scope.files.splice(index,1);
	}
    
function prepareEditForm() {
	var estimate = $scope.estimate;

	if($scope.prefs.numAutoGen == 1) {
		$scope.estimateNo = $scope.prefs.estimateNumber;
		$scope.disableEstNo = true;
	} else {
		$scope.estimateNo = "";
		$scope.disableEstNo = false;
	}

	$scope.refNumber = estimate.entity.referenceNumber || "";
	$scope.todayDate = new Date();

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

	$scope.discount = estimate.entity.discounts;
	$scope.notes = estimate.entity.notes;
	$scope.terms = estimate.entity.termsConditions;
	
	$scope.showShippingCharges = false;
	$scope.showAdjustments = false;
	
	/*
	if ($scope.prefs.shipCharges) {
		$scope.shippingCharges = estimate.entity.shippingCharges;
		$scope.showShippingCharges = true;
	}

	if ($scope.prefs.adjustments) {
		$scope.adjustments = estimate.entity.adjustments;
		$scope.showAdjustments = true;
	}
	*/
	if ($scope.prefs.salesPerson) {
		$scope.salesPerson = estimate.entity.salesPerson || "";
		$scope.showSalesPerson = true;
	}

	if(estimate.entity.status != 'Draft') {
		$scope.previouslySent = true;
	}
    
    var files = estimate.entity.estimateFiles;
		if (files) {
			files.forEach(function(file) {
				file.fileName = file.name();
				file.exist = true;
			});
			$scope.files = files;
		} else {
			$scope.files = [];
		}

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

		$scope.estimateItems.push(obj);
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

	var fields = estimate.entity.customFields;
	if (fields && fields.length) {
		customFields.forEach(function(field) {
			for(var i=0; i < fields.length; ++i) {
				if (fields[i][field.name]) {
					field.value = fields[i][field.name];
					break;
				}
			}
		});
	}
	$scope.customFields = customFields;
	reCalculateSubTotal();
	hideLoader();
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
		console.log("there should be atleast 1 item in an estimate");
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
	$scope.itemTaxes = [];

	// no need to check discountType,
	// itemInfo.discount is zero, so, expression will evaluate to 1.
	items.forEach(function(item) {
		subTotal += item.amount * ((100 - item.discount) * 0.01);
		item.taxValue = calculateTax(item.amount, item.selectedTax);
		totalTax += item.taxValue;
		if (item.selectedTax) {
			$scope.itemTaxes.push({
				nameValue :  item.selectedTax.name + ' (' + item.selectedTax.rate + '%)',
				amount: currencyFilter(item.taxValue, '$', 2)
			});
		}
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
		(estimate, $scope.estimateItems, $scope.userRole, $scope.files);
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

function validateForms () {
	setValidationRules();
	var a = $('#addEstimateForm').valid();
	var b = $('#itemInfoForm').valid();
	var c = $('#extrasForm').valid();
	
	if (a && b && c) return true;
	else {
		var v = undefined;
		if (!a)
			v = $('#addEstimateForm').validate();
		else if (!b)
			v = $('#itemInfoForm').validate();
		else if (!c)
			v = $('#extrasForm').validate();

		var offset = $(v.errorList[0].element).offset().top - 30;
		scrollToOffset(offset);
		return false;
	}
}

$scope.save = function() {
	if (! validateForms())	return;

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
			scrollToOffset();
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
	if (! validateForms())	return;

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
			scrollToOffset();
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