'use strict';

invoicesUnlimited.controller('ProjectsController',['$q', '$scope', '$state', '$controller',
	'userFactory', 'projectService', 'coreFactory', 'taxService', 'expenseService', 'commentFactory', 'currencyFilter',

function($q, $scope, $state, $controller, userFactory, projectService,
	coreFactory, taxService, expenseService, commentFactory, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
    hideLoader();

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
    hideLoader();
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

	hideLoader();
}
    
function saveEditedProject() {
	var project = $scope.project.entity;
	project.set('customer', $scope.selectedCustomer.entity);
	project.set('projectName', $scope.projectName);
	project.set('projectDescription', $scope.projectDescription);
	project.set('billingMethod', $scope.billingMethod);
	project.set('projectBillingHours', $scope.projectBillingHours);
	project.set('projectBillingAmount', $scope.projectBillingAmount);
    
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
		($scope.project, user, $scope.userRole)

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

/*
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

//----- common --------

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}
*/
function customerChangedHelper() {
	
}
    
    function customerChanged() {
	   //showLoader();
		//hideLoader();
	}

$scope.customerChanged = customerChanged;

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

	p = $q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		$scope.userRole = role;
	});
	promises.push(p);

	return $q.all(promises);
}



}]);