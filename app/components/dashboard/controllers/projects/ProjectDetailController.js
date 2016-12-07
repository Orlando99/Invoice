'use strict';

invoicesUnlimited.controller('ProjectDetailController',
	['$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
		'projectService', 'coreFactory', 'commentFactory', 'currencyFilter',

function($q, $scope, $state, $sce, $controller, userFactory,
	projectService, coreFactory, commentFactory, currencyFilter) {

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
    
showProjectDetail();
    
$('#addTaskForm').validate({
	rules: {
		newTaskName : 'required'
	},
	messages: {
		newTaskName : 'Please enter task name'
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
        
        project.timesheets.forEach(function(obj){
            var t = obj.get('timeSpent');
            if(t){
                var d = obj.get('date');
                var msec = d - t;
                var hh = Math.floor(msec / 1000 / 60 / 60);
                msec -= hh * 1000 * 60 * 60;
                var mm = Math.floor(msec / 1000 / 60);
                msec -= mm * 1000 * 60;
                hh = hh < 10 ? '0' + hh : '' + hh
                mm = mm < 10 ? '0' + mm : '' + mm
                obj.time = hh + ':' + mm;
            }
            else
                obj.time = "00:00";
        });
        $scope.timesheets = project.timesheets;
        hideLoader();
	});

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