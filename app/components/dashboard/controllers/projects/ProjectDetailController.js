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

showProjectDetail();

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
        $scope.timesheets = project.timesheets;
        hideLoader();
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