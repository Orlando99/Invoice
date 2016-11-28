'use strict';

invoicesUnlimited.controller('EstimateDetailController',
	['$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
		'estimateService', 'coreFactory', 'commentFactory', 'currencyFilter',

function($q, $scope, $state, $sce, $controller, userFactory,
	estimateService, coreFactory, commentFactory, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

showEstimateDetail();

function showEstimateDetail() {
	var estimateId = $state.params.estimateId;
	if (! estimateId) return;

	showLoader();
	$q.when(estimateService.getEstimateDetails(estimateId))
	.then(function(estimate) {
	//	console.log(estimate);
		$scope.estimate = estimate;
		$scope.estimateNo = estimate.entity.estimateNumber;
		$scope.comments = estimate.comments;
		var receipt = estimate.entity.estimateReceipt;

        if(estimate.attachments) {
			estimate.attachments.forEach(function(attach) {
				attach.fileName = attach.name();
				attach.fileUrl = attach.url();
			});
			$scope.attachments = estimate.attachments;
		} else {
			$scope.attachments = [];
		}
        
        
		// create receipt if necessary,
		if(! receipt) {
			return estimateService.createEstimateReceipt(estimateId)
			.then(function(obj) {
				return obj.get('estimateReceipt');
			});
		} else {
			return Promise.resolve(receipt);
		}

	})
	.then(function(receipt) {
		$scope.templateUrl = $sce.trustAsResourceUrl(receipt.url());
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});

}

$scope.changeTemplate = function() {
	showLoader();
	$q.when(coreFactory.getInvoiceTemplates())
	.then(function(templateObjs) {
		var defaultTemplate = user.get('defaultTemplate');
		
		var templates = [];
		templateObjs.forEach(function(t) {
			var obj = {
				entity : t,
				name : t.get('name'),
				url : t.get('templatePreview').url()
			}
			if (!defaultTemplate && obj.name == 'Template 1')
				obj.isDefault = true;
			else
				obj.isDefault = (defaultTemplate.id == t.id ? true : false);

			templates.push(obj);

		});
		$scope.templates = templates;
		$('.change-template').addClass('show');
		hideLoader();

	}, function(error) {
		console.log(error.message);
		hideLoader();
	});
}

$scope.setDefaultTemplate = function(index) {
	showLoader();
	$scope.templates.forEach(function(t) {
		t.isDefault = false;
	});
	$scope.templates[index].isDefault = true;

	$scope.estimate.entity.unset('estimateReceipt');
	user.set('defaultTemplate', $scope.templates[index].entity);

	var promises = [];
	promises.push(user.save());
	promises.push($scope.estimate.entity.save());

	$q.all(promises).then(function() {
		hideLoader();
		$('.change-template').removeClass('show');
		console.log('default template selected');
		$state.reload();

	}, function(error) {
		hideLoader();
		console.log(error,message);
	});
}

$scope.textReceipt = function() {
    
    var cust = $scope.estimate.entity.get('customer')
    var email = cust.get('mobile');
    if(!email){
        ShowMessage("Please Enter Mobile for Customer!","error");
        return;
    }
    
	showLoader();
	$q.when(estimateService.sendEstimateText($scope.estimate.entity))
	.then(function(obj) {
        addNewComment('Estimate sent by text', true);
        hideLoader();
        
        $("#snackbar").addClass('show');
        setTimeout(function(){ $("#snackbar").removeClass('show'); }, 3000);
        
		console.log('Receipt sent successfully.');
		
	});
}

$scope.emailReceipt = function() {
    var cust = $scope.estimate.entity.get('customer')
    var email = cust.get('email');
    if(!email){
        ShowMessage("Please Enter Email for Customer!","error");
        return;
    }
    
	showLoader();
	$q.when(estimateService.sendEstimateReceipt($scope.estimate.entity))
	.then(function(obj) {
		console.log('Receipt sent successfully.');
        addNewComment('Estimate sent by email', true);
        hideLoader();
        
        $("#snackbar").addClass('show');
        setTimeout(function(){ $("#snackbar").removeClass('show'); }, 3000);
        
		
	}, function(error) {
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

$scope.addAttachment = function(obj) {
	var file = obj.files[0];
	if (!file) return;
    
    var n = file.name;
    
    if(!(n.endsWith('.pdf') || n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg'))){
        $('#file-error').show();
        return;
    }
    $('#file-error').hide();
	showLoader();
	var estimateObj = $scope.estimate.entity;
	var parseFile = new Parse.File(file.name, file);

	$q.when(parseFile.save())
	.then(function(fileObj) {
		var fileList = estimateObj.get('estimateFiles');
		if(fileList)
			fileList.push(fileObj)
		else
			fileList = [fileObj];

		estimateObj.set('estimateFiles', fileList);
		estimateObj.unset('estimateReceipt');
		return estimateObj.save();
	})
	.then(function(invObj) {
		$state.reload();
		hideLoader();
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

}]);