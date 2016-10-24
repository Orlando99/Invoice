'use strict';

invoicesUnlimited.controller('CreateProjectController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'projectService', 'coreFactory', 'taxService', 'commentFactory',
	'currencyFilter', 'salesCommon',
function($scope, $state, $controller, $q, userFactory,
	projectService,coreFactory,taxService,commentFactory,currencyFilter,salesCommon) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
    
prepareToCreateProject();

$('#addProjectForm').validate({
	rules: {
		customer : 'required',
		projectName : 'required',
		billingMethod : 'required',
        projectBillingHours : 'required',
        projectBillingAmount : 'required',
        budgetType : 'required',
        projectBudgetCost : 'required',
        projectBudgetHours : 'required'
	},
	messages: {
		customer : 'Please select a customer',
		projectName : 'Please enter project name',
		billingMethod : 'Please select a billing method',
        projectBillingHours : 'Please enter Rate/Hour',
        projectBillingAmount : 'Please enter Project Cost',
        budgetType : 'Please select budget type',
        projectBudgetCost : 'Please enter amount',
        projectBudgetHours : 'Please enter hours'
	}
});
/*
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

*/
function prepareToCreateProject() {
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

    /*
	p = $q.when(projectService.getPreferences(user))
	.then(function(prefs) {
		$scope.prefs = prefs;
	});
	promises.push(p);
*/
	p = $q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		$scope.userRole = role;
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

	$scope.todayDate = new Date();
	//$scope.subTotalStr = currencyFilter(0, '$', 2);
    $scope.hasBudget = 0;
	var customerId = $state.params.customerId;
	//var expenseId = $state.params.expenseId;

	if(customerId) {
		$scope.selectedCustomer = $scope.customers.filter(function(cust) {
			return cust.entity.id == customerId;
		})[0];

        customerChanged();
	}

	hideLoader();
}
/*
$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}
*/
    /*
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
        newItems.push(createItemOpener); // add createItem field
		return $scope.items = newItems;
	});
}
*/
    function customerChanged() {
	if($scope.selectedCustomer.dummy) {
		$state.go('dashboard.customers.new', {backLink : $state.current.name});
		return;
	}
/*
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
    */
}
    
$scope.customerChanged = customerChanged;

$scope.$watch('hasBudget', function(value) {
       if(value == 0)
           $scope.budgetType = "";
 });
    
$scope.saveProject = saveProject;
    
function saveProject() {
    
    if(!$('#addProjectForm').valid())
        return;
    showLoader();
    var isBudget = false;
    if($scope.hasBudget == 1)
        isBudget = true;
	var project = {
		userID : user,
		organization : organization,
		customer : $scope.selectedCustomer.entity,
		projectName : $scope.projectName,
        projectDescription : $scope.projectDescription,
        billingMethod : $scope.billingMethod,
        hasBudget : isBudget,
        projectBillingAmount : $scope.projectBillingAmount,
        projectBillingHours : $scope.projectBillingHours,
        budgetType : $scope.budgetType,
        projectBudgetCost : $scope.projectBudgetCost,
        projectBudgetHours : $scope.projectBudgetHours
	};

	return projectService.createNewProject
		(project, $scope.userRole)
    .then(function(project){
        hideLoader();
		$state.go('dashboard.projects.all');
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
$scope.cancel = function() {
	$state.go('dashboard.sales.projects.all');
}

function validateForms () {
	setValidationRules();
	var a = $('#addProjectForm').valid();
	//var b = $('#itemInfoForm').valid();
	//var c = $('#extrasForm').valid();
	
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
    /*
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

$scope.saveAndSend = function () {
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
*/
}]);