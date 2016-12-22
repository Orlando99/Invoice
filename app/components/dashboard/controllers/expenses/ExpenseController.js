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
		}
		 
	},
	messages: {
		expCategory : 'Please select an expense category',
		date : 'Please specify expense date',
		amount : {
			required : 'Please enter expense amount'
		} 
	}
});
//... 
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
    ///...
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
                attach.fileName1 = attach.fileName.substring(attach.fileName.indexOf("_") + 1 , attach.fileName.length);
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
                file.fileName1 = file.fileName.substring(file.fileName.indexOf("_") + 1 , file.fileName.length);
				file.exist = true;
			});
			$scope.files = files;
		} else {
			$scope.files = [];
		}

		hideLoader();
	});
}
    
    $scope.cloneExpense = function(expenseId){
        $state.go('dashboard.expenses.new', {'expenseId':expenseId });
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
                $scope.expenseType = {
                    types : [
                                {name: 'Non Billable', value: 'Non-Billable'},
                                {name: 'Billable', value: 'Billable'}
                             ],
                         selectedType: {name:'Non Billable', value:'Non-Billable'}
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
                        file.fileName1 = file.fileName.substring(file.fileName.indexOf("_") + 1 , file.fileName.length);
                        file.exist = true;
                    });
                    $scope.files = files;
                } else {
                    $scope.files = [];
                }
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
        res = res.filter(function(cust) {
				return cust.entity.status == 'active';
			});
        
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
    //..
	showLoader();
	$q.when(expenseService.listExpenses(user))
	.then(function(res) {
        var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
        
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
            
            if(obj.entity.get('expenseFiles'))
                obj.attachments = obj.entity.get('expenseFiles').length;
            
			obj.expenseDate = formatDate(
				obj.entity.expanseDate, dateFormat);
			obj.amount = currencyFilter(obj.entity.amount, '$', 2);
		});

		$scope.expenseList = res;
        $scope.allExpenses = res;
        $scope.displayedExpenses = res;
        $scope.currentExpenses = "All Expenses";
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}

$scope.sortByCatName= function()
{
  $scope.expenseList.sort(function(a,b){ 
      return a.entity.category.localeCompare(b.entity.category)});
     $('#date').css({
            'display': 'none'
        });
              $('#catname').css({
            'display': 'inline-table'
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
              $('#amount').css({
            'display': 'none'
        });
 } 

$scope.sortByDate= function()
{
  $scope.expenseList.sort(function(a,b){
  return a.expenseDate.localeCompare(b.expenseDate)});
    $('#date').css({
            'display': 'inline-table'
        });
              $('#catname').css({
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
              $('#amount').css({
            'display': 'none'
        });
 }

$scope.sortByReferenceNumber= function()
{
  $scope.expenseList.sort(function(a,b){
      
  return a.entity.referenceNumber.localeCompare(b.entity.referenceNumber)});
     $('#date').css({
            'display': 'none'
        });
              $('#catname').css({
            'display': 'none'
        });
              $('#refno').css({
            'display': 'inline-table'
        });
               $('#cusname').css({
            'display': 'none'
        });
              $('#status').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
 }

$scope.sortByCustomerName= function()
{
  $scope.expenseList.sort(function(a,b){ 
      $('#date').css({
            'display': 'none'
        });
              $('#catname').css({
            'display': 'none'
        });
              $('#refno').css({
            'display': 'none'
        });
               $('#cusname').css({
            'display': 'inline-table'
        });
              $('#status').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
    return a.customer.displayName.localeCompare(b.customer.displayName)});
    
 }

$scope.sortByStatus= function()
{
  $scope.expenseList.sort(function(a,b){
  return a.entity.status.localeCompare(b.entity.status)});
     $('#date').css({
            'display': 'none'
        });
              $('#catname').css({
            'display': 'none'
        });
              $('#refno').css({
            'display': 'none'
        });
               $('#cusname').css({
            'display': 'none'
        });
              $('#status').css({
            'display': 'inline-table'
        });
              $('#amount').css({
            'display': 'none'
        });
 }

$scope.sortByAmount= function()
{
  $scope.expenseList.sort(function(a,b){ 
  return b.entity.get('amount')-a.entity.get('amount')});
     $('#date').css({
            'display': 'none'
        });
              $('#catname').css({
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
              $('#amount').css({
            'display': 'inline-table'
        });
 }

$scope.deleteExpense = function(){
    if(!$scope.expense)
        return;
    showLoader();
    $scope.expense.entity.destroy()
    .then(function(){
        hideLoader();
        $state.go('dashboard.expenses.all');
    });
}

$scope.showMenu = function(){
    if($('.filtermenu').hasClass('show'))
        $('.filtermenu').removeClass('show');
    else
        $('.filtermenu').addClass('show');
}

$scope.billableExpenses = function(){
    $scope.expenseList = $scope.allExpenses.filter(function(obj){
        return obj.entity.status == 'Billable';
    });
    $scope.displayedExpenses = $scope.expenseList;
    $scope.currentExpenses = "Billable Expenses"
    
    $('.filtermenu').removeClass('show');
}

$scope.nonBillableExpenses = function(){
    $scope.expenseList = $scope.allExpenses.filter(function(obj){
        return obj.entity.status == 'Non-Billable';
    });
    $scope.displayedExpenses = $scope.expenseList;
    $scope.currentExpenses = "Non-Billable Expenses"
    
    $('.filtermenu').removeClass('show');
}

$scope.invoicedExpenses = function(){
    $scope.expenseList = $scope.allExpenses.filter(function(obj){
        return obj.entity.status == 'Invoiced';
    });
    $scope.displayedExpenses = $scope.expenseList;
    $scope.currentExpenses = "Invoiced Expenses"
    
    $('.filtermenu').removeClass('show');
}

$scope.showAllExpenses = function(){
    $scope.expenseList = $scope.allExpenses.filter(function(obj){
        return true;
    });
    $scope.displayedExpenses = $scope.expenseList;
    $scope.currentExpenses = "All Expenses"
    
    $('.filtermenu').removeClass('show');
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
    file.fileName1 = file.fileName.substring(file.fileName.indexOf("_") + 1 , file.fileName.length);
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
$scope.search = function()
{
    if($scope.searchText.length)
    {
      $scope.expenseList = $scope.displayedExpenses.filter(function(obj)
      {
          if(!obj.entity.referenceNumber)
          {
              obj.entity.referenceNumber = "";
          }
          if(!obj.expenseDate)
          { 
            obj.expenseDate = "";
          }
          if(!obj.entity.category)
          {      
              obj.entity.category = "";
          }
          if(!obj.entity.referenceNumber)
          {   
              obj.entity.referenceNumber = "";
          }
          if(!obj.customer.displayName)
          {  
              obj.customer.displayName = "";
          }
          if(!obj.entity.status)
          {     
              obj.entity.status = "";
          }
          if(!obj.amount)
          { 
              obj.amount = "";
          }   
          return obj.expenseDate.toLowerCase().includes($scope.searchText.toLowerCase())||
          obj.entity.category.toLowerCase().includes($scope.searchText.toLowerCase())||
     obj.entity.referenceNumber.toString().toLowerCase().includes($scope.searchText.toLowerCase())||
          obj.customer.displayName.toLowerCase().includes($scope.searchText.toLowerCase())||
          obj.entity.status.toLowerCase().includes($scope.searchText.toLowerCase())||
          obj.amount.toLowerCase().includes($scope.searchText.toLowerCase());
     });
    }
    else
    {
      $scope.expenseList = $scope.displayedExpenses;
    }
}
}]);