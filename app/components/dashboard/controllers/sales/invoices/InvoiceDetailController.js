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

$scope.isOwner = false;
	
function showInvoiceDetail() 
{
    scrollToOffset();
	var invoiceId = $state.params.invoiceId;
	if (! invoiceId) return;

	showLoader();
	$q.when(invoiceService.getInvoiceDetails(invoiceId))
	.then(function(invoice) {
		var usr = invoice.entity.get('userID');
		
		if(userFactory.entity[0].get('role') == 'Staff'){
			if(userFactory.entity[0].id == usr.id)
				$scope.isOwner = true;
		} else {
			$scope.isOwner = true;
		}
		
		
		debugger;
		
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
        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
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
        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
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
                        $('.confirm-refund').removeClass('show');
                        $('.refund-payment').removeClass('show');

                        showSnackbar("Payment Refunded");
                        hideLoader();
                        setTimeout(function(){ 
                            $state.reload();
                        }, 2000);
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
        $('.confirm-refund').removeClass('show');
        $('.refund-payment').removeClass('show');
        
        showSnackbar("Payment Refunded");
        hideLoader();
        setTimeout(function(){ 
            $state.reload();
        }, 2000);
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
            $('.confirm-refund').removeClass('show');
            $('.refund-payment').removeClass('show');

            showSnackbar("Payment Refunded");
            hideLoader();
            setTimeout(function(){ 
                $state.reload();
            }, 2000);
        });
        
    });
    
    
}
 
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function getFileExtension(filename){
    return '.' + filename.split('.').pop();
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

    n = 'Attachment ' + addZero($scope.attachments.length + 1) + getFileExtension(n);
    
     var fileSizeinBytes = obj.files[0].size;
     if(fileSizeinBytes > 5242880 )
     {
        $('#file-size-error').show();    
        return;
     }
     $('#file-size-error').hide();
        
    showLoader();
    
	var invoiceObj = $scope.invoice.entity;
	//var parseFile = new Parse.File(n, file);
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
                    selected : false,
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
    
    if($scope.invoice.entity.get('status') == 'Draft' || $scope.invoice.entity.get('status') == 'Sent')
    {  
        var dueDate = $scope.invoice.entity.get('dueDate');
        var toDate = new Date();
        dueDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
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
    
    if($scope.invoice.entity.get('status') == 'Draft' || $scope.invoice.entity.get('status') == 'Sent')
    {  
        var dueDate = $scope.invoice.entity.get('dueDate');
        var toDate = new Date();
        dueDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
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

$scope.downloadInvoice = function(){
    var url = $scope.invoice.entity.get('invoiceLabels')._url;
    debugger;
    
    var Connect = new XMLHttpRequest();

    Connect.open("GET", url, false);

    Connect.setRequestHeader("Content-Type", "text/xml");
    Connect.send(null);
    
    updatePage(Connect.responseXML);
}

function updatePage(dataTable){
            var itemRows = $(dataTable).find('itemRow');
            var modsRow = $(dataTable).find('modsRow');
            var attachments = $(dataTable).find('attachment');
            var customFields = $(dataTable).find('customField');
            var taxes = $(dataTable).find('tax');
            var td = $('<td></td>');

            if ($(dataTable).find('billType').text().includes('estimate')){
                $('.footer .info').hide()
                $('.payment-due').hide()
            }
            
            
            if (!/^[\s]*$/.test(itemRows.first().find('discount').text())) {
                $('#invoice-items-header').append('<td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; font-size: 16px; vertical-align: middle; /*background: #317cf4;*/ padding-left: 14pt;">Item</td> <td class="ff1 fc0 btm-line top-line" colspan="1" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/">Quantity</td> <td class="ff1 fc0 btm-line top-line" colspan="1" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/">Discount</td> <td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/ padding-right: 14pt;">Amount</td>');
                
            } else {
                $('#invoice-items-header').append('<td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; font-size: 16px; vertical-align: middle; /*background: #317cf4;*/ padding-left: 14pt;">Item</td> <td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/">Quantity</td> <td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/ padding-right: 14pt;">Amount</td>');
            }
            
            itemRows.each(function(funcOne){
                
                if (!/^[\s]*$/.test(itemRows.first().find('discount').text())) {
                    var item = $("<tr class='invoice-items'></tr>");
                    var itemTitle = $("<td class='ff1 fc0 invoice-item-title' colspan='2'>"+ $(this).children('name').text() +"</td>");
                    var itemQty = $("<td class='ff1 fc0  invoice-item-qty' colspan='1'>"+ $(this).children('qty').text() +"</td>");
                    var itemDiscount = $("<td class='ff1 fc0  invoice-item-qty' colspan='1'>"+ $(this).children('discount').text() +"</td>");
                    var itemCost = $("<td class='ff1 fc0  invoice-item-cost' colspan='2'>"+ $(this).children('price').text() +"</td>");
                    item.append(itemTitle)
                        .append(itemQty)
                        .append(itemDiscount)
                        .append(itemCost);
                    $('#invoice-items-header').after($(item));
                }
                else {
                    var item = $("<tr class='invoice-items'></tr>");
                    var itemTitle = $("<td class='ff1 fc0 invoice-item-title' colspan='2'>"+ $(this).children('name').text() +"</td>");
                    var itemQty = $("<td class='ff1 fc0  invoice-item-qty' colspan='2'>"+ $(this).children('qty').text() +"</td>");
                    var itemCost = $("<td class='ff1 fc0  invoice-item-cost' colspan='2'>"+ $(this).children('price').text() +"</td>");
                    item.append(itemTitle)
                        .append(itemQty)
                        .append(itemCost);
                    $('#invoice-items-header').after($(item));
                }
            });
            
            taxes.each(function() {
                
                var item = $("<tr class='invoice-taxes'></tr>");
                var blank = $("<td colspan='3' class=''></td>");
                var itemTitle = $("<td class='ff1 fc1 ' colspan='2' style = 'padding-bottom: 4mm; vertical-align: middle; font-size: 16px;'>" + $(this).children('name').text() +"</td>");
                var itemCost = $("<td class='ff1 fc1 ' style='padding-bottom: 4mm; text-align: right; vertical-align: middle; font-size: 16px;'>" + $(this).children('value').text() +"</td>");
                item.append(blank)
                    .append(itemTitle)
                    .append(itemCost);
                $('#invoice-subtotal').after($(item));
                
            });

            var tr = $('<tr class="salestax"></tr>');
            $('tr.adjustments').after(tr);
            
            customFields.each(function() {
                var tr = $('.customFields');
                
                tr.append($('<div class="info-1" style="margin: 0;border: 0;font-size: 100%;font: inherit;float: left;box-sizing: border-box;width: 70%; float: left; margin-left: 3%;margin-left: 0px"><p class="" style="margin: 0;padding: 10px 0px 0px 0px;border: 0;font-size: 16px;vertical-align: baseline;line-height: 30px;margin-bottom: 10px;color: #989898;">' + $(this).children('name').text() + '</p><p class="" style="margin: 0;padding: 0;border: 0;font-size: 16px;margin-bottom: 10px;color: #000;">' + $(this).children('value').text() + '</p></div>'));
            });
            
            attachments.each(function() {
                var fileName = $(this).text();
                fileName = fileName.substring(fileName.indexOf("_") + 1 , fileName.length);
                fileName = fileName.replace(/%20/g, " ");
                $('.attach').append('<a style="color: #989898" target="_blank" href=\'' + $(this).text() + '\'>' + fileName + '</a><br><br>');
            });

            $('table tbody tr').each(function(){
                if($(this).children().text().length == 0){
                    $(this).addClass('hideOnMob');
                }
            });
            

            var invoiceId = $(dataTable).find('invoiceId').text();
            $('#pay-link').attr('href',"https://invoicesunlimited.net/pay/?InvoiceInfoID="+invoiceId);
            $('#pay-link-2').attr('href',"https://invoicesunlimited.net/pay/?InvoiceInfoID="+invoiceId);

            var labels = $(dataTable).find('items');
            console.log(labels);
            labels.each(function(){

				var dueTime = new Date(Date.parse($(this).find('past-due').text()));
				var now = new Date(Date.now());
				dueTime = new Date(dueTime.setHours(0,0,0,0));
				now = new Date(dueTime.setHours(0,0,0,0));
				if (dueTime.getTime() >= now.getTime() || dueTime.toString() === "Invalid Date") {
					$('.payment-due p:last').append($(this).find('past-due').text());
					$('.payment-due').addClass('green-status');
				} else {
					$('.payment-due p:last').append($(this).find('past-due').text());
					$('.payment-due').addClass('red-status');
				}

				var headerTitle = $(this).find('headerTitle').text();
				$('.payment-due p:first').append(headerTitle);

				var disablePay = $(this).find('disablePay').text();
				var disable = 'true'

				if (disable === disablePay) {
					$('.btn-border-pay').addClass('disable');
					$('.info.cl').addClass('disable');
					$('.payment-due').removeClass('red-status');
					$('.payment-due').addClass('green-status');
				} 

				var discountAmount = $(this).find('discountAmount').text();

				var tr = $('<tr class="discount"></tr>');
				tr.append($('<td class="discountNm" colspan="3"></td>').html('Discount'));
				// tr.append($('<td colspan="1"></td>'));
				tr.append($('<td class="discountPr"></td>').html(discountAmount));

				if ($(this).find('discountPlace text').text() == 'after') {
					$('.salestax:last').after(tr);
				} else if ($(this).find('discountPlace text').text() == 'before') {
					$('.salestax:first').before(tr);
				}

				var item = $("<tr class='invoice-adjustments'><td colspan='3' class=''></td><td class='ff1 fc1' colspan='2' style = 'padding-bottom: 4mm; vertical-align: middle; font-size: 16px;'>" + $(this).find('discountNameBottom').text() + "</td><td class='ff1 fc1 ' style='padding-bottom: 4mm; text-align: right; vertical-align: middle; font-size: 16px;'>" + $(this).find('discountAmount').text() +"</td></tr>");

				if($(this).find('discountPlace text').text() == 'after'){
					$('.invoice-taxes:last').after($(item));
				} 
				else if($(this).find('discountPlace text').text() == 'before'){
					$('#invoice-subtotal').after($(item));
				}

				if($(this).find('adjustments').text().length > 0){
					var item = $("<tr class='invoice-adjustments'><td colspan='3' class=''></td><td class='ff1 fc1' colspan='2' style = 'padding-bottom: 4mm; vertical-align: middle; font-size: 16px;'>" + $(this).find('adjustments').text() + "</td><td class='ff1 fc1 ' style='padding-bottom: 4mm; text-align: right; vertical-align: middle; font-size: 16px;'>" + $(this).find('adjustmentsPrice').text() +"</td></tr>");
					$('#invoice-subtotal').after($(item));
				}

				if($(this).find('shippingCharges').text().length > 0){
					item = $("<tr class='invoice-adjustments'><td colspan='3' class=''></td><td class='ff1 fc1 ' colspan='2' style = 'padding-bottom: 4mm; vertical-align: middle; font-size: 16px;'>" + $(this).find('shippingCharges').text() + "</td><td class='ff1 fc1 ' style=' padding-bottom: 4mm;text-align: right; vertical-align: middle; font-size: 16px;'>" + $(this).find('shippingChargesPrice').text() +"</td></tr>");

					$('#invoice-subtotal').after($(item));
				}

				$('#pdf-business-name').text(userFactory.entity[0].get('company'));
				$('#pdf-invoice-title').text($(this).find('invoice-title').text());
				$('#pdf-invoice-number').text($(this).find('refid').text());
				$('#pdf-amount-received').text($(this).find('body-price').text());
				$('#pdf-date').text($(this).find('body-date').text());
				$('#pdf-subtotal').text($(this).find('subtotalprice').text());
				$('#pdf-payment-made').text($(this).find('paymentMadePrice').text());
				$('#pdf-total').text($(this).find('total-price3').text());
				$('#pdf-total-top').text($(this).find('total-price3').text());
				$('#pdf-credit-applied').text($(this).find('creditsAppliedPrice').text());
				$('#pdf-amount-due').text($(this).find('refundtotal').text());
				$('#pdf-payment-name').text($(this).find('title').text());
				$('#pdf-currency').text($(this).find('body-currency').text());
				$('#pdf-total-text').text($(this).find('refundedText').text());
				$('#pdf-payment-text').text($(this).find('paymentMadeText').text());
				$('#pdf-credit-text').text($(this).find('creditsAppliedText').text());
				
				var ad = $(this).find('addres1').text();
				
				$('#pdf-address').html(ad);
				
				//$('#pdf-address').html(ad.replace(/(.{35})/g, "$1<br>"));
				
				var longmsg = $(this).find('longmsg').text();
				if (longmsg.length != 0){
					var longmsgTitle = $(this).find('longmsg-title').text();

					$('#pdf-notes-title').html(longmsgTitle);
					$('#pdf-notes').html(longmsg);
				} else {
					$('#pdf-notes-title').hide();
					$('#pdf-notes').hide();
				}
				
				var ordernotesTitle = $(this).find('ordernotes-title').text();
				var ordernotes = $(this).find('ordernotes').text();
				$('#pdf-terms-title').text(ordernotesTitle);
				$('#pdf-terms').text(ordernotes);
				
				var mailto = $(this).find('mailto').text();
				$('#user-mail').attr('href', mailto);
				var mailtotxt = $(this).find('mailtotxt').text();
				$('#user-mail').text(mailtotxt);
				
				var clientmailto = $(this).find('clientmailto').text();
				$('#client-mail').attr('href', clientmailto);
				var clientmail = $(this).find('clientmail').text();
				$('#client-mail').text(clientmail);
				
				var clientname = $(this).find('clientname').text();
				$('#client-name').text(clientname);
				
				var nr = $(this).find('nr').text();
				$('#user-phone').attr('href', "tel:" + nr);
				$('#user-phone').text(nr);
				
				
				var card_number = $(this).find('refid').text();
				$('.visa-card').append(card_number);
				var purchase_order = $(this).find('purchaseOrderNumber').text();
				$('.purchase-order').append(purchase_order);
				var invoice_title = $(this).find('invoice-title').text();
				$('.invoice-details-1 h1').append(invoice_title);
				var list_header_total = $(this).find('list-header-total').text();
				$('.list-header li:first-child span').append(list_header_total);
				var list_header_date = $(this).find('list-header-date').text();
				$('.list-header li:nth-child(2) span').append(list_header_date);
				var list_header_currency = $(this).find('list-header-currency').text();
				$('.list-header li:nth-child(3) span').append(list_header_currency);
				var body_price = $(this).find('body-price').text();
				$('.list-body li:first-child span').append(body_price);
				var body_date = $(this).find('body-date').text();
				$('.list-body li:nth-child(2) span').append(body_date);
				var body_date = $(this).find('body-currency').text();
				$('.list-body li:nth-child(3) span').append(body_date);
				var th1 = $(this).find('th1').text();
				$('.content.cl th.item').append(th1);

				var address_lineone = $(this).find('addres1').text();
				$('.invoice-details-1 .info-2 p .adr').append(address_lineone);
				var website_link = $(this).find('website-link').text();
				$('.invoice-details-1 .info-2 .website a').attr('href', website_link);
				var website_name = $(this).find('website-name').text();
				$('.invoice-details-1 .info-2 .website a span').append(website_name);
				var mailto = $(this).find('mailto').text();
				$('.invoice-details-1 .info-2 .mailto a').attr('href', mailto);
				var mailtotxt = $(this).find('mailtotxt').text();
				$('.invoice-details-1 .info-2 .mailto a span').append(mailtotxt);
				var nr = $(this).find('nr').text();
				$('.invoice-details-1 .info-2 .nr a').attr('href', nr);
				$('.invoice-details-1 .info-2 .nr a span').append(nr);
				var txtmsg = $(this).find('thanksmsg').text();
				$('.invoice-details-2 .info-1 p:nth-child(1)').append(txtmsg);
				var longmsg = $(this).find('longmsg').text();
				if (longmsg.length != 0){
					var longmsgTitle = $(this).find('longmsg-title').text();

					$('.notes_para_head').html(longmsgTitle);
					$('.notes_para').html(longmsg);
				}
				var to = $(this).find('to').text();
				$('.invoice-details-2 .info-2 p:first-child').append(to);
				var clientname = $(this).find('clientname').text();
				$('.invoice-details-2 .info-2 .list-client li:first-child span').append(clientname);
				var clientnr = $(this).find('clientnr').text();
				$('.invoice-details-2 .info-2 .list-client li:nth-child(2) a').attr('href', clientnr);
				$('.invoice-details-2 .info-2 .list-client li:nth-child(2) a span').append(clientnr);
				var clientmailto = $(this).find('clientmailto').text();
				$('.invoice-details-2 .info-2 .list-client li:nth-child(3) a').attr('href', clientmailto);
				var clientmail = $(this).find('clientmail').text();
				$('.invoice-details-2 .info-2 .list-client li:nth-child(3) a span').append(clientmail);

				var ordernotesTitle = $(this).find('ordernotes-title').text();
				var ordernotes = $(this).find('ordernotes').text();
				$('.orderNotes').append(ordernotesTitle);
				$('.orderNotesValues').append(ordernotes);

				var subtotal = $(this).find('subtotal').text();
				$('td.subtotal').append(subtotal);
				var adjustments = $(this).find('adjustments').text();
				$('td.adjustments').append(adjustments);
				var aPrice = $(this).find('adjustmentsPrice').text();
				$('td.adjustments-price').append(aPrice);
				var shippingCharges = $(this).find('shippingCharges').text();
				$('td.shippingCharges').append(shippingCharges);
				var scPrice = $(this).find('shippingChargesPrice').text();
				$('td.shipping-charges-price').append(scPrice);
				var total_price = $(this).find('total-price').text();
				//$('.content.cl .subtotal td:nth-child(4)').append(total_price);
				var salestax = $(this).find('salestax').text();
				$('.salestax').append(salestax);

				var paymentMadeText = $(this).find('paymentMadeText').text();
				var paymentMadePrice = $(this).find('paymentMadePrice').text();
				$('td.payment-made-text').append(paymentMadeText);
				$('td.payment-made-price').append(paymentMadePrice);

				var paymentRefundMadeText = $(this).find('paymentRefundMadeText').text();
				var paymentRefundMadePrice = $(this).find('paymentRefundMadePrice').text();
				if(paymentRefundMadeText == ''){
					$('td.payment-refund-made-text').hide()
					$('td.payment-refund-made-price').hide()
				} else {
					$('td.payment-refund-made-text').append(paymentRefundMadeText);
					$('td.payment-refund-made-price').append(paymentRefundMadePrice);
				}

				var creditsAppliedText = $(this).find('creditsAppliedText').text();
				var creditsAppliedPrice = $(this).find('creditsAppliedPrice').text();
				$('td.credits-applied-text').append(creditsAppliedText);
				$('td.credits-applied-price').append(creditsAppliedPrice);
				var total_price2 = $(this).find('total-price2').text();
				$('.total-price2').append(total_price2);
				var total_price3 = $(this).find('total-price3').text();
				$('.total-price3').append(total_price3);
				var totaltext = $(this).find('totaltext').text();
				$('.totl').append(totaltext);
				var refundprice = $(this).find('refundtotal').text();
				$('td.refund-total').append(refundprice);
				var refundtext = $(this).find('refundedText').text();
				$('.refund-price').append(refundtext)
				var total_price4 = $(this).find('total-price4').text();
				$('.total-price4').append(total_price4);
				var saletax = $(this).find('saletax').text();
				$('.saletax').append(saletax);
				var paymentmsg = $(this).find('paymentmsg').text();
				$('.footer .info p:first-child').append(paymentmsg);
				var signup = $(this).find('signup').text();
				$('.footer .info p span').append(signup);
				var copyright = $(this).find('copyright').text();
				$('.copyright p').append(copyright);
				var title = $(this).find('title').text();
				$('head title').append(title);
				var item4price = $(this).find('item4price').text();
				$('.price .item4price').append(item4price);

				var subtotalprice = $(this).find('subtotalprice').text();
				$('.subtotal-price').append(subtotalprice);
				var receivedText = $(this).find('received-text').text();
				$('.received-text').append(receivedText);
				var receivedPrice = $(this).find('received-price').text();
				$('.received-price').append(receivedPrice);
				var dueText = $(this).find('due-text').text();
				$('.due-text').append(dueText);
				var duePrice = $(this).find('due-price');
				$('.due-price').append(duePrice);
				var tipText = $(this).find('tip-text');
				$('.tip-text').append(tipText);
				var tipNr = $(this).find('tip-price');
				$('.tip-price').append(tipNr);
			});
	
	$.ajax({
        method:"POST",
        type : "POST",
        url: "generatePDF.php",
        data: { 
            'html' : $('.pdf-page').html(),
        }
    }).then(function(pdfData){
        var dlnk = document.getElementById('pdfLink');

        var pdf = 'data:application/octet-stream;base64,' + pdfData;

        //dlnk.attr("href", pdf);
        dlnk.href = pdf;

        dlnk.click();
        debugger;
    }, function(error){
        console.error(error);
        debugger;
    });
	
}
	
    
}]);
