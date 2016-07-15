'use strict';

invoicesUnlimited.controller('InvoiceController',
	['$q', '$scope', '$state', '$controller', 'userFactory',
		'invoiceService', 'coreFactory', 'taxService', 'expenseService',
		'currencyFilter',

function($q, $scope, $state, $controller, userFactory,
	invoiceService, coreFactory, taxService, expenseService, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

var isGoTo = {
	details : function(to){
		return to.endsWith('invoices.details');	
	},
	invoices : function(to){ 
		return to.endsWith('invoices.all');
	},
	edit : function(to){
		return to.endsWith('invoices.edit');
	},
	newInvoice : function(to){
		return to.endsWith('invoices.new');	
	}
};

CheckUseCase();

$('#editInvoiceForm').validate({
	rules: {
		customer : 'required',
		invoiceNumber : 'required',
		invoiceCreateDate : 'required',
		invoiceDueDate : 'required'
	},
	messages: {
		customer : 'Please select a customer',
		invoiceNumber : 'Please enter invoice number',
		invoiceCreateDate : 'Please provide invoice create date',
		invoiceDueDate : 'Please provide invoice due date'
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

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.invoices(stateName)) {
	//	console.log('its in list')
		ListInvoices();

	} else if (isGoTo.newInvoice(stateName)) {
	//	console.log('its in new');
		//doSelectCustomerIfValidId(customerId);

	} else if (isGoTo.edit(stateName)) {
	//	console.log('its in edit');
		prepareToEditInvoice();
	}
}

function prepareToEditInvoice() {
	var invoiceId = $state.params.invoiceId;
	if (! invoiceId) return;

	showLoader();
	$q.when(LoadRequiredData())
	.then(function(msg) {
		return $q.when(invoiceService.getInvoice(invoiceId));
	})
	.then(function (invoice) {
		console.log(invoice);

		$scope.invoice = invoice;
		$scope.invoiceItems = [];
		$scope.deletedItems = [];
		$scope.itemsWithOutId = 0;
		$scope.itemsWithIdinDel = 0;
		
		$scope.selectedCustomer = $scope.customers.filter(function(cust) {
			return invoice.entity.get('customer').id === cust.entity.id;
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
	var invoice = $scope.invoice;
	$scope.invoiceNo = invoice.entity.invoiceNumber;
	$scope.poNumber = invoice.entity.poNumber || "";
	$scope.disableInvNo =
		($scope.prefs.numAutoGen == 1) ? true : false;

	$scope.todayDate = invoice.entity.invoiceDate;
	$scope.dueDate = invoice.entity.dueDate;

	$scope.paymentTerms = {
		terms : [
			{name: "Due on Receipt", value : 1},
			{name: "Off", 			 value : 0}
		],
	};

	$scope.hasDueDate = (invoice.entity.dueDate) ? true : false;
	if ($scope.hasDueDate) {
		$scope.paymentTerms.selectedTerm = $scope.paymentTerms.terms[0];
	} else {
		$scope.paymentTerms.selectedTerm = $scope.paymentTerms.terms[1];
	}

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

	$scope.discount = invoice.entity.discounts;
	$scope.notes = invoice.entity.notes;
	$scope.terms = invoice.entity.terms;
	
	if ($scope.prefs.shipCharges) {
		$scope.shippingCharges = invoice.entity.shippingCharges;
		$scope.showShippingCharges = true;
	}

	if ($scope.prefs.adjustments) {
		$scope.adjustments = invoice.entity.adjustments;
		$scope.showAdjustments = true;
	}

	if ($scope.prefs.salesPerson) {
		$scope.salesPerson = invoice.entity.salesPerson || "";
		$scope.showSalesPerson = true;
	}

	if(invoice.entity.status == 'Sent') {
		$scope.previouslySent = true;
	}

	for (var i = 0; i < invoice.invoiceItems.length; ++i) {
		var invItem = invoice.invoiceItems[i].entity;
		var actualItem = invItem.get('item');
		var obj = {};

		obj.selectedItem = $scope.items.filter(function(item) {
			if (item.entity.id === actualItem.id) {
				obj.id = invItem.id;
				obj.rate = (invItem.amount / invItem.quantity); //Number(item.entity.rate);
				obj.quantity = invItem.quantity;
				obj.discount = invItem.discount || 0;
				obj.taxValue = 0;
				obj.amount = invItem.amount;

				var invItemTax = invItem.get('tax');
				if (invItemTax) {
					obj.selectedTax = $scope.taxes.filter(function(tax) {
						return tax.id === invItemTax.id;
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

	reCalculateSubTotal();
	hideLoader();
}

$scope.addInvoiceItem = function() {
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

	$scope.invoiceItems.push(item);

//	console.log($scope.invoiceItems);
//	console.log($scope.deletedItems);
//	console.log($scope.itemsWithOutId + ' ' + $scope.itemsWithIdinDel);
}

$scope.removeInvoiceItem = function(index) {
	if ($scope.invoiceItems.length > 1) {
		var delItem = $scope.invoiceItems.splice(index,1)[0];
		if (delItem.id) {
			++$scope.itemsWithIdinDel;
			$scope.deletedItems.push(delItem);
		} else {
			--$scope.itemsWithOutId;
		}
		reCalculateSubTotal();
	} else {
		console.log("there should be atleast 1 item in an invoice");
	}
}

function useAllIds() {
	console.log('came');
	var unUsedIds = $scope.itemsWithIdinDel;
	var idsNeeded = $scope.itemsWithOutId;
	if(unUsedIds <= 0 || idsNeeded <= 0) return;

	var i = 0;
	var invItems = $scope.invoiceItems;
	$scope.deletedItems.forEach(function(item) {
		if(! item.id) return;
		for (; i < invItems.length; ++i) {
			if(! invItems[i].id) {
				invItems[i].id = item.id;
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

function saveEditedInvoice() {
	var invoice = $scope.invoice.entity;
	invoice.set('customer', $scope.selectedCustomer.entity);
	invoice.set('invoiceDate', $scope.todayDate);
	invoice.set('invoiceNumber', $scope.invoiceNo);
	invoice.set('discountType', $scope.prefs.discountType);
	invoice.set('discounts', $scope.discount);
	invoice.set('shippingCharges', $scope.shippingCharges);
	invoice.set('adjustments', $scope.adjustments);
	invoice.set('subTotal', Number($scope.subTotal));
	invoice.set('total', Number($scope.total));
	invoice.set('balanceDue', Number($scope.total));
	invoice.set('poNumber', $scope.poNumber);
	invoice.set('salesPerson', $scope.salesPerson);
	invoice.set('notes', $scope.notes);
	invoice.set('terms', $scope.terms);

	if($scope.paymentTerms.selectedTerm.value == 1)
		invoice.set('dueDate', $scope.dueDate);
	else	invoice.unset('dueDate');

	var email = $scope.selectedCustomer.entity.email;
	if(email)
		invoice.set('customerEmails', [email]);
	else invoice.unset('customerEmails');

	return invoiceService.updateInvoice
		($scope.invoice, $scope.invoiceItems, $scope.deletedItems,
			user, $scope.userRole, $scope.filepicker);
}

function saveAndSendEditedInvoice () {
	return saveEditedInvoice()
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
	setValidationRules();
	var a = $('#editInvoiceForm').valid();
	var b = $('#extrasForm').valid();
	var c = $('#itemInfoForm').valid();
	if(! (a && b && c)) return;

	showLoader();
	useAllIds();
	saveEditedInvoice()
	.then(function(invoice) {
		hideLoader();
		console.log(invoice);
		$state.go('dashboard.sales.invoices.all');

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveAndSend = function () {
	setValidationRules();
	var a = $('#editInvoiceForm').valid();
	var b = $('#extrasForm').valid();
	var c = $('#itemInfoForm').valid();
	if(! (a && b && c)) return;

	showLoader();
	useAllIds();
	saveAndSendEditedInvoice()
	.then(function(invoice) {
		hideLoader();
		console.log(invoice);
		$state.go('dashboard.sales.invoices.all');

	}, function (error) {
		hideLoader();
		console.log(error);
	});
}

//----- common --------
$scope.cancel = function() {
	$state.go('dashboard.sales.invoices.all');
}

$scope.calculateDueDate = function() {	
	var d = new Date($scope.todayDate);
	d.setHours(d.getHours() + 12);
	$scope.dueDate = d; //$.format.date(d, "MM/dd/yyyy");
}

$scope.paymentTermsChanged = function() {
	$scope.hasDueDate =
		$scope.paymentTerms.selectedTerm.value == 1 ? true : false;

	if($scope.hasDueDate)
		$scope.calculateDueDate();
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
		case 2: $scope.openPicker2 = true; break;
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
	var items = $scope.invoiceItems;
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
	var itemInfo = $scope.invoiceItems[index];
	if (! itemInfo.selectedItem) return;

	itemInfo.amount = itemInfo.rate * itemInfo.quantity;
	reCalculateSubTotal();
}

$scope.itemChanged = function(index) {
	var itemInfo = $scope.invoiceItems[index];
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
		// remove unrelated invoice items
		var newItems = $scope.actualItems.concat(custExpenseItems,newExpenseItems);
		$scope.invoiceItems = $scope.invoiceItems.filter(function(invItem) {
			if(!invItem.selectedItem || invItem.selectedItem.create)
				return false;
			return newItems.some(function(item) {
				return item.entity.id == invItem.selectedItem.entity.id;
			});
		});
	//	console.log($scope.invoiceItems);
		return $scope.items = newItems;
	});
}

$scope.customerChanged = function() {
	showLoader();
	$q.when(customerChangedHelper())
	.then(function() {
		if($scope.invoiceItems.length < 1) {
			$scope.addInvoiceItem();
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

	p = $q.when(invoiceService.getPreferences(user))
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

function ListInvoices() {
	showLoader();
	$q.when(invoiceService.listInvoices(user))
	.then(function(res) {
		res.forEach(function(obj) {
			switch (obj.entity.status) {
			case "Unpaid":
				obj.statusClass = "text-color-normalize";
				break;
			case "Paid":
				obj.statusClass = "text-positive";
				break;
			case "Overdue":
				obj.statusClass = "text-danger";
				break;
			default:
				obj.statusClass = "text-color-normalize";
			}

			obj.invoiceDate = formatDate(
				obj.entity.invoiceDate, "MM/DD/YYYY");
			obj.dueDate = formatDate(
				obj.entity.dueDate, "MM/DD/YYYY");
			obj.balanceDue = currencyFilter(obj.entity.balanceDue, '$', 2);
			obj.total = currencyFilter(obj.entity.total, '$', 2);
		});

		res = res.reverse();
		$scope.invoiceList = res;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}

}]);
