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

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
var dateFormat = undefined;
userFactory.getField('dateFormat')
.then(function(obj) {
	$scope.dateFormat = obj;
    dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
	showInvoiceDetail();
});

function showInvoiceDetail() 
{
    scrollToOffset();
	var invoiceId = $state.params.invoiceId;
	if (! invoiceId) return;

	showLoader();
	$q.when(invoiceService.getInvoiceDetails(invoiceId))
	.then(function(invoice) {
	//	console.log(invoice);
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		$scope.invoice = invoice;
		$scope.invoiceNo = invoice.entity.invoiceNumber;
        
        if(invoice.comments){
            invoice.comments.forEach(function(obj){
                obj.date = formatDate(obj.entity.date, dateFormat);
            });
        }
        
		$scope.comments = invoice.comments;
        $scope.invoiceInfo = invoice.entity.invoiceInfo;
        
        if(invoice.entity.balanceDue > 0){
            
        }
        
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
                attach.fileName1 = attach.fileName.substring(attach.fileName.indexOf("_") + 1 , attach.fileName.length);
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
            if(!info)
            {
                return invoiceService.copyInInvoiceInfo(invoice.entity)
                .then(function(infoObj){
                    info = infoObj.id;
                    return invoiceService.createInvoiceReceipt(invoiceId,info)
                    .then(function(obj) {
                        return obj.get('invoiceReceipt');
                    });
                });
            }
            else {
                return invoiceService.createInvoiceReceipt(invoiceId,info)
                .then(function(obj) {
                    return obj.get('invoiceReceipt');
                });
            }
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
    
$scope.invoicePrinted = function(){
    //debugger;
    //invoiceService.downloadInvoiceReceipt($scope.invoice.entity);
    
    addNewComment('Invoice printed', true);
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

$scope.cloneInvoice = function() {
    
    $q.when(addNewComment('Invoice cloned', true))
    .then(function(){
        $state.go('dashboard.sales.invoices.clone', {'invoiceId':$scope.invoice.entity.id });
    });
    
}

$scope.editInvoice = function(){
    $state.go('dashboard.sales.invoices.edit', {'invoiceId':$scope.invoice.entity.id });
}

$scope.showAvailableCredits = function() 
{
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
        var due = invoiceObj.get('dueDate');
        var today = new Date();
        if(due > today)
            invoiceObj.set('status', 'Partial Paid');
        else
            invoiceObj.set('status', 'Overdue');
		
	}

	invoiceObj.set('balanceDue', due);
    if(invoiceObj.creditApplied)
	   invoiceObj.set('creditApplied', invoiceObj.creditApplied + credits);
    else
        invoiceObj.set('creditApplied', credits);
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
        
        var body = 'Credit Note applied for '+ currencyFilter($scope.creditUsed, '$', 2) +' amount';
        addCreditComment(body, true);
        
		//hideLoader();
		//console.log('Saved successfully');
		//$state.reload();
        //window.location.reload();
	});
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
	}
}

$scope.prepareAddPayment = function() {
	$scope.paymentDate = new Date();
	$scope.paymentAmount = $scope.invoice.entity.balanceDue.toFixed(2);
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
                max : $scope.paymentAmount
			},
			paymentRef : 'required',
			paymentMode : 'required'
		},
        messages: {
            paymentDate : 'Please select date',
			paymentAmount : {
				required : 'Please enter payment amount',
				number : 'Please enter valid amount',
				min : 'Amount must be greater than 0',
                max : 'Amount cannot be greater than balance due'
			},
			paymentRef : 'Please enter reference number',
			paymentMode : 'Please select payment mode'
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
	else{
		var due = invoiceObj.get('dueDate');
        var today = new Date();
        if(due > today)
            invoiceObj.set('status', 'Partial Paid');
        else
            invoiceObj.set('status', 'Overdue');
    }

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
        var body = 'Payment made for '+ currencyFilter($scope.paymentAmount, '$', 2) +' amount';
        addNewComment(body, true)
        .then(function(obj){
            hideLoader();
		  $state.reload();
        });
		
	});

}

$scope.showPaymentDetail = function(index) {
	$scope.selectedPayment = $scope.payments[index];
	var payment = $scope.selectedPayment.entity;
	var mode = payment.mode;
	var refunded = payment.deleted;
    
    if ( !refunded )
		$scope.selectedPayment.disableRefund = false;
	else
		$scope.selectedPayment.disableRefund = true;

    /*
	if ( !refunded && (mode == 'Cash' || mode == 'Check') )
		$scope.selectedPayment.disableRefund = false;
	else
		$scope.selectedPayment.disableRefund = true;
        */
}

$scope.refundPayment = function(){
    $('.confirm-refund').addClass('show');
}

$scope.doRefundPayment = function() {
	var mode = $scope.selectedPayment.entity.mode;
	var refunded = $scope.selectedPayment.entity.deleted;
    
    if(refunded)
        return;
    
    if(mode == 'Credit Card'){
        var info = $scope.invoiceInfo;
        var tansId = info.get('paymentStatus');
        tansId = tansId.split(',');
        tansId = tansId[tansId.length - 1];
        tansId = tansId.replace(/\"/g, "");
        
        var account = user.get('EPNusername');
        var restrictKey = user.get('EPNrestrictKey');
        var am = $scope.selectedPayment.entity.get('amount');
        
        var url = "refund.php";
        var data = {
            'HTML'        : 'No',
            'ePNAccount'  : account,
            'RestrictKey' : restrictKey,
            'TransID'     : tansId,
            'TranType'    : 'Return',
            'Total'       : am
        };
        
        var data1 = Object.assign({},data,{
                    
                });
        
        showLoader();
        $.ajax({
            method:"GET",
            url: url,
            data: data1,
            complete:function(data){
                console.log("Reguest is done: " + data);
            },
            error: function(data){
                alert("ERROR: " + data);
            },
            success:function(data){
                debugger;
                
                var response = data.match(/[^,]+/g);
                
                //showLoader();
                
                if(response.length){
                    var payment = $scope.selectedPayment.entity;
                    payment.set('deleted', true);
                    
                    var info = $scope.invoiceInfo;
                    info.set('paymentStatus', data);

                    var invoiceObj = $scope.invoice.entity;
                    invoiceObj.unset('invoiceReceipt');
                    invoiceObj.increment('paymentMade', -payment.amount);
                    invoiceObj.increment('balanceDue', payment.amount);

                    if (invoiceObj.get('paymentMade') <= 0)
                        invoiceObj.set('status', 'Refunded');
                    else
                        invoiceObj.set('status', 'Partial Refunded');

                    var promises = [];
                    promises.push(payment.save());
                    promises.push(invoiceObj.save());
                    promises.push(info.save());

                    var body = 'Refund made for '+ currencyFilter(payment.amount, '$', 2) +' amount';
                    promises.push(addNewComment(body, true));
                    
                    $q.all(promises)
                    .then(function() {
                        hideLoader();
                        $state.reload();
                    });
                }
                
            }
        });
        
    }
    
    if(mode == 'Credit Note'){
        refundCredit();
        return;
    }
    
	if ( refunded || (mode != 'Cash' && mode != 'Check' && mode != 'Bank Transfer' && mode != 'Bank Remittance') ) return;

	showLoader();
	var payment = $scope.selectedPayment.entity;
	payment.set('deleted', true);

	var invoiceObj = $scope.invoice.entity;
	invoiceObj.unset('invoiceReceipt');
	invoiceObj.increment('paymentMade', -payment.amount);
	invoiceObj.increment('balanceDue', payment.amount);

	if (invoiceObj.get('paymentMade') <= 0)
		invoiceObj.set('status', 'Refunded');
	else
		invoiceObj.set('status', 'Partial Refunded');

	var promises = [];
	promises.push(payment.save());
	promises.push(invoiceObj.save());

    var body = 'Refund made for '+ currencyFilter(payment.amount, '$', 2) +' amount';
    promises.push(addNewComment(body, true));
        
	$q.all(promises)
	.then(function() {
		hideLoader();
		$state.reload();
	});
}

function refundCredit(){
    showLoader();
    
	var payment = $scope.selectedPayment.entity;
    var note = payment.get('creditNote');
    
    $q.when(note.fetch())
    .then(function(obj){
        var used = note.get('creditsUsed');
        var remaining = note.get('remainingCredits');

        note.set('creditsUsed', used - payment.amount);
        note.set('remainingCredits', remaining + payment.amount);

        if(note.get('status') == 'Closed'){
            note.set('status', 'Open');
        }
        
        payment.set('deleted', true);

        var invoiceObj = $scope.invoice.entity;
        invoiceObj.unset('invoiceReceipt');
        invoiceObj.increment('paymentMade', -payment.amount);
        invoiceObj.increment('balanceDue', payment.amount);

        if (invoiceObj.get('paymentMade') <= 0)
            invoiceObj.set('status', 'Refunded');
        else
            invoiceObj.set('status', 'Partial Refunded');

        var promises = [];
        promises.push(payment.save());
        promises.push(note.save());
        promises.push(invoiceObj.save());

        var body = 'Refund made for '+ currencyFilter(payment.amount, '$', 2) +' amount';
        promises.push(addNewComment(body, true));

        $q.all(promises)
        .then(function() {
            hideLoader();
            $state.reload();
        });
        
    });
    
    
}
 
$scope.addAttachment = function(obj) {
	var file = obj.files[0];
	if (!file) return;
    var n = file.name;
    
    if(!(n.toLowerCase().endsWith('.pdf') || n.toLowerCase().endsWith('.png') || n.toLowerCase().endsWith('.jpg') || n.toLowerCase().endsWith('.jpeg'))){
        $('#file-error').show();
        return;
    }
    $('#file-error').hide();

    if(n.toLowerCase().indexOf("^") >= 0)
    {
        n =  n.replace("^", "");
        
    } 
     var fileSizeinBytes = obj.files[0].size;
     if(fileSizeinBytes > 5242880 )
     {
        $('#file-size-error').show();    
        return;
     }
     $('#file-size-error').hide();
        
    showLoader();
    
	var invoiceObj = $scope.invoice.entity;
	var parseFile = new Parse.File(n, file);

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
        addNewComment('File Attached', true)
        .then(function(invObj){
            $state.reload();
            hideLoader();
        });
	});
}
 
$scope.textReceipt = function() {
    
    $('#text-error').hide();
    
    var customer = $scope.invoice.entity.get('customer');
    
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
    
    if($scope.invoice.entity.get('status') == 'Draft')
    {  
        var dueDate = $scope.invoice.entity.get('dueDate');
        var toDate = new Date();
        if(dueDate<toDate)
        {
           $scope.invoice.entity.set('status', 'Overdue');
        }
        else
        {
           $scope.invoice.entity.set('status', 'Sent');              
        }
        $scope.invoice.entity.save();   
    }
    
    $scope.mobileContacts.forEach(function(obj){
        if(obj.selected){
            invoiceService.sendInvoiceTextToNumber($scope.invoice.entity, obj.contact)
            .then(function(result){
                addNewComment('Invoice texted to ' + obj.contact, true);
                $('.text-popup').removeClass('show');
                hideLoader();
            });
        }
    });
}

$scope.emailReceipt = function() {
    $('#email-error').hide();
    
    var customer = $scope.invoice.entity.get('customer');
    
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
    
    if($scope.invoice.entity.get('status') == 'Draft')
    {  
        var dueDate = $scope.invoice.entity.get('dueDate');
        var toDate = new Date();
        if(dueDate<toDate)
        {
           $scope.invoice.entity.set('status', 'Overdue');
        }
        else
        {
           $scope.invoice.entity.set('status', 'Sent');              
        }
        $scope.invoice.entity.save();   
    }
    
    $scope.contacts.forEach(function(obj){
        if(obj.selected){
            invoiceService.sendInvoiceReceiptToEmail($scope.invoice.entity, obj.contact)
            .then(function(result){
                addNewComment('Invoice emailed to ' + obj.contact, true);
                $('.email-popup').removeClass('show');
                hideLoader();
            });
        }
    });
    
    
    //showSnackbar('Email sent...');
    
    /*
	$q.when(invoiceService.sendInvoiceReceipt($scope.invoice.entity))
	.then(function(obj) {
        if($scope.invoice.entity.get('status') == 'Draft')
        {  
            //  $scope.invoice.entity.set('status', 'Sent');
            var dueDate = $scope.invoice.entity.get('dueDate');
            var toDate = new Date();
            if(dueDate<toDate)
            {
               $scope.invoice.entity.set('status', 'Overdue');
            }
            else
            {
               $scope.invoice.entity.set('status', 'Sent');              
            }
            $scope.invoice.entity.save();   
        }
        addNewComment('Invoice emailed to ' + email, true);
        hideLoader();
        showSnackbar('Email sent...');
		console.log('Receipt sent successfully.');
		
	});
    */
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

function addNewComment(commentbody, isAuto){
    var obj = {
		userID : user,
		organization : organization,
		name : user.get('username'),
		date : new Date(),
		isAutomaticallyGenerated : isAuto,
		comment : commentbody
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
		var invoice = $scope.invoice.entity;
		var prevComments = invoice.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		invoice.set('comments', prevComments);
		return invoice.save();
	})
	.then(function(obj) {
		var comment = new commentFactory(data.commentObj);

        comment.date = formatDate(comment.entity.date, dateFormat);
        
		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];
        
        //$scope.$apply();
        return obj;
        
		console.log(comment);
	});
}
    
function addCreditComment(commentbody, isAuto){
    var obj = {
		userID : user,
		organization : organization,
		name : user.get('username'),
		date : new Date(),
		isAutomaticallyGenerated : isAuto,
		comment : commentbody
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
		var invoice = $scope.invoice.entity;
		var prevComments = invoice.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		invoice.set('comments', prevComments);
		return invoice.save();
	})
	.then(function(obj) {
		var comment = new commentFactory(data.commentObj);

        comment.date = formatDate(comment.entity.date, dateFormat);
        
		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];
        
        //$scope.$apply();
        hideLoader();
        $state.reload();
        return obj;
        
		console.log(comment);
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

        comment.date = formatDate(comment.entity.date, dateFormat);
        
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
