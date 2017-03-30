'use strict';

invoicesUnlimited.controller('CreditNoteDetailController',
	['$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
		'creditNoteService', 'coreFactory', 'commentFactory', 'currencyFilter',

function($q, $scope, $state, $sce, $controller, userFactory,
	creditNoteService, coreFactory, commentFactory, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

    var cc = userFactory.entity[0].currency.attributes;
    
    if(cc.exchangeRate){
        $scope.currentCurrency = cc;
    }
    else{
        var temp = {
            'currencySymbol': '$',
            'exchangeRate'  : 1
        };
        $scope.currentCurrency = temp;

        cc = temp;
    }
    
    var dateFormat = undefined;
userFactory.getField('dateFormat')
.then(function(obj) {
	$scope.dateFormat = obj;
    dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
	showCreditNoteDetail();
});

function showCreditNoteDetail() {
	var creditNoteId = $state.params.creditNoteId;
	if (! creditNoteId) return;

	showLoader();
	$q.when(creditNoteService.getCreditNoteDetails(creditNoteId))
	.then(function(creditNote) {
		console.log(creditNote);
		$scope.creditNote = creditNote;
		$scope.creditNo = creditNote.entity.creditNumber;
        
        if(creditNote.payments) {
			creditNote.payments.forEach(function(payment) {
				payment.date = formatDate(payment.entity.date, dateFormat);
				payment.amount = currencyFilter(payment.entity.amount*cc.exchangeRate, cc.currencySymbol, 2);
			});
			$scope.payments = creditNote.payments;
		} else {
			$scope.payments = [];
		}
        
       if(creditNote.comments)
       {
            creditNote.comments.forEach(function(obj){
                obj.date = formatDate(obj.entity.date, dateFormat);
            });
       }
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

$scope.prepareAddPayment = function() {
	$scope.paymentDate = new Date();
	$scope.paymentAmount = $scope.creditNote.entity.remainingCredits.toFixed(2);
	$scope.paymentRef = '' + Math.random().toString(10).substr(2,6);
	$scope.paymentModes = ['Check', 'Cash', 'Bank Transfer', 'Bank Remittance'];
	$scope.selectedPaymentMode = 'Cash';

	$('#paymentForm').validate({
		rules: {
			paymentDate : 'required',
			paymentAmount : {
				required : true,
				number : true,
				min : 0.01,
                max : $scope.creditNote.entity.remainingCredits.toFixed(2)
			},
			paymentRef : 'required',
			paymentMode : 'required'
		},
        messages: {
            paymentDate : 'Please select date',
			paymentAmount : {
				required : 'Please enter refund amount',
				number : 'Please enter valid amount',
				min : 'Amount must be greater than 0',
                max : 'Amount cannot be greater than remaining credits'
			},
			paymentRef : 'Please enter reference number',
			paymentMode : 'Please select refund mode'
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
        deleted : false
	};

	var creditObj = $scope.creditNote.entity;
	creditObj.unset('creditReceipt');
	creditObj.increment('refundsMade', payment.amount);
	creditObj.increment('remainingCredits', -payment.amount);

	if(creditObj.remainingCredits <= 0)
		creditObj.set('status', 'Closed');
	else{
        creditObj.set('status', 'Open');
    }

	var promise = $q.when(coreFactory.getUserRole(user))
	promise.then(function(role) {
		return $q.when(creditNoteService.addRefunds([payment], role));
	})
	.then(function(objs) {
		var refundList = creditObj.get('refunds');
		if (refundList) {
			refundList = refundList.concat(objs);
		} else {
			refundList= objs;
		}

		creditObj.set('refunds', refundList);
		return creditObj.save();
	})
	.then(function() {
        var body = 'Refund made for '+ currencyFilter($scope.paymentAmount, '$', 2) +' amount';
        addNewComment(body, true)
        .then(function(obj){
            hideLoader();
		  $state.reload();
        });
		
	});

}

$scope.textReceipt = function() {
    
    $('#text-error').hide();
    
    var customer = $scope.creditNote.entity.get('customer');
    
    var persons = customer.get('contactPersons');

    $scope.mobileContacts = [];

    if(persons.length){
        persons.forEach(function(obj){
            var first = obj.get('firstname') ? obj.get('firstname') : '';
            var last = obj.get('lastname') ? obj.get('lastname') : '';
            var primary = obj.get('defaultPerson') == 1 ? true : false;

            var name = first + ' ' + last;
            if(obj.get('phone')){
                $scope.mobileContacts.push({
                    selected : primary,
                    contact : obj.get('phone'),
                    contactName : '('+ name + ') ' + obj.get('phone')
                });
            }

            if(obj.get('mobile')){
                $scope.mobileContacts.push({
                    selected : primary,
                    contact : obj.get('mobile'),
                    contactName : '('+ name + ') ' + obj.get('mobile')
                });
            }
        });
    }

    if($scope.mobileContacts.length){
        $('.text-popup').addClass('show');
    } else {
        ShowMessage("Please Enter Mobile for Customer!","error");
        return;
    }
    
    /*
    var cust = $scope.creditNote.entity.get('customer')
    var email = cust.get('mobile');
    if(!email){
        ShowMessage("Please Enter Mobile for Customer!","error");
        return;
    }
    
	showLoader();
	$q.when(creditNoteService.sendCreditNoteText($scope.creditNote.entity))
	.then(function(obj) {
        addNewComment('Credit Note sent by text', true);
        hideLoader();
        showSnackbar('Text sent...');
        
		console.log('Receipt sent successfully.');
		
	});
    */
}

$scope.sendText = function(){
    var email = 0;

    $scope.mobileContacts.forEach(function(obj){
        if(obj.selected)
            email++;
    });

    if(email < 1){
        $('#text-error').show();
        return;
    }
    
	showLoader();
    
    $scope.mobileContacts.forEach(function(obj){
        if(obj.selected){
            creditNoteService.sendCreditNoteTextToNumber($scope.creditNote.entity, obj.contact)
            .then(function(result){
                addNewComment('Credit Note texted to ' + obj.contact, true);
                $('.text-popup').removeClass('show');
                hideLoader();
            });
        }
    });
}

$scope.emailReceipt = function() {
    
    $('#email-error').hide();
    
    var customer = $scope.creditNote.entity.get('customer');
    
    var persons = customer.get('contactPersons');

    $scope.contacts = [];

    if(persons.length){
        persons.forEach(function(obj){
            var first = obj.get('firstname') ? obj.get('firstname') : '';
            var last = obj.get('lastname') ? obj.get('lastname') : '';
            var primary = obj.get('defaultPerson') == 1 ? true : false;

            var name = first + ' ' + last;
            if(obj.get('email')){
                $scope.contacts.push({
                    selected : primary,
                    contact : obj.get('email'),
                    contactName : '('+ name + ') ' + obj.get('email')
                });
            }
        });
    }

    if($scope.contacts.length){
        $('.email-popup').addClass('show');
    } else {
        ShowMessage("Please Enter Email for Customer!","error");
        return;
    }
    
    /*
    var cust = $scope.creditNote.entity.get('customer')
    var email = cust.get('email');
    if(!email){
        ShowMessage("Please Enter Email for Customer!","error");
        return;
    }
    
	showLoader();
	$q.when(creditNoteService.sendCreditNoteReceipt($scope.creditNote.entity))
	.then(function(obj) {
		console.log('Receipt sent successfully.');
        addNewComment('Credit Note sent by email', true);
        
		hideLoader();
        showSnackbar('Email sent...');
    
	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
    */
}

$scope.sendEmail = function(){
    var email = 0;

    $scope.contacts.forEach(function(obj){
        if(obj.selected)
            email++;
    });

    if(email < 1){
        $('#email-error').show();
        return;
    }
    
	showLoader();
    
    $scope.contacts.forEach(function(obj){
        if(obj.selected){
            creditNoteService.sendCreditNoteReceiptToEmail($scope.creditNote.entity, obj.contact)
            .then(function(result){
                addNewComment('Credit Note emailed to ' + obj.contact, true);
                $('.email-popup').removeClass('show');
                hideLoader();
            });
        }
    });
}

$scope.creditNotePrinted = function(){
    addNewComment('Credit Note printed', true);
}

function addNewComment(body, isAuto) {
	var obj = {
		userID : user,
		organization : organization,
		name : user.get('username'),
		date : new Date(),
		isAutomaticallyGenerated : isAuto,
		comment : body
	}
    
    if(!user.get('isTrackUsage') && isAuto) {
        return;
    }

	var data = {};
	return $q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return commentFactory.createNewComment(obj, role);
	})
	.then(function(obj) {
		data.commentObj = obj;
		var creditNote = $scope.creditNote.entity;
		var prevComments = creditNote.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		creditNote.set('comments', prevComments);
		return creditNote.save();
	})
	.then(function(cr) {
		var comment = new commentFactory(data.commentObj);

        comment.date = formatDate(comment.entity.date, dateFormat);
        
		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];

		console.log(comment);
        return cr;
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
		var creditNote = $scope.creditNote.entity;
		var prevComments = creditNote.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		creditNote.set('comments', prevComments);
		return creditNote.save();
	})
	.then(function() {
		var comment = new commentFactory(data.commentObj);

        comment.date = formatDate(comment.entity.date, dateFormat);
        
		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];

		console.log(comment);
		$('.add-comment').removeClass('show');
		$scope.newComment = '';
		hideLoader();
	});

}

}]);