'use strict';

invoicesUnlimited.controller('CreateInvoiceController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'invoiceService', 'coreFactory', 'commentFactory', 'taxService', 'expenseService',
	'lateFeeService', 'currencyFilter', 'itemService', 'salesCommon',
	function($scope, $state, $controller, $q, userFactory,
		invoiceService,coreFactory,commentFactory,taxService,expenseService,
		lateFeeService,currencyFilter, itemService, salesCommon) {

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
        
    //$scope.currentCurrency = cc;
        
	var user = userFactory.entity[0];
	var organization = user.get("organizations")[0];
	$controller('DashboardController',{$scope:$scope,$state:$state});

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
        prepareToCreateInvoice();
    });
	//prepareToCreateInvoice();

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

	$('#addInvoiceForm').validate({
        onkeyup: true,
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
				min : 0,
                max : 100
			},
			shipCharges : {
				number : true,
				min : 0
			},
			adjustment : {
				number : true
			}
		},
        messages : {
            discount : {
				number : "Must be a number",
				min : "Discount can not be less than 0",
                max : "Discount should be less than 100%"
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

	function lateFeeNameHelper(obj) {
		var fee = obj.entity;
		return fee.name + ' ' +
			fee.price + ' (' +
			fee.type + ')';
	}
        
        $scope.projectId = $state.params.projectId;

	function prepareToCreateInvoice() {
		showLoader();
		var promises = [];
		var p = null;

		p = $q.when(coreFactory.getAllCustomers())
		.then(function(res) {
			res = res.filter(function(cust) {
				return cust.entity.status == 'active';
			});
			$scope.customers = res.sort(function(a,b){
				return alphabeticalSort(a.entity.displayName,b.entity.displayName)
			});
			$scope.customers.push(createCustomerOpener);
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

		p = userFactory.getField('dateFormat')
		.then(function(obj) {
			$scope.dateFormat = obj;
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
			$scope.invoiceNo = $scope.prefs.invoiceNumber;
			$scope.disableInvNo = true;
		} else {
			$scope.invoiceNo = "";
			$scope.disableInvNo = false;
		}
		$scope.notes = $scope.prefs.notes;
		$scope.terms = $scope.prefs.terms;

		$scope.paymentTerms = {
			terms : [
				{name: "Off", value : 0},
				{name: "Due on Receipt", value : 1},
                {name: "Net 7", value : 7},
				{name: "Net 10", value : 10},
                {name: "Net 30", value : 30},
				{name: "Net 60", value : 60},
                {name: "Net 90", value : 90}
			],
			selectedTerm : {name: "Due on Receipt", value : 1}
		};

		$scope.files = [];
		$scope.hasDueDate = true;
		$scope.todayDate = new Date();
		$scope.calculateDueDate();
		$scope.subTotalStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);

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
				$scope.discountStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);
				break;
		}

		if ($scope.prefs.shipCharges) {
			$scope.showShippingCharges = true;
			$scope.shippingChargesStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);
		}

		if ($scope.prefs.adjustments) {
			$scope.showAdjustments = true;
			$scope.adjustmentsStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);
		}

		if ($scope.prefs.salesPerson)
			$scope.showSalesPerson = true;

		// put first item placeholder
		$scope.invoiceItems = [{
			selectedItem : undefined,
			selectedTax : undefined,
			rate : 0,
			quantity : 1,
			discount : 0,
			amount : 0
		}];

		var customerId = $state.params.customerId;
		var expenseId = $state.params.expenseId;
        var projectId = $state.params.projectId;
        
		if(customerId) {
			$scope.selectedCustomer = $scope.customers.filter(function(cust) {
				return cust.entity.id == customerId;
			})[0];

            customerChanged();
            
			// there will be no expenseId,
			// if we came back from Create New Customer
			if(expenseId) {
				$q.when(customerChangedHelper())
				.then(function() {
				//	console.log($scope.items);
					$scope.addInvoiceItem();
					$scope.invoiceItems[0].selectedItem = $scope.items.filter(function(item) {
						return item.entity.expanseId == expenseId;
					})[0];
					$scope.invoiceItems[0].selectedItem.create = true; // create new item everytime
					$scope.itemChanged(0);
				});
			}

		}
        
        if(projectId){
            $scope.selectedCustomer = $scope.customers.filter(function(cust) {
				return cust.entity.id == projectId.project.entity.customer.id;
			})[0];

            customerChanged();
            $scope.invoiceItems = [{
                selectedItem : undefined,
                selectedTax : undefined,
                rate : 0,
                quantity : 1,
                discount : 0,
                amount : 0
            }];

            $q.when(customerChangedHelper())
                .then(function() {
                    var t = {
                        create : true,
                        entity : {
                            rate : projectId.project.entity.projectBillingAmount,
                            title : projectId.project.entity.projectName
                        }
                    }
                    
                    $scope.items.pop();
                    $scope.items.push(t);
                    $scope.items.push(createItemOpener);
                    
                    $scope.addInvoiceItem();
                    $scope.invoiceItems[0] = {
                        selectedItem : t,
                        selectedTax : undefined,
                        rate : projectId.project.entity.projectBillingAmount,
                        quantity : 1,
                        discount : 0,
                        amount : 0
                    };
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

	function saveInvoice() {
		var invoice = {
			userID : user,
			organization : organization,
			customer : $scope.selectedCustomer.entity,
			invoiceDate : $scope.todayDate,
			invoiceNumber : $scope.invoiceNo,
			status : "Draft",
			discountType : $scope.prefs.discountType,
			discounts : $scope.discount,
			shippingCharges : $scope.shippingCharges,
			adjustments : $scope.adjustments,
			subTotal : Number($scope.subTotal),
			total : Number($scope.total),
			balanceDue : Number($scope.total),
			poNumber : $scope.poNumber,
			salesPerson : $scope.salesPerson,
			notes : $scope.notes,
			terms : $scope.terms

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
				invoice.customFields = fields;
			}
		}
		if($scope.selectedLateFee) {
			invoice.lateFee = $scope.selectedLateFee.entity;
		}
		if ($scope.paymentTerms.selectedTerm.value > 0)
			invoice.dueDate = $scope.dueDate;

		var email = $scope.selectedCustomer.entity.email;
		if(email) invoice.customerEmails = [email];
        
        if($scope.projectId){
            $scope.projectId.project.timesheets.forEach(function(obj){
                obj.set('isBilled', 1);
                var task = obj.get('task');
                task.set('billedHours', task.get('taskHours'));
                obj.set('task', task);
            });

            Parse.Object.saveAll($scope.projectId.project.timesheets);
        }
        
		return invoiceService.createNewInvoice(invoice, $scope.invoiceItems, $scope.userRole, $scope.files);
	}

	function saveAndSendInvoice() {
		return saveInvoice()
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

	function showInvoiceNumberError () {
		var validator = $( "#addInvoiceForm" ).validate();
		validator.showErrors({
			"invoiceNumber": "Invoice with this number already exists"
		});
	}

	function validateForms () {
		setValidationRules();
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
	}

	$scope.save = function() {
		if (! validateForms())	return;

		showLoader();
		$q.when(invoiceService.checkInvoiceNumAvailable({
			invoiceNumber : $scope.invoiceNo,
			organization : organization
		}))
		.then(function(avilable) {
			if (avilable) {
				return saveInvoice();

			} else {
				showInvoiceNumberError();
				scrollToOffset();
				return Promise.reject('Invoice with this number already exists');
			}
		})
		.then(function(invoice) {
            addNewComment('Invoice created for ' + currencyFilter(invoice.attributes.balanceDue, '$', 2) +' amount', true, invoice);
			hideLoader();
			$state.go('dashboard.sales.invoices.all');

		}, function (error) {
			hideLoader();
			console.log(error);
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
    
    function addNewComment(commentbody, isAuto, invoice){
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
		//var invoice = $scope.invoice.entity;
		var prevComments = invoice.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		invoice.set('comments', prevComments);
		return invoice.save();
	})
	.then(function() {
		var comment = new commentFactory(data.commentObj);

		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];

		console.log(comment);
	});
}


	$scope.saveAndSend = function () {
		if (! validateForms())	return;

		showLoader();
		$q.when(invoiceService.checkInvoiceNumAvailable({
			invoiceNumber : $scope.invoiceNo,
			organization : organization
		}))
		.then(function(avilable) {
			if (avilable) {
				return saveAndSendInvoice()

			} else {
				showInvoiceNumberError();
				scrollToOffset();
				return Promise.reject('Invoice with this number already exists');
			}
		})
		.then(function(invoice) {
            addNewComment('Invoice created for ' + currencyFilter(invoice.attributes.balanceDue, '$', 2) +' amount', true, invoice);
            if($scope.selectedCustomer.entity.email)
                addNewComment('Invoice emailed to ' + $scope.selectedCustomer.entity.email, true, invoice);
			hideLoader();
			$state.go('dashboard.sales.invoices.all');

		}, function (error) {
			hideLoader();
			console.log(error);
		});
	}

	$scope.cancel = function() {
		$state.go('dashboard.sales.invoices.all');
	}

	$scope.addNewFile = function(obj) {
		var file = obj.files[0];
        var n = file.name;
        if(n.toLowerCase().indexOf("^") >= 0)
        {
            n =  n.replace("^", "");
        }
        if(!(n.toLowerCase().endsWith('.pdf') || n.toLowerCase().endsWith('.png') ||          n.toLowerCase().endsWith('.jpg') || n.toLowerCase().endsWith('.jpeg')))
        {
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
		$scope.files.push(file);
		$scope.$apply();
	}

	$scope.removeFile = function(index) {
		$scope.files.splice(index,1);
	}

	$scope.calculateDueDate = function() {		
		var d = new Date($scope.todayDate);
		d.setHours(d.getHours() + 12);
        
        if($scope.paymentTerms.selectedTerm.value != 1){
            d = d.addDays($scope.paymentTerms.selectedTerm.value);
        }
        
		$scope.dueDate = d; //$.format.date(d, "MM/dd/yyyy");
	}

	$scope.paymentTermsChanged = function() {
        if($scope.paymentTerms.selectedTerm.value == 0)
            $scope.hasDueDate = false;
        else
            $scope.hasDueDate = true;
        
		//$scope.hasDueDate =
			//$scope.paymentTerms.selectedTerm.value == 1 ? true : false;

		if($scope.hasDueDate)
			$scope.calculateDueDate();
	}

	$scope.openDatePicker = function(n) {
        if(n == 2){
            if($scope.paymentTerms.selectedTerm.value > 1)
                return;
        }
		switch (n) {
			case 1: $scope.openPicker1 = true; break;
			case 2: $scope.openPicker2 = true; break;
		}
  	}

	$scope.addInvoiceItem = function() {
		$scope.invoiceItems.push({
			selectedItem : undefined,
			selectedTax : undefined,
			rate : 0,
			quantity : 1,
			discount : 0,
			taxValue : 0,
			amount : 0
		});
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

    $scope.reCalculateSubTotal = reCalculateSubTotal;
    
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

	$scope.removeInvoiceItem = function(index) {
		if ($scope.invoiceItems.length > 1) {
			$scope.invoiceItems.splice(index,1);
			reCalculateSubTotal();

		} else {
		/*	var item = $scope.invoiceItems[0];
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
		*/	console.log("there should be atleast 1 item in an invoice");
		}
	}

	$scope.itemChanged = function(index) {
		console.log('item changed');
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
     
	function customerChangedHelper() {
		$scope.items.pop(); // remove createItem field
        
        var terms = $scope.selectedCustomer.entity.get('paymentTerms');
        if(terms){
            $scope.paymentTerms.terms.forEach(function(obj){
               if(obj.name == terms)
                   $scope.paymentTerms.selectedTerm = obj;
            });
        }
        else{
            $scope.paymentTerms.selectedTerm =  {name: "Due on Receipt", value : 1}
        }
        
        $scope.hasDueDate = true;
        $scope.calculateDueDate();
        
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

        function customerChanged() {
		if($scope.selectedCustomer.dummy) {
			$state.go('dashboard.customers.new', {backLink : $state.current.name});
			return;
		}

		showLoader();
		$q.when(customerChangedHelper())
		.then(function() {
			if($scope.invoiceItems.length < 1) {
				$scope.addInvoiceItem();
				$scope.totalTax = 0;
				$scope.subTotal = 0;
				$scope.subTotalStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);
				$scope.reCalculateTotal();

			} else {
				reCalculateSubTotal();
			}

			hideLoader();
		});
	}
        
	$scope.customerChanged = customerChanged;

	$scope.printSelected = function() {
		/*
		var customerName = 'Olga Olga';
		var amount = currencyFilter(2.3, '$', 2);
		var businessName = 'SFS-ds';
		var link = 'http://files.parsetfss.com/e054a587-eac7-4ca9-8f92-86c471415177/tfss-a1cb4ab3-63af-4395-8773-cb03239f3b2b-test2.html';
		
		var emailSubject = 'Invoice From ' + businessName;
		var emailBody = customerName + ',<br/>'
			+ businessName + ' has sent you an invoice of ' + amount
			+ '. <a href="' + link + '">Click here to view.</a>';

		Parse.Cloud.run("sendMailgunHtml", {
			toEmail: "adnan@binaryport.com",
			fromEmail: "no-reply@invoicesunlimited.com",
			subject : emailSubject,
			html : emailBody
		}).then(function(msg) {
			console.log(msg);
		}, function(msg) {
			console.log(msg);
		});
*/
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
    
    function commaSeparateNumber(val){
  
  val = val.split(',').join('');
  if(val.indexOf('.') !== -1)
 {
   
   while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
   var temp = val.length - val.indexOf('.');
   //alert(temp);
   if(temp == 3)
     {
       $(".add_item_price").attr('maxlength',val.length);
     }
  }
  else
    {
      $(".add_item_price").attr('maxlength',50);
      while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    }
     return val;
  }
    
$('.add_item_price').keyup(function(){
  
  $(this).val(commaSeparateNumber($(this).val()));
});
    

}]);
