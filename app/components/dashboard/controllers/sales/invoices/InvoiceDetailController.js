'use strict';

invoicesUnlimited.controller('InvoiceDetailController',
	['$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
		'invoiceService', 'coreFactory', 'currencyFilter',

function($q, $scope, $state, $sce, $controller, userFactory,
	invoiceService, coreFactory, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

showInvoiceDetail();

function showInvoiceDetail() {
	var invoiceId = $state.params.invoiceId;
	if (! invoiceId) return;

	showLoader();
	$q.when(invoiceService.getInvoiceDetails(invoiceId))
	.then(function(invoice) {
		console.log(invoice);
		$scope.invoice = invoice;
		$scope.invoiceNo = invoice.entity.invoiceNumber;
		$scope.comments = invoice.comments;

		if(invoice.payments) {
			invoice.payments.forEach(function(payment) {
				payment.date = formatDate(payment.entity.date, "MM/DD/YYYY");
				payment.amount = currencyFilter(payment.entity.amount, '$', 2);
			});
			$scope.payments = invoice.payments;
		} else {
			$scope.payments = [];
		}

		if(invoice.attachments) {
			invoice.attachments.forEach(function(attach) {
				attach.fileName = attach.name();
				attach.fileUrl = attach.url();
			});
			$scope.attachments = invoice.attachments;
		} else {
			$scope.attachments = [];
		}

		var receipt = invoice.entity.invoiceReceipt;
		var info = invoice.entity.invoiceInfo;
		if (info) info = info.id;

		// create invoice receipt if necessary,
		if(! receipt) {
			return invoiceService.createInvoiceReceipt(invoiceId,info)
			.then(function(obj) {
				return obj.get('invoiceReceipt');
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

	$scope.invoice.entity.unset('invoiceReceipt');
	user.set('defaultTemplate', $scope.templates[index].entity);

	var promises = [];
	promises.push(user.save());
	promises.push($scope.invoice.entity.save());

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
