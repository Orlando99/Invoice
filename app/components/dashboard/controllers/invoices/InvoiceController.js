'use strict';

invoicesUnlimited.controller('InvoiceController',
	['$q', '$scope', '$state', '$controller', 'userFullFactory',
		'invoiceService', 'coreFactory', 'taxFactory',

function($q, $scope, $state, $controller, userFullFactory,
	invoiceService, coreFactory, taxFactory) {

var user = userFullFactory.authorized();
$controller('DashboardController',{$scope:$scope,$state:$state});
//	loadColorTheme(user);

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

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.invoices(stateName)) {
		console.log('its in list')
		ListInvoices();

	} else if (isGoTo.newInvoice(stateName)) {
		console.log('its in new');
		//doSelectCustomerIfValidId(customerId);

	} else if (isGoTo.edit(stateName)) {
		console.log('its in edit');
		EditInvoice();
	}
}

function EditInvoice() {
	var invoiceId = $state.params.invoiceId;
	if (! invoiceId) return;

	showLoader();
	$q.when(LoadRequiredData()).then(function(msg) {
		$q.when(invoiceService.getInvoice(invoiceId))
		.then(function (invoice) {
			$scope.invoice = invoice;
			console.log(invoice);
			prepareEditForm();
			hideLoader();
		});

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
	$scope.selectedCustomer = $scope.customers.filter(function(cust) {
		return invoice.entity.get('customer').id === cust.entity.id;
	})[0];

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

	$scope.subTotal = invoice.entity.subTotal;
	$scope.total = invoice.entity.total;
	$scope.discount = invoice.entity.discounts || '0.00';
//	$scope.discountValue; // calculate
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

	$scope.invoiceItems = [];
	$scope.deletedItems = [];
	$scope.itemsWithOutId = 0;
	$scope.itemsWithIdinDel = 0;
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
				obj.amount = invItem.amount; // calculate again acrding 2 prefs

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

function saveEditedInvoice() {
	var invoice = $scope.invoice.entity;
	invoice.set('customer', $scope.selectedCustomer.entity);
	invoice.set('invoiceDate', $scope.todayDate);
	if($scope.paymentTerms.selectedTerm.value == 1)
		invoice.set('dueDate', $scope.dueDate);
	else	invoice.unset('dueDate');
	invoice.set('invoiceNumber', $scope.invoiceNo);
	invoice.set('adjustments', Number($scope.adjustments));
	invoice.set('discountType', $scope.prefs.discountType);
	invoice.set('discounts', Number($scope.discount));
	invoice.set('shippingCharges', Number($scope.shippingCharges));
	invoice.set('subTotal', Number($scope.subTotal));
	invoice.set('total', Number($scope.total));
	invoice.set('poNumber', $scope.poNumber);
	invoice.set('salesPerson', $scope.salesPerson);
	invoice.set('notes', $scope.notes);
	invoice.set('terms', $scope.terms);

	return invoiceService.updateInvoice
		($scope.invoice, $scope.invoiceItems, $scope.deletedItems,
			user, $scope.userRole, $scope.filepicker)
	.then(function(invObj) {
		return invObj;

	}, function(error) {
		console.log(error.message);
	});
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

//----- common --------
$scope.save = function() {
	useAllIds();
	saveEditedInvoice();
}

$scope.saveAndSend = function () {
//	saveAndSendInvoice();
	useAllIds();
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

function reCalculateSubTotal() {
	var items = $scope.invoiceItems;
	var subTotal = 0;
	items.forEach(function(item) {
		subTotal += Number(item.amount);
	});
	$scope.subTotal = formatNumber(subTotal);
	$scope.reCalculateTotal();
}

$scope.reCalculateTotal = function() {
	$scope.discountValue =
		formatNumber((Number($scope.subTotal) * Number($scope.discount) * 0.01));
	$scope.total =
		formatNumber(Number($scope.subTotal) - Number($scope.discountValue) +
		Number($scope.shippingCharges) + Number($scope.adjustments));
}

$scope.reCalculateItemAmount = function(index) {
	var itemInfo = $scope.invoiceItems[index];
	if (! itemInfo.selectedItem) return;

	var withOutDiscount = itemInfo.rate * itemInfo.quantity;
	itemInfo.amount =
	formatNumber(withOutDiscount * ((100 - itemInfo.discount) * 0.01));
	reCalculateSubTotal();
}

$scope.itemChanged = function(index) {
	var itemInfo = $scope.invoiceItems[index];
	itemInfo.rate = Number(itemInfo.selectedItem.entity.get("rate"));
	var tax = itemInfo.selectedItem.entity.get("tax");
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
//----------------

function LoadRequiredData() {
	var promises = [];
	var p = null;
	var organization = user.get('organizations')[0];

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
		$scope.items = items;
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

	p = taxFactory.getTaxes(user, function(taxes) {
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
			obj.balanceDue = formatNumber(obj.entity.balanceDue);
			obj.total = formatNumber(obj.entity.total);
		});

		$scope.invoiceList = res;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}

}]);
