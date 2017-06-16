'use strict';

invoicesUnlimited.controller('CreateEstimateController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'estimateService', 'coreFactory', 'taxService', 'commentFactory', 'expenseService',
	'currencyFilter', 'salesCommon',
function($scope, $state, $controller, $q, userFactory,
	estimateService,coreFactory,taxService,commentFactory,expenseService,currencyFilter,salesCommon) {

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

$scope.dateOptions = {
	showWeeks : false
};
	
function prepareToCreateEstimate() {
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
        
        $scope.customers.forEach(function(obj){
                if(obj.entity.salutation)
                    obj.fullName = obj.entity.salutation + " " + obj.entity.displayName;
                else
                    obj.fullName = obj.entity.displayName;
            });
        if(user.get('role') != 'Sales')
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
		if(user.get('role') != 'Sales')
        	$scope.items.push(createItemOpener);
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
		if(user.get('role') != 'Sales')
        	$scope.taxes.push(createTaxOpener);
	});
	promises.push(p);

	p = userFactory.getField('dateFormat')
	.then(function(obj) {
		$scope.dateFormat = obj;
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

    $scope.files = [];
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

        customerChanged();
        
		// there will be no expenseId,
		// if we came back from Create New Customer
		if(expenseId) {
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

$scope.addNewFile = function(obj) {
		var file = obj.files[0];
        var n = file.name;
        
        if(n.toLowerCase().indexOf("^") >= 0)
        {
            n =  n.replace("^", "");
        }
        if(!(n.toLowerCase().endsWith('.pdf') || n.toLowerCase().endsWith('.png') ||  n.toLowerCase().endsWith('.jpg') || n.toLowerCase().endsWith('.jpeg'))){
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

$scope.reCalculateSubTotal = reCalculateSubTotal;

function reCalculateSubTotal() {
	var items = $scope.estimateItems;
	var subTotal = 0;
	var totalTax = 0;
	$scope.itemTaxes = [];

	// no need to check discountType,
	// itemInfo.discount is zero, so, expression will evaluate to 1.
	items.forEach(function(item) {
		subTotal += item.amount * ((100 - item.discount) * 0.01);
		var dis = Number($scope.discount) || 0;
			if($scope.prefs.discountType == 2) //before tax
				item.taxValue = calculateTax(item.amount * ((100 - dis) * 0.01), item.selectedTax);
			else
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
				amount: currencyFilter(item.taxValue, '$', 2)
			});
		}
        */
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

$scope.prepareCreateItem = function() {
		salesCommon.prepareCreateItem({
			_scope : $scope
		});
	}

$scope.createNewItem = function() {
		salesCommon.createNewEstimateItem({
			_scope : $scope,
			user : user,
			organization : organization
		});
	}

$scope.itemChanged = function(index) {
//	console.log('item changed');
	var itemInfo = $scope.estimateItems[index];
    
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
        $scope.actualItems.pop();
		var newItems = $scope.actualItems.concat(custExpenseItems,newExpenseItems);
		$scope.estimateItems = $scope.estimateItems.filter(function(estItem) {
			if(!estItem.selectedItem || estItem.selectedItem.create)
				return false;
			return newItems.some(function(item) {
				return item.entity.id == estItem.selectedItem.entity.id;
			});
		});
	//	console.log($scope.estimateItems);
		if(user.get('role') != 'Sales')
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
    
$scope.customerChanged = customerChanged;

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
		(estimate, $scope.estimateItems, $scope.userRole, $scope.files)
    .then(function(estimate){
        addNewComment('Estimate created for ' + currencyFilter(estimate.attributes.totalAmount, '$', 2) +' amount', true, estimate);
        return estimate;
    });
}
/*
function saveAndSendEstimate() {
    //return saveEstimate();
    
	return saveEstimate()
	.then(function(estimate) {
		return estimateService.createEstimateReceipt(estimate.id)
		.then(function(estimateObj) {
			return estimateService.sendEstimateReceipt(estimateObj);
		});
	});
    
}
    */
    
function saveAndSendEstimate() {
    //return saveEstimate();
    
	return saveEstimate()
	.then(function(estimate) {
		return estimateService.createEstimateReceipt(estimate.id)
		.then(function(estimateObj) {
			var st = estimateObj.get('status');
                if(st == "Draft"){
                    estimateObj.set("status", "Sent");
                    estimateObj.save();
                }
            sendToContacts(estimateObj);
			return estimateObj;
		});
	});
    
}
    
function sendToContacts(estimateObj){
    $scope.contacts.forEach(function(obj){
        if(obj.selected){
            estimateService.sendEstimateReceiptToEmail(estimateObj, obj.contact)
            .then(function(result){
                addNewComment('Estimate emailed to ' + obj.contact, true, estimateObj)
            });
        }
    });
    $scope.mobileContacts.forEach(function(obj){
        if(obj.selected){
            estimateService.sendEstimetTextToNumber(estimateObj, obj.contact)
            .then(function(result){
                addNewComment('Estimate texted to ' + obj.contact, true, estimateObj)
            });
        }
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
    
function addNewComment(body, isAuto, estimate) {
	
	var obj = {
		userID : user,
		organization : organization,
		name : user.get('username'),
		date : new Date(),
		isAutomaticallyGenerated : false,
		comment : body
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
		//var estimate = $scope.estimate.entity;
		var prevComments = estimate.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		estimate.set('comments', prevComments);
		estimate.save();
        //hideLoader();
	});

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

$scope.saveAndSend = function(){
    if (! validateForms())	return;

    $('#emailText-error').hide();

    var persons = $scope.selectedCustomer.entity.get('contactPersons');

    $scope.contacts = [];
    $scope.mobileContacts = [];

    if(persons.length){
        persons.forEach(function(obj){
            var first = obj.get('firstname') ? obj.get('firstname') : '';
            var last = obj.get('lastname') ? obj.get('lastname') : '';
            var primary = obj.get('defaultPerson') == 1 ? true : false;

            var name = first + ' ' + last;
            if(obj.get('email')){
                $scope.contacts.push({
                    selected : primary,
                    contact : obj.get('email'),
                    contactName : '('+ name + ') ' + obj.get('email')
                });
            }

            if(obj.get('phone')){
                $scope.mobileContacts.push({
                    selected : false,
                    contact : obj.get('phone'),
                    contactName : '('+ name + ') ' + obj.get('phone')
                });
            }

            if(obj.get('mobile')){
                $scope.mobileContacts.push({
                    selected : primary,
                    contact : obj.get('mobile'),
                    contactName : '('+ name + ') ' + obj.get('mobile')
                });
            }
        });
    }

    if($scope.contacts.length || $scope.mobileContacts.length){
        $('.email-text').addClass('show');
    } else {
        //saveAndSend1();
		ShowMessage("The customer does not have a email or phone number in their profile. Please select save.","error");
    }
}
    
$scope.sendReceipt = function(){
        debugger;
        
        var email = 0;
        var mobile = 0;
        
        $scope.contacts.forEach(function(obj){
            if(obj.selected)
                email++;
        });
        
        $scope.mobileContacts.forEach(function(obj){
            if(obj.selected)
                mobile++;
        });
        
        if(email > 0 || mobile > 0){
            saveAndSend1();
        }
        else {
            $('#emailText-error').show();
        }
    }
    
function saveAndSend1 () {
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
        /*
        if($scope.selectedCustomer.entity.email)
                addNewComment('Estimate emailed to ' + $scope.selectedCustomer.entity.email, true, estimate);
                */
		hideLoader();
		$state.go('dashboard.sales.estimates.all');

	}, function (error) {
		hideLoader();
        $state.go('dashboard.sales.estimates.all');
		console.log(error);
	});

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
            var itemInfo = $scope.estimateItems[index];
            
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
        }
        
        reCalculateSubTotal();
	}

$scope.saveNewTax = function() {
		salesCommon.createNewEstimateTax({
			_scope : $scope,
			user : user
		}, function(){
            reCalculateSubTotal();
            $scope.$apply();
            
            
        });
	}

function showEstimateNumberError () {
	var validator = $( "#addEstimateForm" ).validate();
	validator.showErrors({
		"estimateNumber": "Estimate with this number already exists"
	});
}

}]);