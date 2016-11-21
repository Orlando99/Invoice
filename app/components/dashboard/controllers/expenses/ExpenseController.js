'use strict';

invoicesUnlimited.controller('ExpenseController',['$q', '$scope','$state', '$controller',
	'userFactory', 'expenseService', 'coreFactory', 'taxService', 'currencyFilter',
function($q, $scope, $state, $controller, userFactory, expenseService, coreFactory, taxService, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get('organizations')[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

var isGoTo = {
	details : function(to){
		return to.endsWith('expenses.details');	
	},
	expenses : function(to){ 
		return to.endsWith('expenses.all');
	},
	edit : function(to){
		return to.endsWith('expenses.edit');
	},
	newExpense : function(to){
		return to.endsWith('expenses.new');	
	}
};

CheckUseCase();

$('#addExpenseForm').validate({
	rules: {
		expCategory: 'required',
		date : 'required',
		amount : {
			required : true,
			min : 0.01
		}//,
		//customer : 'required'
	},
	messages: {
		expCategory : 'Please select an expense category',
		date : 'Please specify expense date',
		amount : {
			required : 'Please enter expense amount'
		}//,
		//customer : 'Please select a customer'
	}
});

$('#editExpenseForm').validate({
	rules: {
		expCategory: 'required',
		date : 'required',
		amount : {
			required : true,
			min : 0.01
		}//,
		//customer : 'required'
	},
	messages: {
		expCategory : 'Please select an expense category',
		date : 'Please specify expense date',
		amount : {
			required : 'Please enter expense amount'
		}//,
		//customer : 'Please select a customer'
	}
});

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.expenses(stateName)) {
		listExpenses();

	} else if (isGoTo.details(stateName)) {
		showExpenseDetails();

	} else if (isGoTo.newExpense(stateName)) {
		prepareToCreateExpense();

	} else if (isGoTo.edit(stateName)) {
		prepareToEditExpense();
	}
}

function showExpenseDetails () {
	var expenseId = $state.params.expenseId;
	if (! expenseId) return;
	
	showLoader();
	$q.when(expenseService.getExpenseDetails(expenseId))
	.then(function(expenseObj) {
		expenseObj.amount = currencyFilter(expenseObj.entity.amount, '$', 2);
		expenseObj.date = formatDate(expenseObj.entity.expanseDate, 'dddd, MMMM DD, YYYY');
		// Thursday, Decemer 03, 2014

		if(expenseObj.attachments) {
			$scope.attachments = expenseObj.attachments;
			$scope.attachments.forEach(function(attach) {
				attach.fileName = attach.name();
				attach.fileUrl = attach.url();
			});
			
		} else {
			$scope.attachments = [];
		}

		$scope.expense = expenseObj;
	//	console.log(expenseObj);
		hideLoader();

	}, function(error) {
		console.log(error.message);
		hideLoader();
	});
}

function prepareToEditExpense() {
	var expenseId = $state.params.expenseId;
	if (! expenseId) return;
	
	showLoader();
	return $q.when(loadRequiredData())
	.then(function(msg) {
		return $q.when(expenseService.getExpense(expenseId));
	})
	.then(function(expense) {
		$scope.expense = expense.entity;
		$scope.expenseType = {
			types : [
				{name: 'Non Billable', value: 'Non-Billable'},
				{name: 'Billable', value: 'Billable'}
			]
		}
		var n = (expense.entity.status == 'Billable') ? 1 : 0;
		$scope.expenseType.selectedType = $scope.expenseType.types[n];
		$scope.todayDate = expense.entity.expanseDate;
		$scope.amount = expense.entity.amount;
		$scope.refNumber = expense.entity.referenceNumber;
		$scope.notes = expense.entity.notes;

		$scope.selectedCategory = $scope.categories.filter(function(category) {
			return expense.entity.category == category.entity.name;
		})[0];

		var custObj = expense.entity.get('customer');
		if (custObj) {
			$scope.selectedCustomer = $scope.customers.filter(function(cust) {
				return custObj.id == cust.entity.id;
			})[0];
		}

		if(expense.entity.tax) {
			$scope.selectedTax = $scope.taxes.filter(function(tax) {
				return expense.entity.tax.id == tax.id;
			})[0];
		}

		var files = expense.entity.expenseFiles;
		if (files) {
			files.forEach(function(file) {
				file.fileName = file.name();
				file.exist = true;
			});
			$scope.files = files;
		} else {
			$scope.files = [];
		}

		hideLoader();
	});
}

function prepareToCreateExpense() {
	showLoader();
    
    var expenseId = $state.params.expenseId;
    
	$q.when(loadRequiredData()).then(function(msg) {
        if(expenseId)
        {
            $q.when(expenseService.getExpense(expenseId))
            .then(function(expense) {
                $scope.expense = expense;
                
                var n = (expense.entity.status == 'Billable') ? 1 : 0;
                $scope.expenseType.selectedType = $scope.expenseType.types[n];
                $scope.todayDate = expense.entity.expanseDate;
                $scope.amount = expense.entity.amount;
                $scope.refNumber = expense.entity.referenceNumber;
                $scope.notes = expense.entity.notes;

                $scope.selectedCategory = $scope.categories.filter(function(category) {
                    return expense.entity.category == category.entity.name;
                })[0];

                var custObj = expense.entity.get('customer');
                if (custObj) {
                    $scope.selectedCustomer = $scope.customers.filter(function(cust) {
                        return custObj.id == cust.entity.id;
                    })[0];
                }

                if(expense.entity.tax) {
                    $scope.selectedTax = $scope.taxes.filter(function(tax) {
                        return expense.entity.tax.id == tax.id;
                    })[0];
                }
                $scope.files = [];
            });
        }
        else{
            $scope.expenseType = {
			types : [
				        {name: 'Non Billable', value: 'Non-Billable'},
				        {name: 'Billable', value: 'Billable'}
			         ],
			     selectedType: {name:'Non Billable', value:'Non-Billable'}
            }

            // coming back from Create New Customer
            var customerId = $state.params.customerId;
            if(customerId) {
                $scope.expenseType.selectedType =
                    $scope.expenseType.types[1];
                $scope.selectedCustomer = $scope.customers.filter(function(cust) {
                    return cust.entity.id == customerId;
                })[0];
            }

            $scope.files = [];
            $scope.todayDate = new Date();		
            hideLoader();
        }
		
	});
}

function loadRequiredData() {
	var promises = [];
	var p = null;

	p = $q.when(coreFactory.getExpenseCategories({
		organization : organization
	})).then(function(categories) {
		$scope.categories = categories.sort(function(a,b){
			return alphabeticalSort(a.entity.name,b.entity.name)
		});
	});
	promises.push(p);

	p = taxService.getTaxes(user, function(taxes) {
		$scope.taxes = taxes;
	});
	promises.push(p);

	p = $q.when(coreFactory.getAllCustomers())
	.then(function(res) {
		$scope.customers = res.sort(function(a,b){
			return alphabeticalSort(a.entity.displayName,b.entity.displayName)
		});
		if(isGoTo.newExpense($state.current.name))
			$scope.customers = $scope.customers.concat([createCustomerOpener]);
	});
	promises.push(p);

	p = $q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		$scope.userRole = role;
	});
	promises.push(p);

	//---
	return $q.all(promises);
}

function listExpenses() {
	showLoader();
	$q.when(expenseService.listExpenses(user))
	.then(function(res) {
		res.forEach(function(obj) {
			switch (obj.entity.status) {
			case "Non-Billable":
				obj.statusClass = "text-color-normalize";
				break;
			case "Billable":
				obj.statusClass = "text-positive";
				break;
			default:
				obj.statusClass = "text-danger";
			}

			obj.expenseDate = formatDate(
				obj.entity.expanseDate, "MM/DD/YYYY");
			obj.amount = currencyFilter(obj.entity.amount, '$', 2);
		});

		$scope.expenseList = res;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}

$scope.saveNewExpense = function() {
	if(! $('#addExpenseForm').valid()) {
		var v = $('#addExpenseForm').validate();
		var offset = $(v.errorList[0].element).offset().top - 30;
		scrollToOffset(offset);
		return;	
	}

	showLoader();
	var expense = {
		userID : user,
		organization : organization,
		tax : $scope.selectedTax,
		amount : $scope.amount,
		referenceNumber : $scope.refNumber,
		category : $scope.selectedCategory.entity.name,
		expanseDate : $scope.todayDate,
		notes : $scope.notes,
		status : $scope.expenseType.selectedType.value,
		currency: 'USD - US Dollar'
	};
	if ($scope.selectedCustomer)
		expense.customer = $scope.selectedCustomer.entity;

	expense.billable = (expense.status == 'Billable')? 'Yes' : 'No';

	expenseService.createNewExpense(expense, $scope.userRole, $scope.files)
	.then(function(expenseObj) {
		hideLoader();
		console.log(expenseObj);
		$state.go('dashboard.expenses.all');

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveEditedExpense = function() {
	if(! $('#editExpenseForm').valid()) {
		var v = $('#editExpenseForm').validate();
		var offset = $(v.errorList[0].element).offset().top - 30;
		scrollToOffset(offset);
		return;	
	}

	showLoader();
	var expense = $scope.expense;
	expense.set('tax', $scope.selectedTax);
	expense.set('amount', $scope.amount);
	expense.set('referenceNumber', $scope.refNumber);
	expense.set('category', $scope.selectedCategory.entity.name);
	expense.set('expanseDate', $scope.todayDate);
	expense.set('notes', $scope.notes);
	expense.set('status', $scope.expenseType.selectedType.value);
	
	if($scope.selectedCustomer)
		expense.set('customer', $scope.selectedCustomer.entity);
	else
		expense.unset('customer');

	if ($scope.expenseType.selectedType.value == 'Billable')
		expense.set('billable', 'Yes');
	else expense.set('billable', 'No');

	expenseService.updateExpense(expense, $scope.files)
	.then(function(expenseObj) {
		console.log(expenseObj);
		hideLoader();
		$state.go('dashboard.expenses.all');

	}, function(error) {
		hideLoader();
		console.log(error.message);
	})
}

$scope.cancel = function() {
	$state.go('dashboard.expenses.all');
}

$scope.addNewFile = function(obj) {
	var file = obj.files[0];
	file.fileName = file.name; // to avoid naming conflict
	$scope.files.push(file);
	$scope.$apply();
}

$scope.removeFile = function(index) {
	$scope.files.splice(index,1);
}

$scope.customerSelected = function() {
	if( isGoTo.newExpense($state.current.name) && $scope.selectedCustomer.dummy) {
		$state.go('dashboard.customers.new', {backLink : $state.current.name});
		return;
	}

	if(! $scope.selectedCustomer) {
		$scope.expenseType.selectedType =
			$scope.expenseType.types[0];
	}
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}

// from expense details page
$scope.addAttachment = function(obj) {
	var file = obj.files[0];
	if (!file) return;

	showLoader();
	var expenseObj = $scope.expense.entity;
	var parseFile = new Parse.File(file.name, file);

	$q.when(parseFile.save())
	.then(function(fileObj) {
		var fileList = expenseObj.get('expenseFiles');
		if(fileList)
			fileList.push(fileObj)
		else
			fileList = [fileObj];

		expenseObj.set('expenseFiles', fileList);
		return expenseObj.save();
	})
	.then(function(invObj) {
		$state.reload();
		hideLoader();
	});
}

}]);