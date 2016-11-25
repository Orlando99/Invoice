'use strict';

invoicesUnlimited.controller('ProjectsController',['$q', '$scope', '$state', '$controller',
	'userFactory', 'projectService', 'coreFactory', 'taxService', 'expenseService', 'commentFactory', 'currencyFilter','projectUserFactory','appFields','$uibModal',

function($q, $scope, $state, $controller, userFactory, projectService,
	coreFactory, taxService, expenseService, commentFactory, currencyFilter,projectUserFactory,appFields,$uibModal,$uibModalInstance,$document,queryService,user,method,title) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

$('#editProjectForm').validate({
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
		timesheetHours : 'required',
		timesheetMinutes : 'required',
        timesheetUser : 'required',
        timesheetTask : 'required'
	},
	messages: {
		timesheetDate : 'Please select a date',
		timesheetHours : 'Please enter hours',
		timesheetMinutes : 'Please enter minutes',
        timesheetUser : 'Please select user',
        timesheetTask : 'Please select task'
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
    
var isGoTo = {
	details : function(to){
		return to.endsWith('projects.details');	
	},
	projects : function(to){ 
		return to.endsWith('projects.all');
	},
	edit : function(to){
		return to.endsWith('projects.edit');
	},
	newProject : function(to){
		return to.endsWith('projects.new');	
	}
};
showLoader();
userFactory.getField('dateFormat')
.then(function(obj) {
	$scope.dateFormat = obj;
	CheckUseCase();
});

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.projects(stateName)) {
		console.log('its in list')
		listProjects();

	} else if (isGoTo.newProject(stateName)) {
		console.log('its in new');

	} else if (isGoTo.edit(stateName)) {
		console.log('its in edit');
		prepareToEditProject();

	}
}
    
    function listProjects() {
	showLoader();
	$q.when(projectService.listProjects(user))
	.then(function(res) {

	//	res = res.reverse();
		$scope.projectList = res;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});	
}

function prepareToEditProject() {
	var projectId = $state.params.projectId;
	if (! projectId) return;

	showLoader();
	$q.when(LoadRequiredData())
	.then(function(msg) {
		return $q.when(projectService.getProject(projectId));
	})
	.then(function (project) {
		console.log(project);

		$scope.project = project;
		
		$scope.selectedCustomer = $scope.customers.filter(function(cust) {
			return project.entity.get('customer').id == cust.entity.id;
		})[0];
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
    var project = $scope.project;
	
	$scope.projectName = project.entity.get("projectName");
	$scope.projectDescription = project.entity.get("projectDescription") || "";
	
	$scope.billingMethod = project.entity.get("billingMethod");

	$scope.projectBillingHours = project.entity.get("projectBillingHours") || 0;
    
	$scope.projectBillingAmount = project.entity.get("projectBillingAmount") || 0;
    
    if(project.entity.get("hasBudget")){
        $scope.hasBudget = 1;
    }
    else{
        $scope.hasBudget = 0;
    }
    
	$scope.budgetType = project.entity.get("budgetType");
	
	
    $scope.projectBudgetCost = project.entity.get("projectBudgetCost") || 0;
    
    $scope.projectBudgetHours = project.entity.get("projectBudgetHours") || 0;

    $scope.tasks = project.tasks;
    $scope.staffUsers = project.users;
    $scope.timesheets = [];
    project.timesheets.forEach(function(obj){
        var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
        obj.date = formatDate(
        obj.attributes.date, dateFormat);
        $scope.timesheets.push(obj);
        
    });
    $scope.timesheetTasks = [];
    project.tasks.forEach(function(task){
        $scope.timesheetTasks.push(task);
    });
    $scope.timesheetTasks.push(createTaskOpener);
    $scope.timesheetDate = new Date();
    
	hideLoader();
}
    
$scope.addTimesheet = function(){
    $(".new-timesheet").addClass('show');
}

$scope.saveTimesheet = function(){
    if(!$("#addTimesheetForm").valid())
        return;
    
    var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
    
    var tsk = undefined;
    
    if($scope.timesheetTask.entity)
        tsk = $scope.timesheetTask.entity;
    else
        tsk = $scope.timesheetTask;
    
    $scope.timesheets.push({
        user : $scope.timesheetUser,
        task : tsk,
        date : formatDate(
        $scope.timesheetDate, dateFormat),
        sheetDate : $scope.timesheetDate,
        notes : $scope.timesheetDescription
    });
    $scope.timesheetUser = "";
    $scope.timesheetTask = "";
    $scope.timesheetDate = new Date();
    $scope.timesheetDescription = "";
    $(".new-timesheet").removeClass("show");
}

$scope.removeTimesheet = function(index){
    $scope.timesheets.splice(index, 1);
}

$scope.removeTask = function(index){
    $scope.tasks.splice(index, 1);
    $scope.timesheetTasks.splice(index, 1);
    $scope.timesheetTask = "";
    $scope.$apply();
}

$scope.addTask = function(){
    $(".new-task").addClass('show');
    $scope.fromTimesheet = false;
}

$scope.taskChanged = function(){
    if($scope.timesheetTask.dummy){
        $scope.fromTimesheet = true;
        $scope.timesheetTask = ""; 
        $(".new-task").addClass("show");
    }
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

$scope.addNewUser = function(){
    if(!$('#addUserForm').valid())
        return;
    $scope.staffUsers.push($scope.newUser);
    $(".add-user").removeClass('show');
    //$scope.newUser = "";
}

$scope.removeUser = function(index){
    $scope.staffUsers.splice(index, 1);
}

$scope.addUser = function(){
     $(".add-user").addClass('show');
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}
    
function saveEditedProject() {
	var project = $scope.project.entity;
	project.set('customer', $scope.selectedCustomer.entity);
	project.set('projectName', $scope.projectName);
	project.set('projectDescription', $scope.projectDescription);
	project.set('billingMethod', $scope.billingMethod);
	project.set('projectBillingHours', $scope.projectBillingHours);
	project.set('projectBillingAmount', $scope.projectBillingAmount);
    //project.set('tasks', $scope.tasks);
    
    
    var allTasks = [];
    
    $scope.tasks.forEach(function(obj){
        if(obj.entity)
            allTasks.push(obj.entity);
        else
            allTasks.push(obj);
    });
    
    project.set('tasks', angular.copy(allTasks));
    
    if($scope.hasBudget == 1){
        project.set('hasBudget', true);
        project.set('budgetType', $scope.budgetType);
        project.set('projectBudgetCost', $scope.projectBudgetCost);
        project.set('projectBudgetHours', $scope.projectBudgetHours);
    }
    else{
        project.set('hasBudget', false);
    }

	return projectService.updateProject
		($scope.project, user, $scope.userRole, $scope.timesheets, $scope.staffUsers)

	.then(function(obj) {
        return obj;
	});
}
    
$scope.saveProject = function() {
	if(!$('#editProjectForm').valid())
        return;

	showLoader();
	
	saveEditedProject()
	.then(function(project) {
		hideLoader();
		console.log(project);
		$state.go('dashboard.projects.all');

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}
    
$scope.cancel = function() {
	$state.go('dashboard.projects.all');
}

function customerChangedHelper() {
	
}
    
    function customerChanged() {
	   //showLoader();
		//hideLoader();
	}
$scope.userChanged = userChanged;
    
function userChanged() {
	if($scope.newUser.dummy) {
        $scope.fromTimesheet = false;
		createUser();
        $scope.newUser = "";
		return;
	}
}  

$scope.timesheetUserChanged = function(){
    if($scope.timesheetUser.dummy) {
        $scope.fromTimesheet = true;
		createUser();
        $scope.newUser = "";
		return;
	}
}

$scope.sortByName = function(){
    $scope.projectList.sort(function(a,b){
        return a.entity.projectName.localeCompare(b.entity.projectName)});
}

$scope.sortByCustomer = function(){
    $scope.projectList.sort(function(a,b){
        return a.customer.displayName.localeCompare(b.customer.displayName)});
}

$scope.sortByDesc = function(){
    $scope.projectList.sort(function(a,b){
        if(!a.entity.projectDescription)
            return -1;
        if(!b.entity.projectDescription)
            return 1;
        return a.entity.projectDescription.localeCompare(b.entity.projectDescription)});
}

$scope.sortByBilling = function(){
    $scope.projectList.sort(function(a,b){
        if(!a.entity.billingMethod)
            return -1;
        if(!b.entity.billingMethod)
            return 1;
        return a.entity.billingMethod.localeCompare(b.entity.billingMethod)});
}

$scope.sortByAmount = function(){
    $scope.projectList.sort(function(a,b){
        if(!a.entity.projectBillingAmount && !b.entity.projectBillingAmount)
            return 0;
        if(!a.entity.projectBillingAmount)
            return -1;
        if(!b.entity.projectBillingAmount)
            return 1;
        return a.entity.projectBillingAmount-b.entity.projectBillingAmount;
    });
}

$scope.customerChanged = customerChanged;

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
                    if($scope.fromTimesheet){
                        $scope.timesheetUser = res;
                    }
                    else{
                        $scope.newUser = res;
                    }
                    $scope.fromTimesheet = false;
				});
			},function(e){
				console.log(e.message);
			});
		},function(){
			console.log('Dismiss modal');
		});
	}    
    
function LoadRequiredData() {
	var promises = [];
	var p = null;

	p = $q.when(coreFactory.getAllCustomers())
	.then(function(res) {
		$scope.customers = res.sort(function(a,b){
			return alphabeticalSort(a.entity.displayName,b.entity.displayName)
		});
	//	$scope.selectedCustomer = $scope.customers[0];
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

	p = $q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		$scope.userRole = role;
	});
	promises.push(p);

	return $q.all(promises);
}



}]);