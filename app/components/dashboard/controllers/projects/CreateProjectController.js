'use strict';

invoicesUnlimited.controller('CreateProjectController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'projectService', 'coreFactory', 'taxService', 'commentFactory',
	'currencyFilter', 'projectUserFactory', 'appFields',
function($scope, $state, $controller, $q, userFactory,
	projectService,coreFactory,taxService,commentFactory,currencyFilter,projectUserFactory,appFields) {

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
$('#addTaskForm').validate({
	rules: {
		newTaskName : 'required'
	},
	messages: {
		newTaskName : 'Please enter task name'
	}
});
$('#addUserForm').validate({
	rules: {
		newUser : 'required'
	},
	messages: {
		newTaskName : 'Please select a user'
	}
});
    
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
		//$scope.selectedCustomer = $scope.customers[0];
	});
    
    promises.push(p);
    
    p = $q.when(projectUserFactory.getAll()).then(function(users,arg2){
		$scope.users = users.map(function(el){
			setObjectOperations({
				object 		: el,
				fields 		: appFields.projectUser
			});
			return el;
		});
        $scope.users.push(createUserOpener);
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
    $scope.projectUsers = [];
    $scope.tasks = [];
	$scope.todayDate = new Date();
	//$scope.subTotalStr = currencyFilter(0, '$', 2);
    $scope.hasBudget = 0;
	var customerId = $state.params.customerId;

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
function customerChanged() {
	if($scope.selectedCustomer.dummy) {
		$state.go('dashboard.customers.new', {backLink : $state.current.name});
		return;
	}
}
    
$scope.customerChanged = customerChanged;
    
function userChanged() {
	if($scope.newUser.dummy) {
		alert("new user clicked")
        $scope.newUser = "";
		return;
	}
}
    
$scope.userChanged = userChanged;  

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
		(project, $scope.userRole, $scope.tasks, $scope.projectUsers)
    .then(function(project){
        hideLoader();
		$state.go('dashboard.projects.all');
    });
}

$scope.cancel = function() {
	$state.go('dashboard.sales.projects.all');
}

$scope.addTask = function(){
    $(".new-task").addClass('show');
}

$scope.addNewTask = function() {
    if(!$('#addTaskForm').valid())
        return;
	$scope.tasks.push({
		taskName : $scope.newTaskName,
		taskDescription : $scope.newTaskDescription,
	});
    $(".new-task").removeClass('show');
    $scope.newTaskName = "";
    $scope.newTaskDescription = "";
}

$scope.addNewUser = function(){
    if(!$('#addUserForm').valid())
        return;
    $scope.projectUsers.push($scope.newUser);
    $(".add-user").removeClass('show');
    //$scope.newUser = "";
}

$scope.removeUser = function(index){
    $scope.projectUsers.splice(index, 1);
}

$scope.removeTask = function(index){
    $scope.tasks.splice(index, 1);
}

$scope.addUser = function(){
     $(".add-user").addClass('show');
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