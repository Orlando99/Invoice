'use strict';

invoicesUnlimited.controller('CreditNoteController',['$q', '$scope', '$state', '$controller',
	'userFactory', 'creditNoteService', 'coreFactory', 'taxService', 'expenseService', 'currencyFilter',

function($q, $scope, $state, $controller, userFactory, creditNoteService,
	coreFactory, taxService, expenseService, currencyFilter){

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

var isGoTo = {
	details : function(to){
		return to.endsWith('creditnotes.details');	
	},
	creditnotes : function(to){ 
		return to.endsWith('creditnotes.all');
	},
	edit : function(to){
		return to.endsWith('creditnotes.edit');
	},
	newCreditnotes : function(to){
		return to.endsWith('creditnotes.new');	
	}
};

CheckUseCase();

$('#editCreditNoteForm').validate({
	rules: {
		customer : 'required',
		creditNumber : 'required',
		creditCreateDate : 'required'
	},
	messages: {
		customer : 'Please select a customer',
		creditNumber : 'Please enter credit note number',
		creditCreateDate : 'Please provide credit note create date'
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

}

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.creditnotes(stateName)) {
		console.log('its in list')
		listCreditNotes();

	} else if (isGoTo.newCreditnotes(stateName)) {
		console.log('its in new');

	} else if (isGoTo.edit(stateName)) {
		console.log('its in edit');
		prepareToEditCreditNote();
	}
}

function prepareToEditCreditNote() {
	var creditNoteId = $state.params.creditNoteId;
	if (! creditNoteId) return;

	showLoader();
	$q.when(LoadRequiredData())
	.then(function(msg) {
		return $q.when(creditNoteService.getCreditNote(creditNoteId));
	})
	.then(function (creditNote) {
		console.log(creditNote);

		$scope.creditNote = creditNote;
		$scope.creditItems = [];
		$scope.deletedItems = [];
		$scope.itemsWithOutId = 0;
		$scope.itemsWithIdinDel = 0;
		
		$scope.selectedCustomer = $scope.customers.filter(function(cust) {
			return creditNote.entity.get('customer').id == cust.entity.id;
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
	var creditNote = $scope.creditNote;
	$scope.creditNo = creditNote.entity.creditNumber;
	$scope.refNumber = creditNote.entity.reference;
	$scope.disableCreditNo =
		($scope.prefs.numAutoGen == 1) ? true : false;

	$scope.todayDate = creditNote.entity.creditNoteDate;
	$scope.notes = creditNote.entity.notes;
	$scope.terms = creditNote.entity.terms;

	if(creditNote.entity.status == 'Sent') {
		$scope.previouslySent = true;
	}

	for (var i = 0; i < creditNote.creditItems.length; ++i) {
		var creditItem = creditNote.creditItems[i].entity;
		var actualItem = creditItem.get('item');
		var obj = {};

		obj.selectedItem = $scope.items.filter(function(item) {
			if (item.entity.id === actualItem.id) {
				obj.id = creditItem.id;
				obj.rate = (creditItem.amount / creditItem.quantity); //Number(item.entity.rate);
				obj.quantity = creditItem.quantity;
				obj.discount = 0;
				obj.taxValue = 0;
				obj.amount = creditItem.amount;

				var creditItemTax = creditItem.get('tax');
				if (creditItemTax) {
					obj.selectedTax = $scope.taxes.filter(function(tax) {
						return tax.id == creditItemTax.id;
					})[0];
				} else {
					obj.selectedTax = undefined;
				}

				return true;
			}
			return false;
		})[0];

		$scope.creditItems.push(obj);
	}

	reCalculateSubTotal();
	hideLoader();
}

function saveEditedCreditNote() {
	var creditNote = $scope.creditNote.entity;
	creditNote.set('customer', $scope.selectedCustomer.entity);
	creditNote.set('creditNoteDate', $scope.todayDate);
	creditNote.set('creditNumber', $scope.creditNo);
	creditNote.set('subTotal', Number($scope.subTotal));
	creditNote.set('total', Number($scope.total));
	creditNote.set('remainingCredits', Number($scope.total));
	creditNote.set('reference', $scope.refNumber);
	creditNote.set('notes', $scope.notes);
	creditNote.set('terms', $scope.terms);

	var email = $scope.selectedCustomer.entity.email;
	if(email)
		creditNote.set('customerEmails', [email]);
	else creditNote.unset('customerEmails');

	return creditNoteService.updateCreditNote
		($scope.creditNote, $scope.creditItems, $scope.deletedItems,
			user, $scope.userRole);
}

function saveAndSendEditedCreditNote () {
	return saveEditedCreditNote()
	.then(function(creditNote) {
		return creditNoteService.createCreditNoteReceipt(creditNote.id)
		.then(function(creditObj) {
			return creditNoteService.sendCreditNoteReceipt(creditObj);
		});
	});
}

$scope.save = function() {
	setValidationRules();
	var a = $('#editCreditNoteForm').valid();
	var b = $('#itemInfoForm').valid();
	if(! (a && b)) return;

	showLoader();
	useAllIds();
	saveEditedCreditNote()
	.then(function(creditNote) {
		hideLoader();
		console.log(creditNote);
		$state.go('dashboard.sales.creditnotes.all');

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveAndSend = function () {
	setValidationRules();
	var a = $('#editCreditNoteForm').valid();
	var b = $('#itemInfoForm').valid();
	if(! (a && b)) return;

	showLoader();
	useAllIds();
	saveAndSendEditedCreditNote()
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

$scope.addCreditItem = function() {
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

	$scope.creditItems.push(item);

//	console.log($scope.creditItems);
//	console.log($scope.deletedItems);
//	console.log($scope.itemsWithOutId + ' ' + $scope.itemsWithIdinDel);
}

$scope.removeCreditItem = function(index) {
	if ($scope.creditItems.length > 1) {
		var delItem = $scope.creditItems.splice(index,1)[0];
		if (delItem.id) {
			++$scope.itemsWithIdinDel;
			$scope.deletedItems.push(delItem);
		} else {
			--$scope.itemsWithOutId;
		}
		reCalculateSubTotal();
	} else {
		console.log("there should be atleast 1 item in a creditNote");
	}
}

function useAllIds() {
	var unUsedIds = $scope.itemsWithIdinDel;
	var idsNeeded = $scope.itemsWithOutId;
	if(unUsedIds <= 0 || idsNeeded <= 0) return;

	var i = 0;
	var creditItems = $scope.creditItems;
	$scope.deletedItems.forEach(function(item) {
		if(! item.id) return;
		for (; i < creditItems.length; ++i) {
			if(! creditItems[i].id) {
				creditItems[i].id = item.id;
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

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
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

$scope.itemChanged = function(index) {
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

	return $q.all(promises);
}

function listCreditNotes() {
	showLoader();
	$q.when(creditNoteService.listCreditNotes(user))
	.then(function(res) {
		res.forEach(function(obj) {
			switch (obj.entity.status) {
			case "Open":
				obj.statusClass = "text-positive";
				break;
			case "Closed":
				obj.statusClass = "text-danger";
				break;
			default:
				obj.statusClass = "text-color-normalize";
			}

			obj.creditNoteDate = formatDate(
				obj.entity.creditNoteDate, "MM/DD/YYYY");
			obj.total = currencyFilter(obj.entity.total, '$', 2);
			obj.remainingCredits = currencyFilter(obj.entity.remainingCredits, '$', 2);
		});

		$scope.creditNoteList = res;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}

}]);
