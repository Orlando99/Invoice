'use strict';

invoicesUnlimited.controller('EstimateController',['$q', '$scope', '$state', '$controller',
	'userFactory', 'estimateService', 'coreFactory', 'taxService', 'expenseService', 'commentFactory', 'currencyFilter',

function($q, $scope, $state, $controller, userFactory, estimateService,
	coreFactory, taxService, expenseService, commentFactory, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
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

userFactory.getField('dateFormat')
.then(function(obj) {
	$scope.dateFormat = obj;
	CheckUseCase();
});

$('#editEstimateForm').validate({
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

$scope.dateOptions = {
	showWeeks : false
};
	
function prepareToEditEstimate() {
	var estimateId = $state.params.estimateId;
	if (! estimateId) return;
    var custId = $state.params.customerId;
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
		
        if(custId){
            $scope.selectedCustomer = $scope.customers.filter(function(cust) {
                return custId === cust.entity.id;
            })[0];
        }
        else{
            $scope.selectedCustomer = $scope.customers.filter(function(cust) {
                return estimate.entity.get('customer').id === cust.entity.id;
            })[0];
        }
        
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
    
    var files = estimate.entity.estimateFiles;
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
	$scope.files.push(file);
	$scope.$apply();
}

$scope.removeFile = function(index) {
	$scope.files.splice(index,1);
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

function saveEditedEstimate(params) {
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
			estimate.set('customFields', fields);
		} else {
			estimate.unset('customFields');	
		}
	}

	var email = $scope.selectedCustomer.entity.email;
	if(email)
		estimate.set('customerEmails', [email]);
	else estimate.unset('customerEmails');

	return estimateService.updateEstimate
		($scope.estimate, $scope.estimateItems, $scope.deletedItems,
			user, $scope.userRole, $scope.files)

	.then(function(obj) {
        addNewComment('Estimate edited', true);
		if (params.generateReceipt) {
			return estimateService.createEstimateReceipt(obj.id);

		} else {
			return obj;
		}
	});
}
    
function addNewComment(body, isAuto) {
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
		var estimate = $scope.estimate.entity;
		var prevComments = estimate.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		estimate.set('comments', prevComments);
		return estimate.save();
	});

}

function saveAndSendEditedEstimate () {
	return saveEditedEstimate({generateReceipt:false})
		.then(function(estimate) {
		return estimateService.createEstimateReceipt(estimate.id)
		.then(function(estimateObj) {
			return estimateService.sendEstimateReceipt(estimateObj);
		});
	});
}

function validateForms () {
	setValidationRules();
	var a = $('#editEstimateForm').valid();
	var b = $('#itemInfoForm').valid();
	var c = $('#extrasForm').valid();
	
	if (a && b && c) return true;
	else {
		var v = undefined;
		if (!a)
			v = $('#editEstimateForm').validate();
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
	saveEditedEstimate({generateReceipt:true})
	.then(function(estimate) {
		hideLoader();
		console.log(estimate);
        $state.go('dashboard.sales.estimates.details', {estimateId:estimate.id});
		///$state.go('dashboard.sales.estimates.all');

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveAndSend = function () {
	if (! validateForms())	return;

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
    
    function customerChanged() {
    if($scope.selectedCustomer.dummy) 
    {
        $state.go('dashboard.customers.new', {'backLink' : $state.current.name, 'estimateId' : $state.params.estimateId});
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
//----------------

function LoadRequiredData() {
	var promises = [];
	var p = null;

	p = $q.when(coreFactory.getAllCustomers())
	.then(function(res) {
		$scope.customers = res.sort(function(a,b){
			return alphabeticalSort(a.entity.displayName,b.entity.displayName)
		});
        
        $scope.customers.forEach(function(obj){
                if(obj.entity.salutation)
                    obj.fullName = obj.entity.salutation + " " + obj.entity.displayName;
                else
                    obj.fullName = obj.entity.displayName;
            });
        
	    //$scope.selectedCustomer = $scope.customers[0];
		if(user.get('role') != 'Sales')
        	$scope.customers.push(createCustomerOpener);
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

function listEstimates() {
	showLoader();
	$q.when(estimateService.listEstimates(user))
	.then(function(res) {
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
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

            if(obj.entity.get('estimateFiles'))
                obj.attachments = 1;
            
			obj.estimateDate = formatDate(
				obj.entity.estimateDate, dateFormat);
			obj.totalAmount = currencyFilter(obj.entity.totalAmount, '$', 2);
		});

	//	res = res.reverse();
		$scope.estimateList = res;
        $scope.allestimateList = res;
         $scope.displayInvoice = res;
        $scope.sortByDate();
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}
$scope.sortByEstimateNumber= function()
{
      $scope.estimateList.sort(function(a,b){
      return a.entity.estimateNumber.localeCompare(b.entity.estimateNumber)});
    
    if($("#estimate").css('display') === "none"){
           $scope.estimateList.sort(function(a,b){
      return a.entity.estimateNumber.localeCompare(b.entity.estimateNumber)});
            $('#estimate').css({
                'display': 'inline-table'
            });
            $('#estimateUp').css({
                'display': 'none'
            });
        }
        else{
            $scope.estimateList.sort(function(a,b){
      return b.entity.estimateNumber.localeCompare(a.entity.estimateNumber)});
            $('#estimateUp').css({
                'display': 'inline-table'
            });
            $('#estimate').css({
                'display': 'none'
            });
        }
    
    $('#date').css({
            'display': 'none'
        });
              $('#refno').css({
            'display': 'none'
        });
               $('#cusname').css({
            'display': 'none'
        });
              $('#status').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
    
    
    $('#dateUp').css({
            'display': 'none'
        });
              $('#refnoUp').css({
            'display': 'none'
        });
               $('#cusnameUp').css({
            'display': 'none'
        });
              $('#statusUp').css({
            'display': 'none'
        });
              $('#duedateUp').css({
            'display': 'none'
        });
              $('#amountUp').css({
            'display': 'none'
        });
}  

$scope.sortByDate= function()
{
     
    if($("#date").css('display') === "none"){
           $scope.estimateList.sort(function(a,b){
               return a.entity.estimateDate>b.entity.estimateDate ? -1 : a.entity.estimateDate<b.entity.estimateDate ? 1 : 0;
                //return b.estimateDate.localeCompare(a.estimateDate)
           });
            $('#date').css({
                'display': 'inline-table'
            });
            $('#dateUp').css({
                'display': 'none'
            });
        }
        else{
             $scope.estimateList.sort(function(a,b){
                 return b.entity.estimateDate>a.entity.estimateDate ? -1 : b.entity.estimateDate<a.entity.estimateDate ? 1 : 0;
                //return a.estimateDate.localeCompare(b.estimateDate)
             });
            $('#dateUp').css({
                'display': 'inline-table'
            });
            $('#date').css({
                'display': 'none'
            });
        }
              $('#estimate').css({
            'display': 'none'
        });
              $('#refno').css({
            'display': 'none'
        });
               $('#cusname').css({
            'display': 'none'
        });
              $('#status').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
    
    $('#estimateUp').css({
            'display': 'none'
        });
              $('#refnoUp').css({
            'display': 'none'
        });
               $('#cusnameUp').css({
            'display': 'none'
        });
              $('#statusUp').css({
            'display': 'none'
        });
              $('#duedateUp').css({
            'display': 'none'
        });
              $('#amountUp').css({
            'display': 'none'
        });
    
}

$scope.sortByRefNo= function()
{
      
     if($("#refno").css('display') === "none"){
            $scope.estimateList.sort(function(a,b){ 
      return a.entity.referenceNumber.localeCompare(b.entity.referenceNumber)});
            $('#refno').css({
                'display': 'inline-table'
            });
            $('#refnoUp').css({
                'display': 'none'
            });
        }
        else{
             $scope.estimateList.sort(function(a,b){ 
      return b.entity.referenceNumber.localeCompare(a.entity.referenceNumber)});
            $('#refnoUp').css({
                'display': 'inline-table'
            });
            $('#refno').css({
                'display': 'none'
            });
        }
    
     $('#date').css({
            'display': 'none'
        });
              $('#estimate').css({
            'display': 'none'
        });
               $('#cusname').css({
            'display': 'none'
        });
              $('#status').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
    
    $('#dateUp').css({
            'display': 'none'
        });
              $('#estimateUp').css({
            'display': 'none'
        });
               $('#cusnameUp').css({
            'display': 'none'
        });
              $('#statusUp').css({
            'display': 'none'
        });
              $('#duedateUp').css({
            'display': 'none'
        });
              $('#amountUp').css({
            'display': 'none'
        });
    
} 
$scope.sortByCustomerName= function()
{
      
    if($("#cusname").css('display') === "none"){
            $scope.estimateList.sort(function(a,b){
      return a.customer.displayName.localeCompare(b.customer.displayName)});
            $('#cusname').css({
                'display': 'inline-table'
            });
            $('#cusnameUp').css({
                'display': 'none'
            });
        }
        else{
             $scope.estimateList.sort(function(a,b){
      return b.customer.displayName.localeCompare(a.customer.displayName)});
            $('#cusnameUp').css({
                'display': 'inline-table'
            });
            $('#cusname').css({
                'display': 'none'
            });
        }
    
    $('#date').css({
            'display': 'none'
        });
              $('#estimate').css({
            'display': 'none'
        });
              $('#refno').css({
            'display': 'none'
        });
              $('#status').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
    
    
    $('#dateUp').css({
            'display': 'none'
        });
              $('#estimateUp').css({
            'display': 'none'
        });
              $('#refnoUp').css({
            'display': 'none'
        });
              $('#statusUp').css({
            'display': 'none'
        });
              $('#duedateUp').css({
            'display': 'none'
        });
              $('#amountUp').css({
            'display': 'none'
        });
} 
$scope.sortByStatus= function()
{
      
    if($("#status").css('display') === "none"){
           $scope.estimateList.sort(function(a,b){ 
      return a.entity.status.localeCompare(b.entity.status)});
            $('#status').css({
                'display': 'inline-table'
            });
            $('#statusUp').css({
                'display': 'none'
            });
        }
        else{
             $scope.estimateList.sort(function(a,b){ 
      return b.entity.status.localeCompare(a.entity.status)});
            $('#statusUp').css({
                'display': 'inline-table'
            });
            $('#status').css({
                'display': 'none'
            });
        }
    
    $('#date').css({
            'display': 'none'
        });
              $('#estimate').css({
            'display': 'none'
        });
              $('#refno').css({
            'display': 'none'
        });
               $('#cusname').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
    
    
    $('#dateUp').css({
            'display': 'none'
        });
              $('#estimateUp').css({
            'display': 'none'
        });
              $('#refnoUp').css({
            'display': 'none'
        });
               $('#cusnameUp').css({
            'display': 'none'
        });
              $('#duedateUp').css({
            'display': 'none'
        });
              $('#amountUp').css({
            'display': 'none'
        });
} 
$scope.sortByAmount= function()
{
    if($("#amount").css('display') === "none"){
              $scope.estimateList.sort(function(a,b){
      return a.entity.totalAmount - b.entity.totalAmount});
            $('#amount').css({
                'display': 'inline-table'
            });
            $('#amountUp').css({
                'display': 'none'
            });
        }
        else{
               $scope.estimateList.sort(function(a,b){
      return b.entity.totalAmount - a.entity.totalAmount});
            $('#amountUp').css({
                'display': 'inline-table'
            });
            $('#amount').css({
                'display': 'none'
            });
        }
    
    $('#date').css({
            'display': 'none'
        });
              $('#estimate').css({
            'display': 'none'
        });
              $('#refno').css({
            'display': 'none'
        });
               $('#cusname').css({
            'display': 'none'
        });
              $('#status').css({
            'display': 'none'
        });
              $('#duedate').css({
            'display': 'none'
        });
    
    
     $('#dateUp').css({
            'display': 'none'
        });
              $('#estimateUp').css({
            'display': 'none'
        });
              $('#refnoUp').css({
            'display': 'none'
        });
               $('#cusnameUp').css({
            'display': 'none'
        });
              $('#statusUp').css({
            'display': 'none'
        });
              $('#duedateUp').css({
            'display': 'none'
        });
              
} 
$scope.showMenu = function(){
    if($('.filtermenu').hasClass('show'))
     $('.filtermenu').removeClass('show');
    else
        $('.filtermenu').addClass('show');
}

$scope.currentEstimates = "All Estimates";
    $scope.allEstimates = function(){
    $scope.estimateList = $scope.allestimateList.filter(function(obj){
        return true;
    });
    $scope.displayInvoice = $scope.estimateList;
    $scope.currentEstimates = "All Estimates"
    $('.filtermenu').removeClass('show');
    
}
$scope.draftEstimates = function(){
    $scope.estimateList = $scope.allestimateList.filter(function(obj){
        return obj.entity.status == 'Draft';
    });
     $scope.displayInvoice = $scope.estimateList;
     $scope.currentEstimates = "Draft Estimate"
    
    $('.filtermenu').removeClass('show');
}
$scope.sentEstimates = function(){
    $scope.estimateList = $scope.allestimateList.filter(function(obj){
        return obj.entity.status == 'Sent';
    });
    $scope.displayInvoice = $scope.estimateList;
    $scope.currentEstimates = "Sent Estimates"
    $('.filtermenu').removeClass('show');
}
$scope.invoicedEstimates = function(){
    $scope.estimateList = $scope.allestimateList.filter(function(obj){
        return obj.entity.status == 'Invoiced';
    });
    
    $scope.displayInvoice = $scope.estimateList;
    $scope.currentEstimates = "Invoiced Estimates"
    $('.filtermenu').removeClass('show');
}

$scope.search = function()
{
    if($scope.searchText.length)
    {
        $scope.estimateList = $scope.displayInvoice.filter(function (obj)
        {
            if(!obj.estimateDate)
            {
              obj.estimateDate = "";      
            }
            if(!obj.entity.estimateNumber)
            {
              obj.entity.estimateNumber = "";      
            }
            if(!obj.entity.referenceNumber)
            {
              obj.entity.referenceNumber = "";      
            }
            if(!obj.customer.displayName)
            {
              obj.customer.displayName = "";      
            }
            if(!obj.statusClass)
            {
              obj.statusClass = "";      
            }
             if(!obj.entity.status)
            {
               obj.entity.status = "";      
            }
            if(!obj.totalAmount)
            {
              obj.totalAmount = "";      
            }
           return obj.estimateDate.toLowerCase().includes($scope.searchText.toLowerCase()) ||
           obj.entity.estimateNumber.toLowerCase().includes($scope.searchText.toLowerCase()) ||
           obj.entity.referenceNumber.toLowerCase().includes($scope.searchText.toLowerCase()) ||
           obj.customer.displayName.toLowerCase().includes($scope.searchText.toLowerCase()) ||
           obj.statusClass.toLowerCase().includes($scope.searchText.toLowerCase()) ||
           obj.entity.status.toLowerCase().includes($scope.searchText.toLowerCase()) ||
           obj.totalAmount.toLowerCase().includes($scope.searchText.toLowerCase());              
        });
    }
    else
    {
        $scope.estimateList = $scope.displayInvoice;
    }
}
}]);