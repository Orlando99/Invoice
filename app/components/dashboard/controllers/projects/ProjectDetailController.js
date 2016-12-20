'use strict';

invoicesUnlimited.controller('ProjectDetailController',
	['$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
		'projectService', 'coreFactory', 'projectUserFactory', 'commentFactory', 'currencyFilter', 'appFields',

function($q, $scope, $state, $sce, $controller, userFactory,
	projectService, coreFactory, projectUserFactory, commentFactory, currencyFilter, appFields) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

coreFactory.getUserRole(user)
	.then(function(role) {
		$scope.userRole = role;
	});
    
    userFactory.getField('dateFormat')
	.then(function(obj) {
		$scope.dateFormat = obj;
	});
    
    projectUserFactory.getAll()
    .then(function(users){
		$scope.users = users.map(function(el){
			setObjectOperations({
				object 		: el,
				fields 		: appFields.projectUser
			});
			return el;
		});
        //$scope.users.push(createUserOpener);
        showProjectDetail();
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
		newUser : 'Please select a user'
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

function showProjectDetail() {
	var projectId = $state.params.projectId;
	if (! projectId) return;

	showLoader();
	$q.when(projectService.getProjectDetails(projectId))
	.then(function(project) {
	//	console.log(estimate);
		$scope.project = project.entity;
        $scope.customer = project.entity.get("customer");
        $scope.tasks = project.tasks;
        $scope.staff = project.users;
        $scope.actualProject = project;
        
        $scope.staff.forEach(function(obj){
            for(var i = 0; i < $scope.users.length; ++i){
                if($scope.users[i].id == obj.user.id){
                    $scope.users.splice(i, 1);
                    break;
                }
            }
        });
        
        $scope.unbilledHours = 0;
        $scope.billedHours = 0;
        $scope.billableHours = 0;
        
        var totalHours = 0;
        var totalMinutes = 0;
        
        var hours = 0;
        var minutes = 0;
        
        var billedHours = 0;
        var billedMinutes = 0;
        
        project.timesheets.forEach(function(obj){
            var t = obj.get('timeSpent');
            if(t){
                var d = obj.get('date');
                var msec = d - t;
                var hh = Math.floor(msec / 1000 / 60 / 60);
                msec -= hh * 1000 * 60 * 60;
                var mm = Math.floor(msec / 1000 / 60);
                msec -= mm * 1000 * 60;
                
                if(obj.get('isBilled')){
                    billedHours += hh;
                    billedMinutes += mm;
                }
                else{
                    hours += hh;
                    minutes += mm;
                }
                
                hh = hh < 10 ? '0' + hh : '' + hh
                mm = mm < 10 ? '0' + mm : '' + mm
                obj.time = hh + ':' + mm;
                
            }
            else
                obj.time = "00:00";
        });
        
        totalHours = hours + billedHours;
        totalMinutes = minutes + billedMinutes;
        
        totalHours += (totalMinutes/60);
        totalMinutes = totalMinutes % 60;
        
        totalHours = totalHours < 10 ? "0" + totalHours.toFixed(0) : totalHours.toFixed(0);
        totalMinutes = totalMinutes < 10 ? "0" + totalMinutes.toFixed(0) : totalMinutes.toFixed(0);
        $scope.billableHours = totalHours + ":" + totalMinutes;
        
        hours += (minutes/60);
        minutes = minutes % 60;
        
        hours = hours < 10 ? "0" + hours.toFixed(0) : hours.toFixed(0);
        minutes = minutes < 10 ? "0" + minutes.toFixed(0) : minutes.toFixed(0);
        $scope.unbilledHours = hours + ":" + minutes;
        
        billedHours += (billedMinutes/60);
        billedMinutes = billedMinutes % 60;
        
        billedHours = billedHours < 10 ? "0" + billedHours.toFixed(0) : billedHours.toFixed(0);
        billedMinutes = billedMinutes < 10 ? "0" + billedMinutes.toFixed(0) : billedMinutes.toFixed(0);
        $scope.billedHours = billedHours + ":" + billedMinutes;
        
        $scope.timesheets = project.timesheets;
 
        if($scope.project.billingMethod != 'Based on task hours')
            $('.task').addClass('tasks-detail');
        
        hideLoader();
	});

}
    
$scope.deleteProjectClicked = function(){
    $('.confirmation-pop-up').addClass('show');
}
    
$scope.deleteProject = function(){
    //alert('deleted');
    
    var staffToDelete = [];
    var tasksToDelete = [];
    
    if($scope.staff){
        $scope.staff.forEach(function(obj){
            staffToDelete.push(obj.entity);
        });
    }
    
    if($scope.tasks){
        $scope.tasks.forEach(function(obj){
            tasksToDelete.push(obj.entity);
        });
    }
    
    var sheetsToDelete = $scope.timesheets;
    
    var promise = [];
    var p;
    
    p = $q.when(Parse.Object.destroyAll(staffToDelete))
    .then(function(){
        
    });
    
    promise.push(p);
    
    p = $q.when(Parse.Object.destroyAll(tasksToDelete))
    .then(function(){
       
    });
    
    promise.push(p);
    showLoader();
    $q.all(promise)
    .then(function(){
        $scope.project.destroy()
        .then(function(){
            hideLoader();
            $state.go('dashboard.projects.all');
        });
    });
    
}

$scope.prepareToAddTask = function(){
    $('#addTaskForm')[0].reset();
}

$scope.prepareToAddTimesheet = function(){
    $scope.timesheetDate = new Date();
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
        
        var temptasks = $scope.project.get('tasks');
        if(temptasks)
            temptasks.push(task);
        else{
            temptasks = [];
            temptasks.push(task);
        }
        $scope.project.set('tasks', temptasks);
        
        $scope.project.save()
        .then(function(onj){
            $(".new-task").removeClass('show');
            hideLoader();
            window.location.reload();
        });
    });
}

$scope.addNewUser = function(){
    if(!$('#addUserForm').valid())
        return;
    
    showLoader();
    
    var acl = new Parse.ACL();
    acl.setRoleWriteAccess($scope.userRole.get("name"), true);
    acl.setRoleReadAccess($scope.userRole.get("name"), true);
    
    var params = {
			user : user,
			organization : $scope.project.get('organization'),
			acl : acl
		};
    
    createStaffUsers($scope.newUser, params);
    
    //$scope.newUser = "";
}

function createStaffUsers (users, params) {
    
    Parse.Promise.as([]);

    var parseUsers = [];
    var Staff = Parse.Object.extend('Staff');

     var obj = new Staff();
    obj.set('userID', params.user);
    obj.set('organization', params.organization);
    obj.setACL(params.acl);
    obj.set('chosenUser', users);
    parseUsers.push(obj);

    return Parse.Object.saveAll(parseUsers).then(function(staffObjs) {
        var temp = $scope.project.get('users');
        if(temp)
            $scope.project.set('users', staffObjs.concat(temp));
        else
            $scope.project.set('users', staffObjs);
        
        $scope.project.save()
        .then(function(proj){
            $(".add-user").removeClass('show');
            hideLoader();
            $state.reload();
        });
    });
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
        case 2: $scope.openPicker2 = true; break;
	}
}


$scope.addToInvoice = function(){
    $scope.invoiceDate = new Date();
    $scope.dataOnInvoice = '1';
    $scope.itemName = '1';
    $('.convert-invoice').addClass('show');
}

$scope.SavetoInvoice = function(){
    var obj = {
        invoiceDueDate : $scope.invoiceDate,
        dataOnInvoice : $scope.dataOnInvoice,
        itemNameToShow : $scope.itemName,
        project : $scope.actualProject
    };
    $state.go('dashboard.sales.invoices.new', {'projectId':obj });
}
    

$scope.saveTimesheet = function(){
    if(!$("#addTimesheetForm").valid())
        return;
    
    showLoader();
    
    var acl = new Parse.ACL();
    acl.setRoleWriteAccess($scope.userRole.get("name"), true);
    acl.setRoleReadAccess($scope.userRole.get("name"), true);
    
    var params = {
			user : user,
			organization : $scope.project.get('organization'),
			acl : acl
		};
    
    var d = new Date();
    d.subtractHours($scope.timesheetHours);
    d.subtractMinutes($scope.timesheetMinutes);
    
    var newsheet = {
        user : $scope.timesheetUser.user,
        task : $scope.timesheetTask.entity,
        date : $scope.timesheetDate,
        notes : $scope.timesheetDescription,
        timeSpent : d,
        hours : $scope.timesheetHours < 10 ? '0' + $scope.timesheetHours : '' + $scope.timesheetHours,
        minutes : $scope.timesheetMinutes < 10 ? '0' + $scope.timesheetMinutes : '' + $scope.timesheetMinutes
    };
    
    createTimesheets (newsheet, params);
    
    $scope.timesheetUser = "";
    $scope.timesheetTask = "";
    $scope.timesheetDate = new Date();
    $scope.timesheetDescription = "";
}

function createTimesheets (timesheets, params) {
	params.timesheets = [];
	
    Parse.Promise.as([]);
    
    var parseTasks = [];
    var Timesheet = Parse.Object.extend('Timesheets');

    var obj = new Timesheet();
    obj.set('userID', params.user);
    obj.set('organization', params.organization);
    obj.setACL(params.acl);
    obj.set('user', timesheets.user);
    obj.set('task', timesheets.task);
    obj.set('date', timesheets.date);
    obj.set('notes', timesheets.notes);
    obj.set('timeSpent', timesheets.timeSpent);

    parseTasks.push(obj);

    return Parse.Object.saveAll(parseTasks).then(function(sheets) {
        var temp = $scope.project.get('timeSheets');
        if(temp)
            $scope.project.set('timeSheets', sheets.concat(temp));
        else
            $scope.project.set('timeSheets', sheets);
        
        $scope.project.save()
        .then(function(proj){
            $(".new-timesheet").removeClass("show");
            hideLoader();
            $state.reload();
        });
    });
}
    
/*
$scope.emailReceipt = function() {
	showLoader();
	$q.when(estimateService.sendEstimateReceipt($scope.estimate.entity))
	.then(function(obj) {
		console.log('Receipt sent successfully.');
		hideLoader();
	}, function(error) {
        addNewComment('Estimate sent by email', true);
		hideLoader();
		console.log(error.message);
	});
}

$scope.deleteEstimate = function() {
	showLoader();
	var estimate = $scope.estimate.entity;
	var children = [];
	var x = undefined;

	['comments', 'estimateItems']
	.forEach(function(field) {
		x = estimate.get(field);
		if(x) children = children.concat(x);
	});

	Parse.Object.destroyAll(children)
	.then(function() {
		return estimate.destroy();
	})
	.then(function() {
		hideLoader();
		$state.go('dashboard.sales.estimates.all');
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
	})
	.then(function() {
		var comment = new commentFactory(data.commentObj);

		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];

		console.log(comment);
	});

}
    
$scope.estimatePrinted = function(){
    addNewComment('Estimate printed', true);
}

$scope.estimateCloned = function(){
    addNewComment('Estimate cloned', true);
}

$scope.addComment = function() {
	if (! $scope.newComment) {
		$('.add-comment').removeClass('show');
		return;
	}

	showLoader();
	var obj = {
		userID : user,
		organization : organization,
		name : user.get('username'),
		date : new Date(),
		isAutomaticallyGenerated : false,
		comment : $scope.newComment
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
	})
	.then(function() {
		var comment = new commentFactory(data.commentObj);

		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];

		console.log(comment);
		$('.add-comment').removeClass('show');
		hideLoader();
	});

}
*/
}]);