'use strict';

invoicesUnlimited.controller('CreateProjectController',
	['$scope', '$state', '$controller', '$q', 'userFactory',
	'projectService', 'coreFactory', 'taxService', 'commentFactory',
	'currencyFilter', 'projectUserFactory', 'appFields','$uibModal',
function($scope, $state, $controller, $q, userFactory,
	projectService,coreFactory,taxService,commentFactory,currencyFilter,projectUserFactory,appFields,$uibModal,$uibModalInstance,$document,queryService,user,method,title) {

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
$('#addTimesheetForm').validate({
	rules: {
		timesheetDate : 'required',
		timesheetHours : {
            required : true,
            number : true,
            min : 0,
            max : 23
        },
		timesheetMinutes : {
            required : true,
            number : true,
            min : 0,
            max : 59
        },
        timesheetUser : 'required',
        timeSheetTask : 'required'
	},
	messages: {
		timesheetDate : 'Please select a date',
		timesheetHours : {
            required : "Please enter hours",
            number : "Enter valid hours",
            min : "Please enter valid hours",
            max : "Please enter valid hours"
        },
		timesheetMinutes : {
            required : "Please enter minutes",
            number : "Enter valid minutes",
            min : "Please enter valid minutes",
            max : "Please enter valid minutes"
        },
        timesheetUser : 'Please select user',
        timeSheetTask : 'Please select task'
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
    $scope.timesheetTasks = [];
    $scope.timesheetTasks.push(createTaskOpener);
    
    $scope.timesheets = [];
    
	$scope.timesheetDate = new Date();
	//$scope.subTotalStr = currencyFilter(0, '$', 2);
    $scope.hasBudget = 0;
	var customerId = $state.params.customerId;

    for(var i = 0; i < $scope.users.length; ++i){
        var username = user.get('username');
        if($scope.users[i].userName == username){
            $scope.projectUsers.push($scope.users[i]);
            $scope.users.splice(i, 1);
        }
    }
    
	if(customerId) {
		$scope.selectedCustomer = $scope.customers.filter(function(cust) {
			return cust.entity.id == customerId;
		})[0];

        customerChanged();
	}

	hideLoader();
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}

$scope.removeTimesheet = function(index){
    $scope.timesheets.splice(index, 1);
}

function customerChanged() {
	if($scope.selectedCustomer.dummy) {
		$state.go('dashboard.customers.new', {backLink : $state.current.name});
		return;
	}
}
    
$scope.customerChanged = customerChanged;
    
$scope.timeSheetUserChanged = function(){
    if($scope.timesheetUser.dummy) {
		createUser();
        $scope.timesheetUser = "";
		return;
	}
}
    
function userChanged() {
	if($scope.newUser.dummy) {
		createUser();
        $scope.newUser = "";
		return;
	}
}

function createUser(){
		var modalInstance = $uibModal.open({
			animation 			: true,
			templateUrl 		: 'modal-user',
			controller 			: 'NewUserController',
			backdrop 			: true,
			appendTo 			: angular.element(document.querySelector('#view')),
			windowTemplateUrl 	: 'modal-window',
			resolve 			: {
				user : function() {
					var ctor = Parse.Object.extend(Parse.User);
					var obj = new ctor();
					setObjectOperations({
						object 		: obj,
						fields 		: appFields.user
					});
					return obj;
				},
				method 	: function(){
					return 'create';
				},
				title 	: function() {
					return 'Add User';
				}
			}
		});

		modalInstance.result.then(function(newUser){
			setObjectOperations({
				object 		: newUser,
				fields 		: appFields.user
			});
			var prUser = projectUserFactory
			.createNew({
				emailID 	 : newUser.email,
				role 		 : newUser.role,
				userName	 : newUser.username,
				country		 : newUser.country,
				title		 : newUser.fullName,
				organization : newUser.selectedOrganization,
				companyName  : newUser.company,
				userID 		 : userFactory.entity[0],//newUser,
				status 		 : 'Activated'
			}).then(function(res){
				$scope.$apply(function(){
                    $scope.users.pop();
					$scope.users.push(res);
                    $scope.users.push(createUserOpener);
                    $scope.newUser = res;
				});
			},function(e){
				console.log(e.message);
			});
		},function(){
			console.log('Dismiss modal');
		});
	}
    
$scope.userChanged = userChanged;  

$scope.saveTimesheet = function(){
    if(!$("#addTimesheetForm").valid())
        return;
    
    var d = new Date();
    d.subtractHours($scope.timesheetHours);
    d.subtractMinutes($scope.timesheetMinutes);
    
    var temp = $scope.timesheetTask.get('taskHours') || 0;
    
    $scope.timesheetTask.set('taskHours', $scope.timesheetHours + $scope.timesheetMinutes/60 + temp);
    $scope.timesheetTask.save()
    .then(function(obj){
        
    });
    
    $scope.timesheets.push({
        user : $scope.timesheetUser,
        task : $scope.timesheetTask,
        date : $scope.timesheetDate,
        notes : $scope.timesheetDescription,
        timeSpent : d,
        hours : $scope.timesheetHours < 10 ? '0' + $scope.timesheetHours : '' + $scope.timesheetHours,
        minutes : $scope.timesheetMinutes < 10 ? '0' + $scope.timesheetMinutes : '' + $scope.timesheetMinutes
    });
    $scope.timesheetUser = "";
    $scope.timesheetTask = "";
    $scope.timesheetDate = new Date();
    $scope.timesheetDescription = "";
    $(".new-timesheet").removeClass("show");
}
    
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
        projectBudgetHours : $scope.projectBudgetHours,
        tasks: $scope.tasks
	};

	return projectService.createNewProject
		(project, $scope.userRole, $scope.projectUsers, $scope.timesheets)
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
    $scope.fromTimesheet = false;
}

$scope.addNewTask = function() {
    if(!$('#addTaskForm').valid())
        return;
    
    showLoader();
    
    var acl = new Parse.ACL();
    acl.setRoleWriteAccess($scope.userRole.get("name"), true);
    acl.setRoleReadAccess($scope.userRole.get("name"), true);
    
    var Task = Parse.Object.extend('Task');
    
    var obj = new Task();
    obj.set('userID', user);
    obj.set('organization', organization);
    obj.setACL(acl);
    obj.set('taskName', $scope.newTaskName);
    obj.set('taskDescription', $scope.newTaskDescription);
    obj.set('taskCost', $scope.newTaskCost);

    return obj.save().then(function(task) {
        $scope.tasks.push(task);
        $scope.timesheetTasks.pop();
        $scope.timesheetTasks.push(task);
        $scope.timesheetTasks.push(createTaskOpener);
        if($scope.fromTimesheet){
            $scope.timesheetTask = task;        
        }
        $(".new-task").removeClass('show');
        $scope.newTaskName = "";
        $scope.newTaskDescription = "";
        $scope.newTaskCost = "";
        $scope.$apply();
        hideLoader();
    });
}
$scope.taskChanged = function(){
    if($scope.timesheetTask.dummy)
    {
        $scope.fromTimesheet = true;
        $scope.timesheetTask = ""; 
        $(".new-task").addClass("show");
    }
}






$scope.addTimesheet = function(){
    $(".new-timesheet").addClass('show');
}

$scope.addNewUser = function(){
    if(!$('#addUserForm').valid())
        return;
    $scope.projectUsers.push($scope.newUser);
    $scope.users = $scope.users.filter(function(el) {
        return el !== $scope.newUser;
    });
    $(".add-user").removeClass('show');
    //$scope.newUser = "";
}

$scope.removeUser = function(index){
    $scope.users.pop();
    $scope.users.push($scope.projectUsers[index]);
    $scope.users.push(createUserOpener);
    $scope.projectUsers.splice(index, 1);
}

$scope.removeTask = function(index){
    $scope.tasks.splice(index, 1);
    $scope.timesheetTasks.splice(index, 1);
    $scope.timesheetTask = "";
    $scope.$apply();
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