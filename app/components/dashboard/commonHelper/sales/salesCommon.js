'use strict';

invoicesUnlimited.factory('salesCommon', ['$q', '$state', 'userFactory', 'coreFactory', 'invoiceService',
	'taxService', 'lateFeeService', 'expenseService', 'itemService', 'currencyFilter',
function($q, $state, userFactory, coreFactory, invoiceService, taxService, lateFeeService,
	expenseService, itemService, currencyFilter){

return {
	prepareCreateItem : function(params) {
		var _scope = params._scope;
		_scope.newItem = {
			name : '',
			rate : '',
			desc : '',
			tax : undefined
		}
		$('#addItemForm').validate({
			rules: {
				name : 'required',
				rate : {
					required : true,
					number : true
				}
			},
			messages: {
				name : 'Please enter Item name',
				rate : {
					required : 'Item rate is required',
					number : 'Please enter valid rate(number)'
				}
			}
		});
		$('#addItemForm').validate().resetForm();
	},
	createNewItem : function(params) {
		var _scope = params._scope;
		if(! $('#addItemForm').valid()) return;

		showLoader();
		var params1 = {
			user : params.user,
			organization : params.organization,
			items : [{
				title : _scope.newItem.name,
				rate : _scope.newItem.rate,
				tax : _scope.newItem.tax,
				desc : _scope.newItem.desc
			}]
		};

		$q.when(coreFactory.getUserRole(params.user))
		.then(function(role) {
			var acl = new Parse.ACL();
			acl.setRoleWriteAccess(role.get("name"), true);
			acl.setRoleReadAccess(role.get("name"), true);

			params1.acl = acl;

			return itemService.createItems(params1);
		})
		.then(function(items) {
			_scope.items.pop(); // remove createItem field
			_scope.actualItems.push(items[0]);
			if(_scope.items !== _scope.actualItems)
				_scope.items.push(items[0]);

			_scope.items.push(createItemOpener); // add createItem field
			var itemInfo = _scope.invoiceItems[_scope.itemChangedIndex];
			var index = _scope.items.findIndex(function(item) {
				return item.entity.id == items[0].entity.id;
			});
			itemInfo.selectedItem = _scope.items[index];
			_scope.itemChanged(_scope.itemChangedIndex);
			$(".new-item").removeClass("show");
			hideLoader();

		});
	},
    createNewTax : function(params) {
		var _scope = params._scope;
		if(! $('#addTaxForm').valid()) return;

		showLoader();
        
        var params1 = {
			title: _scope.taxName,
			value: Number(_scope.taxRate),
			compound: (_scope.isCompound ? 1 : 0),
			user: params.user
		};
        
        taxService.saveNewTax(params, function(obj){
			_scope.taxes.pop(); // remove createItem field
            _scope.taxes.push(obj);
            /*
			_scope.actualtaxes.push(obj);
			if(_scope.taxes !== _scope.actualtaxes)
				_scope.taxes.push(obj);
            */
			_scope.taxes.push(createTaxOpener); // add createItem field
			var taxInfo = _scope.invoiceItems[_scope.itemChangedIndex];
			var index = _scope.items.findIndex(function(item) {
				return item.entity.id == items[0].entity.id;
			});
			itemInfo.selectedItem = _scope.items[index];
			_scope.itemChanged(_scope.itemChangedIndex);
			$(".new-tax").removeClass("show");
			hideLoader();
		});
	},
	loadRequiredData : function(params) {
		var promises = [];
		var p = null;
		var _scope = params._scope;

		p = $q.when(coreFactory.getAllCustomers())
		.then(function(res) {
			_scope.customers = res.sort(function(a,b){
				return alphabeticalSort(a.entity.displayName,b.entity.displayName)
			});
		});
		promises.push(p);

		p = $q.when(coreFactory.getAllItems({
			organization : params.organization
		})).then(function(items) {
			_scope.actualItems = items.filter(function(item) {
				return !item.entity.expanseId;
			});
			_scope.expenseItems = items.filter(function(item) {
				return item.entity.expanseId;
			});
			_scope.items = _scope.actualItems;
			_scope.items.push(createItemOpener);
		});
		promises.push(p);

		p = $q.when(invoiceService.getPreferences(params.user))
		.then(function(prefs) {
			_scope.prefs = prefs;
		});
		promises.push(p);

		p = $q.when(coreFactory.getUserRole(params.user))
		.then(function(role) {
			_scope.userRole = role;
		});
		promises.push(p);

		p = taxService.getTaxes(params.user, function(taxes) {
			_scope.taxes = taxes;
		});
		promises.push(p);

		p = lateFeeService.getAllLateFees({
			organization : params.organization
		}).then(function(objs) {
			_scope.lateFeeList = objs.map(function(obj) {
				obj.toStr = lateFeeNameHelper(obj);
				return obj;
			});
		})
		promises.push(p);

		p = userFactory.getField('dateFormat')
		.then(function(obj) {
			_scope.dateFormat = obj;
		});
		promises.push(p);

		return $q.all(promises).then(function() {
			return Promise.resolve('');
		});
	},
	customerChangedHelper : function(params) {
		var _scope = params._scope;
		_scope.items.pop(); // remove createItem field
		return $q.when(expenseService.getCustomerExpenses({
			organization : params.organization,
			customer : _scope.selectedCustomer.entity
		}))
		.then(function(custExpenses) {
		//	console.log(custExpenses);
			// filter current customer's expenses from all expenses
			var custExpenseItems = [];
			for (var i = 0; i < custExpenses.length; ++i) {
				for (var j = 0; j < _scope.expenseItems.length; ++j) {
					if (custExpenses[i].entity.id == _scope.expenseItems[j].entity.expanseId) {
						custExpenseItems.push(_scope.expenseItems[j]);
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
			var newItems = _scope.actualItems.concat(custExpenseItems,newExpenseItems);
			_scope.invoiceItems = _scope.invoiceItems.filter(function(invItem) {
				if(!invItem.selectedItem || invItem.selectedItem.create)
					return false;
				return newItems.some(function(item) {
					return item.entity.id == invItem.selectedItem.entity.id;
				});
			});
		//	console.log($scope.invoiceItems);
			newItems.push(createItemOpener); // add createItem field
			_scope.items = newItems;
			return Promise.resolve('');
		});
	},
	fillInvoiceForm : function(params) {
		var _scope = params;
		var invoice = _scope.invoice;

		_scope.invoiceNo = invoice.entity.invoiceNumber;
		_scope.poNumber = invoice.entity.poNumber || "";
		_scope.disableInvNo =
			(_scope.prefs.numAutoGen == 1) ? true : false;

		_scope.todayDate = invoice.entity.invoiceDate;
		_scope.dueDate = invoice.entity.dueDate;

		_scope.paymentTerms = {
			terms : [
				{name: "Due on Receipt", value : 1},
				{name: "Off", 			 value : 0}
			],
		};

		_scope.hasDueDate = (invoice.entity.dueDate) ? true : false;
		if (_scope.hasDueDate) {
			_scope.paymentTerms.selectedTerm = _scope.paymentTerms.terms[0];
		} else {
			_scope.paymentTerms.selectedTerm = _scope.paymentTerms.terms[1];
		}

		var lateFee = invoice.entity.lateFee;
		if(lateFee) {
			var list = _scope.lateFeeList;
			for(var i=0; i < list.length; ++i) {
				if(list[i].entity.id == lateFee.id) {
					_scope.selectedLateFee = list[i];
					break;
				}
			}
		}

		var files = invoice.entity.invoiceFiles;
		if (files) {
			files.forEach(function(file) {
				file.fileName = file.name();
				file.exist = true;
			});
			_scope.files = files;
		} else {
			_scope.files = [];
		}

		switch(_scope.prefs.discountType) {
			case 0:
				_scope.itemLevelTax = false;
				_scope.invoiceLevelTax = false;
				break;

			case 1:
				_scope.itemLevelTax = true;
				_scope.invoiceLevelTax = false;
				break;

			case 2:
			case 3:
				_scope.itemLevelTax = false;
				_scope.invoiceLevelTax = true;
				break;
		}

		_scope.discount = invoice.entity.discounts;
		_scope.notes = invoice.entity.notes;
		_scope.terms = invoice.entity.terms;
		
		if (_scope.prefs.shipCharges) {
			_scope.shippingCharges = invoice.entity.shippingCharges;
			_scope.showShippingCharges = true;
		}

		if (_scope.prefs.adjustments) {
			_scope.adjustments = invoice.entity.adjustments;
			_scope.showAdjustments = true;
		}

		if (_scope.prefs.salesPerson) {
			_scope.salesPerson = invoice.entity.salesPerson || "";
			_scope.showSalesPerson = true;
		}

		if(invoice.entity.status == 'Sent') {
			_scope.previouslySent = true;
		}

		_scope.invoiceItems = [];
		for (var i = 0; i < invoice.invoiceItems.length; ++i) {
			var invItem = invoice.invoiceItems[i].entity;
			var actualItem = invItem.get('item');
			var obj = {};

			obj.selectedItem = _scope.items.filter(function(item) {
				if (item.entity.id === actualItem.id) {
					obj.id = invItem.id;
					obj.rate = (invItem.amount / invItem.quantity); //Number(item.entity.rate);
					obj.quantity = invItem.quantity;
					obj.discount = invItem.discount || 0;
					obj.taxValue = 0;
					obj.amount = invItem.amount;

					var invItemTax = invItem.get('tax');
					if (invItemTax) {
						obj.selectedTax = _scope.taxes.filter(function(tax) {
							return tax.id === invItemTax.id;
						})[0];
					} else {
						obj.selectedTax = undefined;
					}

					return true;
				}
				return false;
			})[0];

			_scope.invoiceItems.push(obj);
		}

		var customFields = [];
		if(_scope.prefs.customFields) {
			_scope.prefs.customFields.forEach(function(field) {
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
		_scope.customFields = customFields;
		return Promise.resolve('');
	},
	save : function(params) {
		if (! this.validateForms())	return;

		showLoader();
		var _scope = params._scope;
		$q.when(invoiceService.checkInvoiceNumAvailable({
			invoiceNumber : _scope.invoiceNo,
			organization : params.organization
		}))
		.then(function(avilable) {
			if (avilable) {
				return saveInvoice(params);

			} else {
				this.showInvoiceNumberError();
				scrollToOffset();
				return Promise.reject('Invoice with this number already exists');
			}
		})
		.then(function(invoice) {
			hideLoader();
			$state.go('dashboard.sales.invoices.all');

		}, function (error) {
			hideLoader();
			console.log(error);
		});
	},
	saveAndSend : function (params) {
		if (! this.validateForms())	return;

		showLoader();
		var _scope = params._scope;
		$q.when(invoiceService.checkInvoiceNumAvailable({
			invoiceNumber : _scope.invoiceNo,
			organization : params.organization
		}))
		.then(function(avilable) {
			if (avilable) {
				return saveAndSendInvoice(params);

			} else {
				this.showInvoiceNumberError();
				scrollToOffset();
				return Promise.reject('Invoice with this number already exists');
			}
		})
		.then(function(invoice) {
			hideLoader();
			$state.go('dashboard.sales.invoices.all');

		}, function (error) {
			hideLoader();
			console.log(error);
		});
	},
	addValidationExceptItems : function(_scope) {
		$.validator.addMethod(
			"notBackDate",
			function(value,element){
				return _scope.todayDate <= _scope.dueDate;
			}
		);

		$('#addInvoiceForm').validate({
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
	},
	addItemValidation : function() {
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
	},
	showInvoiceNumberError : function() {
		var validator = $( "#addInvoiceForm" ).validate();
		validator.showErrors({
			"invoiceNumber": "Invoice with this number already exists"
		});
	},
	validateForms : function() {
		addItemValidation();
		var a = $('#addInvoiceForm').valid();
		var b = $('#itemInfoForm').valid();
		var c = $('#extrasForm').valid();
		
		if (a && b && c) return true;
		else {
			var v = undefined;
			if (!a)
				v = $('#addInvoiceForm').validate();
			else if (!b)
				v = $('#itemInfoForm').validate();
			else if (!c)
				v = $('#extrasForm').validate();

			var offset = $(v.errorList[0].element).offset().top - 30;
			scrollToOffset(offset);
			return false;
		}
	},
	calculateDueDate : function(_scope) {
		var d = new Date(_scope.todayDate);
		d.setHours(d.getHours() + 12);
		_scope.dueDate = d; //$.format.date(d, "MM/dd/yyyy");
	},
	paymentTermsChanged : function(_scope) {
		_scope.hasDueDate =
			_scope.paymentTerms.selectedTerm.value == 1 ? true : false;

		if(_scope.hasDueDate)
			_scope.calculateDueDate();
	},
	addInvoiceItem : function(_scope) {
		_scope.invoiceItems.push({
			selectedItem : undefined,
			selectedTax : undefined,
			rate : 0,
			quantity : 1,
			discount : 0,
			taxValue : 0,
			amount : 0
		});
	},
	reCalculateTotal : function(_scope) {
		var subTotal = Number(_scope.subTotal) || 0;
		var discount = Number(_scope.discount) || 0;
		var shipCharges = Number(_scope.shippingCharges) || 0;
		var adjustments = Number(_scope.adjustments) || 0;
		var totalTax = Number(_scope.totalTax) || 0;
		var sum = subTotal + totalTax;
		var discountRatio = (100 - discount) * 0.01;

		if(_scope.prefs.discountType == 2) // before tax
			sum = (subTotal * discountRatio) + totalTax;
		else if (_scope.prefs.discountType == 3) // after tax
			sum = (subTotal + totalTax) * discountRatio;

		discount = Math.abs(sum - subTotal - totalTax);
		_scope.total = sum + shipCharges + adjustments;
		_scope.discountStr = currencyFilter(discount, '$', 2);
		_scope.shippingChargesStr = currencyFilter(shipCharges, '$', 2);
		_scope.adjustmentsStr = currencyFilter(adjustments, '$', 2);
		_scope.totalStr = currencyFilter(_scope.total, '$', 2);
	},
	reCalculateSubTotal : function(_scope) {
		reCalculateSubTotal(_scope);
	},
	reCalculateItemAmount : function(params) {
		var itemInfo = params._scope.invoiceItems[params.index];
		if (! itemInfo.selectedItem) return;

		itemInfo.amount = itemInfo.rate * itemInfo.quantity;
		reCalculateSubTotal(params._scope);
	},
	removeInvoiceItem : function(params) {
		if (params._scope.invoiceItems.length > 1) {
			params._scope.invoiceItems.splice(params.index,1);
			reCalculateSubTotal(params._scope);

		} else {
			console.log("there should be atleast 1 item");
		}
	},
	itemChanged : function(params) {
		var _scope = params._scope;
		var itemInfo = _scope.invoiceItems[params.index];
		
		// if create item is pressed
		if(itemInfo.selectedItem.dummy) {
			itemInfo.selectedItem = null;
			$('.new-item').addClass('show');
			// save index to select newly created item
			_scope.itemChangedIndex = params.index;
			_scope.prepareCreateItem();
			return;
		}

		itemInfo.rate = Number(itemInfo.selectedItem.entity.rate);
		var tax = itemInfo.selectedItem.tax;
		if (!tax) {
		//	console.log("no tax applied");
			itemInfo.selectedTax = "";
		} else {
			var taxes = _scope.taxes;
			for (var i = 0; i < taxes.length; ++i) {
				if (tax.id == taxes[i].id) {
					itemInfo.selectedTax = taxes[i];
					break;
				}
			}
		}
		_scope.reCalculateItemAmount(params.index);
	},
	customerChanged : function(params) {
		showLoader();
		$q.when(this.customerChangedHelper(params))
		.then(function() {
			var _scope = params._scope;
			if(_scope.invoiceItems.length < 1) {
				_scope.addInvoiceItem();
				_scope.totalTax = 0;
				_scope.subTotal = 0;
				_scope.subTotalStr = currencyFilter(0, '$', 2);
				_scope.reCalculateTotal();

			} else {
				reCalculateSubTotal(_scope);
			}

			hideLoader();
		});
	}

};

function saveInvoice(params) {
	var _scope = params._scope;
	var invoice = {
		userID : params.user,
		organization : params.organization,
		customer : _scope.selectedCustomer.entity,
		invoiceDate : _scope.todayDate,
		invoiceNumber : _scope.invoiceNo,
		status : "Unpaid",
		discountType : _scope.prefs.discountType,
		discounts : _scope.discount,
		shippingCharges : _scope.shippingCharges,
		adjustments : _scope.adjustments,
		subTotal : Number(_scope.subTotal),
		total : Number(_scope.total),
		balanceDue : Number(_scope.total),
		poNumber : _scope.poNumber,
		salesPerson : _scope.salesPerson,
		notes : _scope.notes,
		terms : _scope.terms

	};
	if(_scope.customFields.length) {
		var fields = [];
		_scope.customFields.forEach(function(field) {
			if (field.value) {
				var obj = {};
				obj[field.name] = field.value;
				fields.push(obj);
			}
		});
		if (fields.length) {
			invoice.customFields = fields;
		}
	}
	if(_scope.selectedLateFee) {
		invoice.lateFee = _scope.selectedLateFee.entity;
	}
	if (_scope.paymentTerms.selectedTerm.value == 1)
		invoice.dueDate = _scope.dueDate;

	var email = _scope.selectedCustomer.entity.email;
	if(email) invoice.customerEmails = [email];

	return invoiceService.createNewInvoice
		(invoice, _scope.invoiceItems, _scope.userRole, _scope.files);
}

function saveAndSendInvoice(params) {
	return saveInvoice(params)
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

function addItemValidation() {
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

function lateFeeNameHelper(obj) {
	var fee = obj.entity;
	return fee.name + ' ' +
		fee.price + ' (' +
		fee.type + ')';
}

function reCalculateSubTotal(_scope) {
	var items = _scope.invoiceItems;
	var subTotal = 0;
	var totalTax = 0;
	_scope.itemTaxes = [];

	// no need to check discountType,
	// itemInfo.discount is zero, so, expression will evaluate to 1.
	items.forEach(function(item) {
		subTotal += item.amount * ((100 - item.discount) * 0.01);
		item.taxValue = calculateTax(item.amount, item.selectedTax);
		totalTax += item.taxValue;
		if (item.selectedTax) {
			_scope.itemTaxes.push({
				nameValue :  item.selectedTax.name + ' (' + item.selectedTax.rate + '%)',
				amount: currencyFilter(item.taxValue, '$', 2)
			});
		}
	});

	_scope.totalTax = totalTax;
	_scope.subTotal = subTotal;
	_scope.subTotalStr = currencyFilter(subTotal, '$', 2);
	_scope.reCalculateTotal();
}

}]);