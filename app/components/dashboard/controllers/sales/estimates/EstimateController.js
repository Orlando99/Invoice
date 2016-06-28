'use strict';

invoicesUnlimited.controller('EstimateController',['$q', '$scope', '$state', '$controller',
	'userFullFactory', 'estimateService', 'coreFactory', 'taxFactory', 'expenseService', 'currencyFilter',

function($q, $scope, $state, $controller, userFullFactory, estimateService,
	coreFactory, taxFactory, expenseService, currencyFilter) {

var user = userFullFactory.authorized();
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

var isGoTo = {
	details : function(to){
		return to.endsWith('estimates.details');	
	},
	estimates : function(to){ 
		return to.endsWith('estimates.all');
	},
	edit : function(to){
		return to.endsWith('estimates.edit');
	},
	newEstimate : function(to){
		return to.endsWith('estimates.new');	
	}
};

CheckUseCase();

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.estimates(stateName)) {
		console.log('its in list')
		listEstimates();

	} else if (isGoTo.newEstimate(stateName)) {
		console.log('its in new');

	} else if (isGoTo.edit(stateName)) {
		console.log('its in edit');
		prepareToEditEstimate();

	}
}

function prepareToEditEstimate() {
	var estimateId = $state.params.estimateId;
	if (! estimateId) return;

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
			return estimate.entity.get('customer').id === cust.entity.id;
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

function prepareEditForm() {
	var estimate = $scope.estimate;
	$scope.estimateNo = estimate.entity.estimateNumber;
	$scope.refNumber = estimate.entity.referenceNumber || "";
	$scope.disableEstNo =
		($scope.prefs.numAutoGen == 1) ? true : false;
	$scope.todayDate = estimate.entity.estimateDate;

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

	if(estimate.entity.status != 'Draft') {
		$scope.previouslySent = true;
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

	reCalculateSubTotal();
	hideLoader();
}

$scope.addEstimateItem = function() {
	var item = $scope.deletedItems.pop();
	if (! item /*|| ! item.id*/) {
		item = {id : undefined};
		++$scope.itemsWithOutId;
	} else {
		--$scope.itemsWithIdinDel;
	}

	item.selectedItem = undefined;
	item.selectedTax = undefined;
	item.rate = 0;
	item.quantity = 1;
	item.discount = 0;
	item.taxValue = 0;
	item.amount = 0;

	$scope.estimateItems.push(item);

//	console.log($scope.estimateItems);
//	console.log($scope.deletedItems);
//	console.log($scope.itemsWithOutId + ' ' + $scope.itemsWithIdinDel);
}

$scope.removeEstimateItem = function(index) {
	if ($scope.estimateItems.length > 1) {
		var delItem = $scope.estimateItems.splice(index,1)[0];
		if (delItem.id) {
			++$scope.itemsWithIdinDel;
			$scope.deletedItems.push(delItem);
		} else {
			--$scope.itemsWithOutId;
		}
		reCalculateSubTotal();
	} else {
		console.log("there should be atleast 1 item in an estimate");
	}
}

function useAllIds() {
	var unUsedIds = $scope.itemsWithIdinDel;
	var idsNeeded = $scope.itemsWithOutId;
	if(unUsedIds <= 0 || idsNeeded <= 0) return;

	var i = 0;
	var estItems = $scope.estimateItems;
	$scope.deletedItems.forEach(function(item) {
		if(! item.id) return;
		for (; i < estItems.length; ++i) {
			if(! estItems[i].id) {
				estItems[i].id = item.id;
				item.id = undefined;
				--$scope.itemsWithIdinDel;
				--$scope.itemsWithOutId;
				return;
			}
		}
	});
	$scope.deletedItems = $scope.deletedItems.filter(function(item) {
		if (item.id) return true;
		return false;
	});
}

function saveEditedEstimate() {
	var estimate = $scope.estimate.entity;
	estimate.set('customer', $scope.selectedCustomer.entity);
	estimate.set('estimateDate', $scope.todayDate);
	estimate.set('estimateNumber', $scope.estimateNo);
	estimate.set('discountType', $scope.prefs.discountType);
	estimate.set('discounts', $scope.discount);
	estimate.set('shippingCharges', $scope.shippingCharges);
	estimate.set('adjustments', $scope.adjustments);
	estimate.set('subTotal', Number($scope.subTotal));
	estimate.set('totalAmount', Number($scope.total));
	estimate.set('referenceNumber', $scope.refNumber);
	estimate.set('salesPerson', $scope.salesPerson);
	estimate.set('notes', $scope.notes);
	estimate.set('termsConditions', $scope.terms);

	var email = $scope.selectedCustomer.entity.email;
	if(email)
		estimate.set('customerEmails', [email]);
	else estimate.unset('customerEmails');

	return estimateService.updateEstimate
		($scope.estimate, $scope.estimateItems, $scope.deletedItems,
			user, $scope.userRole);
}

function saveAndSendEditedEstimate () {
	return saveEditedEstimate()
		.then(function(estimate) {
		return estimateService.createEstimateReceipt(estimate.id)
		.then(function(estimateObj) {
			return estimateService.sendEstimateReceipt(estimateObj);
		});
	});
}

$scope.save = function() {
	showLoader();
	useAllIds();
	saveEditedEstimate()
	.then(function(estimate) {
		hideLoader();
		console.log(estimate);
		$state.go('dashboard.sales.estimates.all');

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveAndSend = function () {
	showLoader();
	useAllIds();
	saveAndSendEditedEstimate()
	.then(function(estimate) {
		hideLoader();
		console.log(estimate);
		$state.go('dashboard.sales.estimates.all');

	}, function (error) {
		hideLoader();
		console.log(error);
	});
}

//----- common --------
$scope.cancel = function() {
	$state.go('dashboard.sales.estimates.all');
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
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
//----------------

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

	p = taxFactory.getTaxes(user, function(taxes) {
		$scope.taxes = taxes;
	});
	promises.push(p);

	return $q.all(promises);
}

function listEstimates() {
	showLoader();
	$q.when(estimateService.listEstimates(user))
	.then(function(res) {
		res.forEach(function(obj) {
			// Draft, Sent, Invoiced, Accepted, Declined
			switch (obj.entity.status) {
			case "Draft":
			case "Sent":
				obj.statusClass = "text-color-normalize";
				break;
			case "Invoiced":
			case "Accepted":
				obj.statusClass = "text-positive";
				break;
			case "Declined":
				obj.statusClass = "text-danger";
				break;
			default:
				obj.statusClass = "text-color-normalize";
			}

			obj.estimateDate = formatDate(
				obj.entity.estimateDate, "MM/DD/YYYY");
			obj.totalAmount = currencyFilter(obj.entity.totalAmount, '$', 2);
		});

	//	res = res.reverse();
		$scope.estimateList = res;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}

}]);