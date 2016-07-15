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
		},
		customer : 'required'
	},
	messages: {
		expCategory : 'Please Select an Expense category',
		date : 'Please specify enpense date',
		amount : {
			required : 'Please enter expenes amount'
		},
		customer : 'Please select a customer'
	}
});

$('#editExpenseForm').validate({
	rules: {
		expCategory: 'required',
		date : 'required',
		amount : {
			required : true,
			min : 0.01
		},
		customer : 'required'
	},
	messages: {
		expCategory : 'Please Select an Expense category',
		date : 'Please specify enpense date',
		amount : {
			required : 'Please enter expenes amount'
		},
		customer : 'Please select a customer'
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
		console.log('its in edit');
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

		$scope.expense = expenseObj;
		console.log(expenseObj);
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
		console.log(expense);
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

		$scope.selectedCustomer = $scope.customers.filter(function(cust) {
			return expense.entity.get('customer').id == cust.entity.id;
		})[0];

		if(expense.entity.tax) {
			$scope.selectedTax = $scope.taxes.filter(function(tax) {
				return expense.entity.tax.id == tax.id;
			})[0];
		}

		hideLoader();
	});
}

function prepareToCreateExpense() {
	showLoader();
	$q.when(loadRequiredData()).then(function(msg) {
		$scope.expenseType = {
			types : [
				{name: 'Non Billable', value: 'Non-Billable'},
				{name: 'Billable', value: 'Billable'}
			],
			selectedType: {name:'Non Billable', value:'Non-Billable'}
		}

		$scope.todayDate = new Date();		
		hideLoader();
		console.log('data loaded');
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
	if(! $('#addExpenseForm').valid()) return;

	showLoader();
	var expense = {
		userID : user,
		organization : organization,
		customer : $scope.selectedCustomer.entity,
		tax : $scope.selectedTax,
		amount : $scope.amount,
		referenceNumber : $scope.refNumber,
		category : $scope.selectedCategory.entity.name,
		expanseDate : $scope.todayDate,
		notes : $scope.notes,
		status : $scope.expenseType.selectedType.value,
		currency: 'USD - US Dollar'
	};
	expense.billable = (expense.status == 'Billable')? 'Yes' : 'No';

	expenseService.createNewExpense(expense, $scope.userRole, $scope.filepicker)
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
	if(! $('#editExpenseForm').valid()) return;
	else {
		console.log('valid data');
		return;
	}

	showLoader();
	var expense = $scope.expense;
	expense.set('customer', $scope.selectedCustomer.entity);
	expense.set('tax', $scope.selectedTax);
	expense.set('amount', $scope.amount);
	expense.set('referenceNumber', $scope.refNumber);
	expense.set('category', $scope.selectedCategory.entity.name);
	expense.set('expanseDate', $scope.todayDate);
	expense.set('notes', $scope.notes);
	expense.set('status', $scope.expenseType.selectedType.value);
	
	if ($scope.expenseType.selectedType.value == 'Billable')
		expense.set('billable', 'Yes');
	else expense.set('billable', 'No');

	expenseService.updateExpense(expense)
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

$scope.customerSelected = function() {
	$scope.showType = true;
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}

}]);