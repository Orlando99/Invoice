'use strict';

invoicesUnlimited.controller('InvoiceDetailController',
	['$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
		'invoiceService', 'creditNoteService', 'coreFactory',
		'commentFactory', 'currencyFilter',

function($q, $scope, $state, $sce, $controller, userFactory,
	invoiceService, creditNoteService, coreFactory, commentFactory, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}
    
    var cc = userFactory.entity[0].currency.attributes;
    
    $scope.currentCurrency = cc;

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

userFactory.getField('dateFormat')
.then(function(obj) {
	$scope.dateFormat = obj;
	showInvoiceDetail();
});

function showInvoiceDetail() {
	var invoiceId = $state.params.invoiceId;
	if (! invoiceId) return;

	showLoader();
	$q.when(invoiceService.getInvoiceDetails(invoiceId))
	.then(function(invoice) {
	//	console.log(invoice);
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		$scope.invoice = invoice;
		$scope.invoiceNo = invoice.entity.invoiceNumber;
		$scope.comments = invoice.comments;

		if(invoice.payments) {
			invoice.payments.forEach(function(payment) {
				payment.date = formatDate(payment.entity.date, dateFormat);
				payment.amount = currencyFilter(payment.entity.amount*cc.exchangeRate, cc.currencySymbol, 2);
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

$scope.showAvailableCredits = function() {
	showLoader();
	$q.when(creditNoteService.getCustomerCreditNotes(
		$scope.invoice.entity.get('customer')))
	.then(function(objs) {
		$scope.creditNotes = objs;
		var total = 0;
		objs.forEach(function(obj) {
			total += obj.entity.remainingCredits;
		});
		$scope.totalCredit = total;
		$scope.balanceDue = $scope.invoice.entity.get('balanceDue');
		$scope.totalCreditStr = currencyFilter(total*cc.exchangeRate, cc.currencySymbol, 2);
		$scope.balanceDueStr = currencyFilter($scope.balanceDue*cc.exchangeRate, cc.currencySymbol, 2);
		$scope.creditUsed = $scope.balanceDue > total ?
			total : $scope.balanceDue;
		
		var remaining = total - $scope.balanceDue;
		remaining = remaining > 0 ? remaining : 0;
		$scope.remainingCreditStr = currencyFilter(remaining*cc.exchangeRate, cc.currencySymbol, 2);

		var smaller = $scope.totalCredit > $scope.balanceDue ?
			$scope.balanceDue : $scope.totalCredit;
		
		$('#applyCreditForm').validate({
			rules: {
				usedCredit : {
					required : true,
					number : true,
					min : 0.01,
					max : smaller
				}
			}
		});
		$('#applyCreditForm').validate().resetForm();
		$('.apply-credit').addClass('show');
	//	console.log($('[name="usedCredit"]').rules());

		hideLoader();
	});

}

$scope.applyCredit = function() {

	if(! $('#applyCreditForm').valid()) {
		return;
	}

	showLoader();
	// sort in ascending order
	$scope.creditNotes = $scope.creditNotes.sort(function(a,b) {
		return a.entity.remainingCredits - b.entity.remainingCredits;
	});
	
	var crNotes = [];
	var payments = [];
	var objs = $scope.creditNotes;
	var credits = $scope.creditUsed;

	for(var i=0; i < objs.length; ++i) {
		if (credits <= 0) break;

		var remaining = objs[i].entity.remainingCredits;
		var usedAlready = objs[i].entity.creditsUsed;
		var creditObj = objs[i].entity;
		var contribution = 0;

		if (remaining <= credits) {
			credits -= remaining;
			contribution = remaining;
			creditObj.set('creditsUsed', usedAlready + remaining);
			creditObj.set('remainingCredits', 0);
			creditObj.set('status', 'Closed');

		} else {
			remaining -= credits;
			contribution = credits;
			creditObj.set('creditsUsed', usedAlready + credits);
			creditObj.set('remainingCredits', remaining);
			credits = 0;
		}

		creditObj.unset('creditReceipt');
		crNotes.push(creditObj);

		payments.push({
			userID : user,
			organization : organization,
			creditNote : creditObj,
			date : new Date(),
			mode : 'Credit Note',
			amount : contribution,
			reference : creditObj.creditNumber
		});
	}

	credits = $scope.creditUsed;
	var invoiceObj = $scope.invoice.entity;
	var due = invoiceObj.balanceDue - credits;
	
	due = due <= 0.001 ? 0 : due;
	if(! due) {
		invoiceObj.set('status', 'Paid');
	} else {
		invoiceObj.set('status', 'Partial Paid');
	}

	invoiceObj.set('balanceDue', due);
	invoiceObj.set('creditApplied', invoiceObj.creditApplied + credits);
	invoiceObj.unset('invoiceReceipt');

	var promises = [];
	promises.push(Parse.Object.saveAll(crNotes));

	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return invoiceService.addPayments(payments, role);
	})
	.then(function(payObjs) {
		var paymentList = invoiceObj.get('payment');
		if (paymentList) {
			paymentList = paymentList.concat(payObjs);
		} else {
			paymentList = payObjs;
		}

		invoiceObj.set('payment', paymentList);
		promises.push(invoiceObj.save());
		return $q.all(promises);
	})
	.then(function() {
		hideLoader();
		console.log('Saved successfully');
		$state.reload();
	});
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}

$scope.prepareAddPayment = function() {
	$scope.paymentDate = new Date();
	$scope.paymentAmount = $scope.invoice.entity.balanceDue;
	$scope.paymentRef = '' + Math.random().toString(10).substr(2,6);
	$scope.paymentModes = ['Check', 'Cash', 'Bank Transfer', 'Bank Remittance'];
	$scope.selectedPaymentMode = 'Cash';

	$('#paymentForm').validate({
		rules: {
			paymentDate : 'required',
			paymentAmount : {
				required : true,
				number : true,
				min : 0.01
			},
			paymentRef : 'required',
			paymentMode : 'required'
		}
	});
	$('#paymentForm').validate().resetForm();
}

$scope.addPayment = function() {
	if (! $('#paymentForm').valid()) return;

	showLoader();
	var payment = {
		userID : user,
		organization : organization,
		date : $scope.paymentDate,
		mode : $scope.selectedPaymentMode,
		amount : Number($scope.paymentAmount),
		reference : $scope.paymentRef,
		notes : $scope.paymentNotes,
	};

	var invoiceObj = $scope.invoice.entity;
	invoiceObj.unset('invoiceReceipt');
	invoiceObj.increment('paymentMade', payment.amount);
	invoiceObj.increment('balanceDue', -payment.amount);

	if(invoiceObj.balanceDue <= 0)
		invoiceObj.set('status', 'Paid');
	else
		invoiceObj.set('status', 'Partial Paid');

	var promise = $q.when(coreFactory.getUserRole(user))
	promise.then(function(role) {
		return $q.when(invoiceService.addPayments([payment], role));
	})
	.then(function(objs) {
		var paymentList = invoiceObj.get('payment');
		if (paymentList) {
			paymentList = paymentList.concat(objs);
		} else {
			paymentList= objs;
		}

		invoiceObj.set('payment', paymentList);
		return invoiceObj.save();
	})
	.then(function() {
		hideLoader();
		$state.reload();
	});

}

$scope.showPaymentDetail = function(index) {
	$scope.selectedPayment = $scope.payments[index];
	var payment = $scope.selectedPayment.entity;
	var mode = payment.mode;
	var refunded = payment.deleted

	if ( !refunded && (mode == 'Cash' || mode == 'Check') )
		$scope.selectedPayment.disableRefund = false;
	else
		$scope.selectedPayment.disableRefund = true;
}

$scope.refundPayment = function() {
	var mode = $scope.selectedPayment.entity.mode;
	var refunded = $scope.selectedPayment.entity.deleted;
	if ( refunded || (mode != 'Cash' && mode != 'Check') ) return;

	showLoader();
	var payment = $scope.selectedPayment.entity;
	payment.set('deleted', true);

	var invoiceObj = $scope.invoice.entity;
	invoiceObj.unset('invoiceReceipt');
	invoiceObj.increment('paymentMade', -payment.amount);
	invoiceObj.increment('balanceDue', payment.amount);

	if (invoiceObj.paymentMade <= 0)
		invoiceObj.set('status', 'Refunded');
	else
		invoiceObj.set('status', 'Partial Refunded');

	var promises = [];
	promises.push(payment.save());
	promises.push(invoiceObj.save());

	$q.all(promises)
	.then(function() {
		hideLoader();
		$state.reload();
	});
}

$scope.addAttachment = function(obj) {
	var file = obj.files[0];
	if (!file) return;

	showLoader();
	var invoiceObj = $scope.invoice.entity;
	var parseFile = new Parse.File(file.name, file);

	$q.when(parseFile.save())
	.then(function(fileObj) {
		var fileList = invoiceObj.get('invoiceFiles');
		if(fileList)
			fileList.push(fileObj)
		else
			fileList = [fileObj];

		invoiceObj.set('invoiceFiles', fileList);
		invoiceObj.unset('invoiceReceipt');
		return invoiceObj.save();
	})
	.then(function(invObj) {
		$state.reload();
		hideLoader();
	});
}

$scope.emailReceipt = function() {
	showLoader();
	$q.when(invoiceService.sendInvoiceReceipt($scope.invoice.entity))
	.then(function(obj) {
		console.log('Receipt sent successfully.');
		hideLoader();
	});
}

$scope.canDeleteInvoice = function() {
	if ($scope.invoice.entity.get('payment'))
		$('.cannot-delete').addClass('show');
	else
		$('.confirm-delete').addClass('show');
}

$scope.deleteInvoice = function() {
	if ($scope.invoice.entity.get('payment')) {
		console.log('invoice cannot be deleted, it contains payments');
		return;
	}

	showLoader();
	var invoice = $scope.invoice.entity;
	var children = [];
	var x = undefined;

	['comments', 'invoiceItems']
	.forEach(function(field) {
		x = invoice.get(field);
		if(x) children = children.concat(x);
	});

	['invoiceInfo', 'lateFee']
	.forEach(function(field) {
		x = invoice.get(field);
		if(x) children.push(x);
	});

	Parse.Object.destroyAll(children)
	.then(function() {
		return invoice.destroy();
	})
	.then(function() {
		hideLoader();
		$state.go('dashboard.sales.invoices.all');
	});

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
		var invoice = $scope.invoice.entity;
		var prevComments = invoice.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		invoice.set('comments', prevComments);
		return invoice.save();
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
