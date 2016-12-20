'use strict';

invoicesUnlimited.controller('InvoiceController',
	['$q', '$scope', '$state', '$controller', 'userFactory',
		'invoiceService', 'coreFactory', 'taxService', 'expenseService',
		'lateFeeService', 'commentFactory', 'currencyFilter', 'salesCommon',

function($q, $scope, $state, $controller, userFactory,
	invoiceService, coreFactory, taxService, expenseService, lateFeeService, commentFactory, currencyFilter, salesCommon) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}
    
    var cc = userFactory.entity[0].currency.attributes;
    
    
    if(cc.exchangeRate){
        $scope.currentCurrency = cc;
    }
    else{
        var temp = {
            'currencySymbol': '$',
            'exchangeRate'  : 1
        };
        $scope.currentCurrency = temp;

        cc = temp;
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

userFactory.getField('dateFormat')
.then(function(obj) {
	$scope.dateFormat = obj;
    $q.when(userFactory.entity[0].currency.fetch())
    .then(function(obj){
        cc = obj.attributes;
        if(cc.exchangeRate){
            $scope.currentCurrency = cc;
        }
        else{
            var temp = {
                'currencySymbol': '$',
                'exchangeRate'  : 1
            };
            $scope.currentCurrency = temp;

            cc = temp;
        }
        CheckUseCase();
    });
	//CheckUseCase();
});

$.validator.addMethod(
	"notBackDate",
	function(value,element){
		return $scope.todayDate <= $scope.dueDate;
	}
);
  $('#addTaxForm').validate({
		rules: {
			name: 'required',
			rate : {
				required : true,
				number : true
			}
		},
		messages: {
			name : 'Please enter Tax name',
			rate : {
				required : 'tax rate is required',
				number : 'please enter a valid rate(number)'
			}
		}
	});
$('#editInvoiceForm').validate({
	rules: {
		customer : 'required',
		invoiceNumber : 'required',
		invoiceCreateDate : 'required',
		invoiceDueDate : {
			required : true,
			notBackDate : true
		}
	},
	messages: {
		customer : 'Please select a customer',
		invoiceNumber : 'Please enter invoice number',
		invoiceCreateDate : 'Please provide invoice Create date',
		invoiceDueDate : {
			required : 'Please provide invoice Due date',
			notBackDate : 'Due date can not be before Create date'
		}
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
				min : 'rate should be >= 0',
                number: 'Please enter a valid price'
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
	//	console.log(invoice);
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

	var lateFee = invoice.entity.lateFee;
	if(lateFee) {
		var list = $scope.lateFeeList;
		for(var i=0; i < list.length; ++i) {
			if(list[i].entity.id == lateFee.id) {
				$scope.selectedLateFee = list[i];
				break;
			}
		}
	}

	var files = invoice.entity.invoiceFiles;
	if (files) {
		files.forEach(function(file) {
			file.fileName = file.name();
            file.fileName1 = file.fileName.substring(file.fileName.indexOf("_") + 1 , file.fileName.length);
			file.exist = true;
		});
		$scope.files = files;
	} else {
		$scope.files = [];
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
	
	if ($scope.prefs.shipCharges || invoice.entity.shippingCharges) {
		$scope.shippingCharges = invoice.entity.shippingCharges;
		$scope.showShippingCharges = true;
	}

	if ($scope.prefs.adjustments || invoice.entity.adjustments) {
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

	var fields = invoice.entity.customFields;
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

function saveEditedInvoice(params) {
	var invoice = $scope.invoice.entity;
	invoice.set('customer', $scope.selectedCustomer.entity);
	invoice.set('invoiceDate', $scope.todayDate);
	invoice.set('invoiceNumber', $scope.invoiceNo);
	invoice.set('discountType', $scope.prefs.discountType);
	invoice.set('discounts', $scope.discount);
	invoice.set('shippingCharges', $scope.shippingCharges);
	invoice.set('adjustments', $scope.adjustments);
	invoice.set('subTotal', Number($scope.subTotal));
    invoice.set('balanceDue', Number($scope.total) - invoice.get('total') + invoice.get('balanceDue'));
	invoice.set('total', Number($scope.total));
	//invoice.set('balanceDue', Number($scope.total));
    
	invoice.set('poNumber', $scope.poNumber);
	invoice.set('salesPerson', $scope.salesPerson);
	invoice.set('notes', $scope.notes);
	invoice.set('terms', $scope.terms);

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
			invoice.set('customFields', fields);
		} else {
			invoice.unset('customFields');	
		}
	}

	if($scope.selectedLateFee)
		invoice.set('lateFee', $scope.selectedLateFee.entity);
	else	invoice.unset('lateFee');

	if($scope.paymentTerms.selectedTerm.value == 1)
		invoice.set('dueDate', $scope.dueDate);
	else	invoice.unset('dueDate');

	var email = $scope.selectedCustomer.entity.email;
	if(email)
		invoice.set('customerEmails', [email]);
	else invoice.unset('customerEmails');

	return invoiceService.updateInvoice
		($scope.invoice, $scope.invoiceItems, $scope.deletedItems,
			user, $scope.userRole, $scope.files)

	.then(function(obj) {
        //----------------------------
        
        var commentbody = 'Invoice edited';
        var isAuto = true;
        
        addNewComment(commentbody, isAuto);
 
        //----------------------------
		if (params.generateReceipt) {
			var info = obj.get('invoiceInfo');
			if (info) info = info.id;
			return invoiceService.createInvoiceReceipt(obj.id, info);

		} else {
			return obj;
		}
	});
}
    
function addNewComment(commentbody, isAuto){
    var obj = {
		userID : user,
		organization : organization,
		name : user.get('username'),
		date : new Date(),
		isAutomaticallyGenerated : isAuto,
		comment : commentbody
	}
    
    if(!user.get('isTrackUsage') && isAuto) {
        return;
    }

	var data = {};
	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return commentFactory.createNewComment(obj, role);
	})
	.then(function(obj) {
		data.commentObj = obj;
		var invoice = $scope.invoice.entity;
		var prevComments = invoice.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		invoice.set('comments', prevComments);
		return invoice.save();
	});
}

function saveAndSendEditedInvoice () {
	return saveEditedInvoice({generateReceipt:false})
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

function validateForms () {
	setValidationRules();
	var a = $('#editInvoiceForm').valid();
	var b = $('#itemInfoForm').valid();
	var c = $('#extrasForm').valid();
	
	if (a && b && c) return true;
	else {
		var v = undefined;
		if (!a)
			v = $('#editInvoiceForm').validate();
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
	useAllIds();
	saveEditedInvoice({generateReceipt:true})
	.then(function(invoice) {
		hideLoader();
		console.log(invoice);
		//$state.go('dashboard.sales.invoices.all');
        $state.go('dashboard.sales.invoices.details', {invoiceId:invoice.id});
        //dashboard.sales.invoices.edit({invoiceId:invoice.entity.id})

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveAndSend = function () {
	if (! validateForms())	return;

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

 $scope.addNewFile = function(obj) {
	var file = obj.files[0];
    var n = file.name;
    if(n.toLowerCase().indexOf("^") >= 0)
    {
        n =  n.replace("^", "");
    }    
    if(!(n.toLowerCase().endsWith('.pdf') || n.toLowerCase().endsWith('.png') || n.toLowerCase().endsWith('.jpg') || n.toLowerCase().endsWith('.jpeg'))){
        $('#file-error').show();
        return;
    }
    $('#file-error').hide();
    var fileSizeinBytes = obj.files[0].size;
    if(fileSizeinBytes > 5242880 )
    {
        $('#file-size-error').show();    
        return;
    }
    $('#file-size-error').hide();
        
    file.fileName = n; // to avoid naming conflict
    file.fileName1= n;
	$scope.files.push(file);
	$scope.$apply();
}

$scope.removeFile = function(index) {
	$scope.files.splice(index,1);
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
	$scope.discountStr = currencyFilter(discount*cc.exchangeRate, cc.currencySymbol, 2);
	$scope.shippingChargesStr = currencyFilter(shipCharges*cc.exchangeRate, cc.currencySymbol, 2);
	$scope.adjustmentsStr = currencyFilter(adjustments*cc.exchangeRate, cc.currencySymbol, 2);
	$scope.totalStr = currencyFilter($scope.total*cc.exchangeRate, cc.currencySymbol, 2);
}

function reCalculateSubTotal() {
	var items = $scope.invoiceItems;
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
                var index = -1;
                if($scope.itemTaxes.length){
                    index = $scope.itemTaxes.findIndex(function(obj){
                        return obj.name == item.selectedTax.name;
                    });
                }
                if(index == -1){
                    $scope.itemTaxes.push({
                        nameValue :  item.selectedTax.name + ' (' + item.selectedTax.rate + '%)',
                        amount: currencyFilter(item.taxValue, '$', 2),
                        count: 1,
                        name: item.selectedTax.name,
                        amountValue: item.taxValue
                    });
                }
                else{
                    $scope.itemTaxes[index].amountValue += item.taxValue;
                    $scope.itemTaxes[index].count++;
                    $scope.itemTaxes[index].amount = currencyFilter($scope.itemTaxes[index].amountValue, '$', 2);
                    $scope.itemTaxes[index].nameValue = item.selectedTax.name + ' (' + item.selectedTax.rate + '%)';
                }
            }
        /*
		if (item.selectedTax) {
			$scope.itemTaxes.push({
				nameValue :  item.selectedTax.name + ' (' + item.selectedTax.rate + '%)',
				amount: currencyFilter(item.taxValue*cc.exchangeRate, cc.currencySymbol, 2)
			});
		}
        */
	});

	$scope.totalTax = totalTax;
	$scope.subTotal = subTotal;
	$scope.subTotalStr = currencyFilter(subTotal*cc.exchangeRate, cc.currencySymbol, 2);
	$scope.reCalculateTotal();
}

$scope.reCalculateItemAmount = function(index) {
    
    
	var itemInfo = $scope.invoiceItems[index];
	if (! itemInfo.selectedItem) return;

	itemInfo.amount = itemInfo.rate * itemInfo.quantity;
   
	reCalculateSubTotal();
}
//

  $scope.taxChanged = function(index) {
		console.log('tax changed');
		
        if(index == -1){
            if($scope.newItem.tax.dummy){
                $scope.currentItem = index;
                $scope.newItem.tax = null;
                
                $scope.taxName = null;
                $scope.taxRate = null;
                
                $('.new-tax').addClass('show');
                return;
            }
        }
        else{
            var itemInfo = $scope.invoiceItems[index];
            
            if(!itemInfo.selectedTax){
                reCalculateSubTotal();
            }
            else if(itemInfo.selectedTax.dummy){
                $scope.currentItem = index;
                $scope.taxName = null;
                $scope.taxRate = null;
                itemInfo.selectedTax = null;
                $('.new-tax').addClass('show');

                return;
            }
            /*
            if(itemInfo.selectedTax.dummy) {
                $scope.currentItem = index;
                $scope.taxName = null;
                $scope.taxRate = null;
                itemInfo.selectedTax = null;
                $('.new-tax').addClass('show');

                return;
            }
            */
        }
        
        reCalculateSubTotal();
	}
    
//
$scope.itemChanged = function(index) {
	var itemInfo = $scope.invoiceItems[index];
	
	// if create item is pressed
	if(itemInfo.selectedItem.dummy) {
		itemInfo.selectedItem = null;
		$('.new-item').addClass('show');
		// save index to select newly created item
		$scope.itemChangedIndex = index;
		$scope.prepareCreateItem();
		return;
	}

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
	$scope.items.pop(); // remove createItem field
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
		newItems.push(createItemOpener); // add createItem field
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
			$scope.subTotalStr = currencyFilter(0, cc.currencySymbol, 2);
			$scope.reCalculateTotal();

		} else {
			reCalculateSubTotal();
		}

		hideLoader();
	});
}
//----------------
function lateFeeNameHelper(obj) {
	var fee = obj.entity;
	return fee.name + ' ' +
		fee.price + ' (' +
		fee.type + ')';
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
		$scope.items.push(createItemOpener);
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
        $scope.taxes.push(createTaxOpener);
	});
	promises.push(p);

	p = lateFeeService.getAllLateFees({
		organization : organization
	}).then(function(objs) {
		$scope.lateFeeList = objs.map(function(obj) {
			obj.toStr = lateFeeNameHelper(obj);
			return obj;
		});
        $scope.lateFeeList.push(createLateFeeOpener);
	})
	promises.push(p);

	return $q.all(promises);
}

function ListInvoices() {
	showLoader();
	$q.when(invoiceService.listInvoices(user))
	.then(function(res) {
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		res.forEach(function(obj) {
			switch (obj.entity.status) {
			case "Unpaid":
				obj.statusClass = "text-color-normalize";
				break;
			case "Paid":
				obj.statusClass = "text-paid";
				break;
			case "Overdue":
				obj.statusClass = "text-overdue";
				break;
            case "Partial Paid":
				obj.statusClass = "text-partialpaid";
				break;
			default:
				obj.statusClass = "text-color-normalize";
			}

			obj.invoiceDate = formatDate(
				obj.entity.invoiceDate, dateFormat); // "MM/DD/YYYY"
			obj.dueDate = formatDate(
				obj.entity.dueDate, dateFormat);
			obj.balanceDue = currencyFilter(obj.entity.balanceDue*cc.exchangeRate, cc.currencySymbol, 2);
			obj.total = currencyFilter(obj.entity.total*cc.exchangeRate, cc.currencySymbol, 2);
		});

		res = res.reverse();
		$scope.invoiceList = res;
        $scope.allInvoices = res;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}  
    
    $scope.sortByStatus= function()
    {
          $scope.invoiceList.sort(function(a,b){ 
          return a.entity.status.localeCompare(b.entity.status)});
        $('#status').css({
            'display': 'inline-table'
        });
              $('#date').css({
            'display': 'none'
        });
              $('#invoiceno').css({
            'display': 'none'
        });
               $('#orderno').css({
            'display': 'none'
        });
              $('#custname').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
               $('#balance').css({
            'display': 'none'
        });
    }
    
    $scope.sortByInvoiveNumber= function()
    {
          $scope.invoiceList.sort(function(a,b){
          return a.entity.invoiceNumber.localeCompare(b.entity.invoiceNumber)});
         $('#status').css({
            'display': 'none'
        });
              $('#date').css({
            'display': 'none'
        });
              $('#invoiceno').css({
            'display': 'inline-table'
        });
               $('#orderno').css({
            'display': 'none'
        });
              $('#custname').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
               $('#balance').css({
            'display': 'none'
        });
    }
    
    $scope.sortByOrderNumber= function()
    {
          $scope.invoiceList.sort(function(a,b){ 
             
          return a.entity.poNumber.localeCompare(b.entity.poNumber)});
          $('#status').css({
            'display': 'none'
        });
              $('#date').css({
            'display': 'none'
        });
              $('#invoiceno').css({
            'display': 'none'
        });
               $('#orderno').css({
            'display': 'inline-table'
        });
              $('#custname').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
               $('#balance').css({
            'display': 'none'
        });
    }
    
    $scope.sortByAmount= function()
    {
          $scope.invoiceList.sort(function(a,b){
              
          return a.entity.total < (b.entity.total)});
        $('#status').css({
            'display': 'none'
        });
              $('#date').css({
            'display': 'none'
        });
              $('#invoiceno').css({
            'display': 'none'
        });
               $('#orderno').css({
            'display': 'none'
        });
              $('#custname').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'inline-table'
        });
               $('#balance').css({
            'display': 'none'
        });
    }
    $scope.sortByCustomerName= function()
    {
          $scope.invoiceList.sort(function(a,b){ 
             
          return a.customer.displayName.localeCompare(b.customer.displayName)});
         $('#status').css({
            'display': 'none'
        });
              $('#date').css({
            'display': 'none'
        });
              $('#invoiceno').css({
            'display': 'none'
        });
               $('#orderno').css({
            'display': 'none'
        });
              $('#custname').css({
            'display': 'inline-table'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
               $('#balance').css({
            'display': 'none'
        });
    }
     $scope.sortByDate= function()
    {
          $scope.invoiceList.sort(function(a,b){
        return b.invoiceDate.localeCompare(a.invoiceDate)});
          $('#status').css({
            'display': 'none'
        });
              $('#date').css({
            'display': 'inline-table'
        });
              $('#invoiceno').css({
            'display': 'none'
        });
               $('#orderno').css({
            'display': 'none'
        });
              $('#custname').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
               $('#balance').css({
            'display': 'none'
        });
    }
     $scope.sortByDueDate= function()
    {
          $scope.invoiceList.sort(function(a,b){
             
          return b.dueDate.localeCompare(a.dueDate)});
          $('#status').css({
            'display': 'none'
        });
              $('#date').css({
            'display': 'none'
        });
              $('#invoiceno').css({
            'display': 'none'
        });
               $('#orderno').css({
            'display': 'none'
        });
              $('#custname').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'inline-table'
        });
              $('#amount').css({
            'display': 'none'
        });
               $('#balance').css({
            'display': 'none'
        });
    }
     $scope.sortByBalance= function()
    {
          $scope.invoiceList.sort(function(a,b){ 
             
          return a.entity.balanceDue < (b.entity.balanceDue)});
          $('#status').css({
            'display': 'none'
        });
              $('#date').css({
            'display': 'none'
        });
              $('#invoiceno').css({
            'display': 'none'
        });
               $('#orderno').css({
            'display': 'none'
        });
              $('#custname').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
               $('#balance').css({
            'display': 'inline-table'
        });
    }
    
    $scope.lateFeeChanged = function(){
        if(!$scope.selectedLateFee)
            return;
        
        if(!$scope.selectedLateFee.dummy)
            return;
        
        $scope.selectedLateFee = "";
        prepareAddFeeForm();
        $('.add-latefee').addClass('show');
    }
    
    function prepareAddFeeForm() {
        $scope.latefeeName = '';
        $scope.latefeeTypes = ['%', '$'];
        $scope.selectedFeeType = $scope.latefeeTypes[0];
        $scope.latefeeAmount = '';

        $('#addLateFeeForm').validate({
            rules: {
                name : 'required',
                type : 'required',
                amount : {
                    required : true,
                    number : true,
                    min : 0.01
                }
            }
        });
        $('#addLateFeeForm').validate().resetForm();
    }
        
    $scope.addLateFee = function() {
        if (! $('#addLateFeeForm').valid()) return;

        showLoader();
        var params = {
            userID : user,
            organization : organization,
            name : $scope.latefeeName,
            type : $scope.selectedFeeType,
            price: Number($scope.latefeeAmount)
        };

        $q.when(coreFactory.getUserRole(user))
        .then(function(role) {
            return lateFeeService.createLateFee(params, role);
        })
        .then(function(obj) {
            obj.toStr = lateFeeNameHelper(obj);
            $scope.lateFeeList.pop();
            $scope.lateFeeList.push(obj);
            $scope.lateFeeList.push(createLateFeeOpener);
            $scope.selectedLateFee = obj;
            $('.add-latefee').removeClass('show');
            hideLoader();
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
$scope.saveNewTax = function() {
        if(! $('#addTaxForm').valid()) return;
		salesCommon.createNewTax({
			_scope : $scope,
			user : user
		}, function(){
            reCalculateSubTotal();
            $scope.$apply();
            
            
        });
	}
$scope.showMenu = function(){
    if($('.filtermenu').hasClass('show'))
        $('.filtermenu').removeClass('show');
    else
        $('.filtermenu').addClass('show');
}

$scope.currentInvoice = "All Invoices";

$scope.showAllInvoices = function(){
    $scope.invoiceList = $scope.allInvoices.filter(function(obj){
        return true;
    });
    $scope.currentInvoice = "All Expenses"
    $('.filtermenu').removeClass('show');
    
}
$scope.sentInvoices = function(){
    $scope.invoiceList = $scope.allInvoices.filter(function(obj){
        return obj.entity.status == 'Sent';
    });
    
     $scope.currentInvoice = "Sent Invoices"
    
    $('.filtermenu').removeClass('show');
    
}
$scope.overdueInvoices = function(){
    $scope.invoiceList = $scope.allInvoices.filter(function(obj){
        return obj.entity.status == 'Overdue';
    });
    
   
    $scope.currentInvoice = "Overdue Invoices"
    
    $('.filtermenu').removeClass('show');
    
}
$scope.unpaidInvoices = function(){
    $scope.invoiceList = $scope.allInvoices.filter(function(obj){
        return obj.entity.status == 'Unpaid';
    });
    
   
      $scope.currentInvoice = "Unpaid Invoices"
    
    $('.filtermenu').removeClass('show');
    
}
$scope.paidInvoices = function(){
     $scope.invoiceList = $scope.allInvoices.filter(function(obj){
        return obj.entity.status == 'Paid';
    });
    $scope.currentInvoice = "Paid Invoices"
    
    $('.filtermenu').removeClass('show');
    
}
$scope.partialPaidInvoices = function(){
     $scope.invoiceList = $scope.allInvoices.filter(function(obj){
        return obj.entity.status == 'Partial Paid';
    });
    
   
     $scope.currentInvoice = "Partial Paid Invoices"
    $('.filtermenu').removeClass('show');
}
$scope.refundedInvoices = function(){
    $scope.invoiceList = $scope.allInvoices.filter(function(obj){
        return obj.entity.status == 'Refunded';
    });
    
    $scope.currentInvoice = "Refunded Invoices"
    $('.filtermenu').removeClass('show');
    
}

}]);
