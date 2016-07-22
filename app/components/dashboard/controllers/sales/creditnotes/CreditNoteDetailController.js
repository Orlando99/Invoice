'use strict';

invoicesUnlimited.controller('CreditNoteDetailController',
	['$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
		'creditNoteService', 'coreFactory', 'currencyFilter',

function($q, $scope, $state, $sce, $controller, userFactory,
	creditNoteService, coreFactory, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

showCreditNoteDetail();

function showCreditNoteDetail() {
	var creditNoteId = $state.params.creditNoteId;
	if (! creditNoteId) return;

	showLoader();
	$q.when(creditNoteService.getCreditNoteDetails(creditNoteId))
	.then(function(creditNote) {
		console.log(creditNote);
		$scope.creditNote = creditNote;
		$scope.creditNo = creditNote.entity.creditNumber;
		$scope.comments = creditNote.comments;
		var receipt = creditNote.entity.creditReceipt;

		// create receipt if necessary,
		if(! receipt) {
			return creditNoteService.createCreditNoteReceipt(creditNoteId)
			.then(function(obj) {
				return obj.get('creditReceipt');
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

	$scope.creditNote.entity.unset('creditReceipt');
	user.set('defaultTemplate', $scope.templates[index].entity);

	var promises = [];
	promises.push(user.save());
	promises.push($scope.creditNote.entity.save());

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

}]);