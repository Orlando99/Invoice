'use strict';

invoicesUnlimited.controller('CreateCreditNoteController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'creditNoteService', 'coreFactory', 'taxService', 'expenseService',
	'currencyFilter',
function($scope, $state, $controller, $q, userFactory,
	creditNoteService, coreFactory, taxService, expenseService, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
prepareToCreateCreditNote();

function prepareToCreateCreditNote() {
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

	p = $q.when(creditNoteService.getPreferences(user))
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

	$q.all(promises).then(function() {
		prepareForm();
		//--


	}, function(error) {
		hideLoader();
		console.log(error.message);
	});

}

function prepareForm() {
	if($scope.prefs.numAutoGen == 1) {
		$scope.creditNo = $scope.prefs.creditNumber;
		$scope.disableCreditNo = true;
	} else {
		$scope.creditNo = "";
		$scope.disableCreditNo = false;
	}
	$scope.notes = $scope.prefs.notes;
	$scope.terms = $scope.prefs.terms;

	$scope.todayDate = new Date();
	$scope.subTotalStr = currencyFilter(0, '$', 2);

	// put first item placeholder
	$scope.creditItems = [{
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
			console.log($scope.items);
			$scope.addCreditItem();
			$scope.creditItems[0].selectedItem = $scope.items.filter(function(item) {
				return item.entity.expanseId == expenseId;
			})[0];
			$scope.creditItems[0].selectedItem.create = true; // create new item everytime
			$scope.itemChanged(0);
		});
	}

	hideLoader();
}

function saveCreditNote() {
	var creditNote = {
		userID : user,
		organization : organization,
		customer : $scope.selectedCustomer.entity,
		creditNoteDate : $scope.todayDate,
		creditNumber : $scope.creditNo,
		status : "Open",
		subTotal : Number($scope.subTotal),
		creditsUsed : 0,
		refundsMade : 0,
		total : Number($scope.total),
		remainingCredits : Number($scope.total),
		reference : $scope.refNumber,
		notes : $scope.notes,
		terms : $scope.terms

	};
	var email = $scope.selectedCustomer.entity.email;
	if(email) creditNote.customerEmails = [email];

	return creditNoteService.createNewCreditNote
		(creditNote, $scope.creditItems, $scope.userRole);
}

function saveAndSendCreditNote() {
	return saveCreditNote()
	.then(function(creditNote) {
		return creditNoteService.createCreditNoteReceipt(creditNote.id)
		.then(function(creditNoteObj) {
			return creditNoteService.sendCreditNoteReceipt(creditNoteObj);
		});
	});
}

$scope.save = function() {
	showLoader();
	saveCreditNote()
	.then(function(creditNote) {
		hideLoader();
		console.log(creditNote);
		$state.go('dashboard.sales.creditnotes.all');

	}, function (error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveAndSend = function () {
	showLoader();
	saveAndSendCreditNote()
	.then(function(creditNote) {
		hideLoader();
		console.log(creditNote);
		$state.go('dashboard.sales.creditnotes.all');

	}, function (error) {
		hideLoader();
		console.log(error);
	});

}

$scope.cancel = function() {
	$state.go('dashboard.sales.creditnotes.all');
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
		// remove unrelated credit items
		var newItems = $scope.actualItems.concat(custExpenseItems,newExpenseItems);
		$scope.creditItems = $scope.creditItems.filter(function(creditItem) {
			if(!creditItem.selectedItem || creditItem.selectedItem.create)
				return false;
			return newItems.some(function(item) {
				return item.entity.id == creditItem.selectedItem.entity.id;
			});
		});
	//	console.log($scope.creditItems);
		return $scope.items = newItems;
	});
}

$scope.customerChanged = function() {
	showLoader();
	$q.when(customerChangedHelper())
	.then(function() {
		if($scope.creditItems.length < 1) {
			$scope.addCreditItem();
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

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}

$scope.addCreditItem = function() {
	$scope.creditItems.push({
		selectedItem : undefined,
		selectedTax : undefined,
		rate : 0,
		quantity : 1,
		discount : 0,
		taxValue : 0,
		amount : 0
	});
}

$scope.removeCreditItem = function(index) {
	if ($scope.creditItems.length > 1) {
		$scope.creditItems.splice(index,1);
		reCalculateSubTotal();

	} else {
		console.log("there should be atleast 1 item in a creditNote");
	}
}

$scope.itemChanged = function(index) {
	console.log('item changed');
	var itemInfo = $scope.creditItems[index];
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

$scope.reCalculateTotal = function() {
	var subTotal = Number($scope.subTotal) || 0;
	var totalTax = Number($scope.totalTax) || 0;
	var sum = subTotal + totalTax;

	$scope.total = sum;
	$scope.totalStr = currencyFilter($scope.total, '$', 2);
}

function reCalculateSubTotal() {
	var items = $scope.creditItems;
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
	var itemInfo = $scope.creditItems[index];
	if (! itemInfo.selectedItem) return;

	itemInfo.amount = itemInfo.rate * itemInfo.quantity;
	reCalculateSubTotal();
}



}]);