'use strict';

invoicesUnlimited.controller('CreditNoteDetailController',[
	'$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
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

		$scope.isOwner = false;

		$scope.dateOptions = {
			showWeeks : false
		};

		function showCreditNoteDetail() {
			var creditNoteId = $state.params.creditNoteId;
			if (! creditNoteId) return;

			scrollToOffset();

			showLoader();
			$q.when(creditNoteService.getCreditNoteDetails(creditNoteId))
				.then(function(creditNote) {

				var usr = creditNote.entity.get('userID');

				if(userFactory.entity[0].get('role') == 'General Employee'){
					if(userFactory.entity[0].id == usr.id)
						$scope.isOwner = true;
				} else {
					$scope.isOwner = true;
				}

				if(creditNote.entity.get('customer').get('isDeleted') == 1)
					$scope.isOwner = false;

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
				debugger;
				return $.ajax({
					type: "GET",
					url: 'proxy.php',
					dataType: "html",
					data: {
						address: receipt.url()
					}
				}).then(function (htmlDoc) {
					var fr = document.getElementById('creditFrame');
					fr.src = "about:blank";
					fr.contentWindow.document.open();
					fr.contentWindow.document.write(htmlDoc);
					fr.contentWindow.document.close();
					hideLoader();
				});
				
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

		$scope.downloadInvoice = function(){
			var url = $scope.creditNote.entity.get('creditLabels')._url;
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
					var itemTitle = $("<td class='ff1 fc0 invoice-item-title' style='width: 50mm;' colspan='2'>"+ $(this).children('name').text() +"</td>");
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
					var itemTitle = $("<td class='ff1 fc0 invoice-item-title' style='width: 50mm;' colspan='2'>"+ $(this).children('name').text() +"</td>");
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
			$('#pay-link').attr('href',"https://app.invoicesunlimited.com/pay/?InvoiceInfoID="+invoiceId);
			$('#pay-link-2').attr('href',"https://app.invoicesunlimited.com/pay/?InvoiceInfoID="+invoiceId);

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

				var headerTitle = $(this).find('headerTitle').text();
				var pastDate = $(this).find('past-due').text();
				if(headerTitle){
					$('#pdf-title').text(headerTitle + "   " + pastDate);
				} else {
					//$('.top-bar').hide();
					$('#pdf-title').text("");
					$('.top-bar').css('height', '0mm');
					$('.top-bar').css('border-bottom', '0mm');
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
					$('#pdf-notes-title').html("");
					$('#pdf-notes').html("");
					$('#pdf-notes-title').hide();
					$('#pdf-notes').hide();
				}

				var ordernotesTitle = $(this).find('ordernotes-title').text();
				var ordernotes = $(this).find('ordernotes').text();
				if(ordernotes){
					$('#pdf-terms-title').text(ordernotesTitle);
					$('#pdf-terms').text(ordernotes);
				} else {
					$('#pdf-terms-title').text("");
					$('#pdf-terms').text("");
					$('#pdf-terms-title').hide();
					$('#pdf-terms').hide();
				}

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