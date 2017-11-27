'use strict';

invoicesUnlimited.controller('QuickInvoiceController',[
	'$scope', '$state', '$controller', '$q', 'userFactory',
	'invoiceService', 'coreFactory', 'commentFactory', 'taxService', 'expenseService',
	'lateFeeService', 'currencyFilter', 'itemService', 'salesCommon',
	function($scope, $state, $controller, $q, userFactory,
			  invoiceService,coreFactory,commentFactory,taxService,expenseService,
			  lateFeeService,currencyFilter, itemService, salesCommon) {

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

		$q.when(userFactory.entity[0].currency.fetch())
			.then(function(obj){
			cc = obj.attributes;
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
			prepareToCreateInvoice();
		});


		$('#addInvoiceForm').validate({
			onkeyup: function(element) {$(element).valid()},
			rules: {
				customer : 'required'
			},
			messages: {
				customer : 'Please select a customer'
			}
		});

		$('#itemInfoForm').validate();

		function setValidationRules() {	

			$('.check-rate').each(function() {
				$(this).rules ('remove');
				$(this).rules('add', {
					required : true,
					min : 0.01,
					number : true,
					messages : {
						required : 'Please enter an amount',
						min : 'Please enter an amount',
						number: 'Please enter a valid amount'
					}
				});
			});

		}

		function lateFeeNameHelper(obj) {
			var fee = obj.entity;
			return fee.name + ' ' +
				fee.price + ' (' +
				fee.type + ')';
		}

		function prepareToCreateInvoice() {
			showLoader();
			var promises = [];
			var p = null;

			p = $q.when(coreFactory.getAllCustomers())
				.then(function(res) {
				res = res.filter(function(cust) {
					return cust.entity.status == 'active';
				});
				$scope.customers = res.sort(function(a,b){
					return alphabeticalSort(a.entity.displayName,b.entity.displayName)
				});

				$scope.customers.forEach(function(obj){
					if(obj.entity.salutation)
						obj.fullName = obj.entity.salutation + " " + obj.entity.displayName;
					else
						obj.fullName = obj.entity.displayName;
				});
				if(user.get('role') != 'Sales')
					$scope.customers.push(createCustomerOpener);

				//	$scope.selectedCustomer = $scope.customers[0];
			});
			promises.push(p);

			p = $q.when(coreFactory.getAllItems({
				organization : organization
			})).then(function(items) {
				$scope.actualItems = items.filter(function(item) {
					return !item.entity.expanseId;
				});
				$scope.expenseItems = items.filter(function(item) {
					return item.entity.expanseId;
				});
				$scope.items = $scope.actualItems;
				$scope.items.push(createItemOpener);
			});
			promises.push(p);

			p = $q.when(invoiceService.getPreferences(user))
				.then(function(prefs) {
				$scope.prefs = prefs;
			});
			promises.push(p);

			p = $q.when(coreFactory.getUserRole(user))
				.then(function(role) {
				$scope.userRole = role;
			});
			promises.push(p);

			p = taxService.getTaxes(user, function(taxes) {
				$scope.taxes = taxes;
				$scope.taxes.push(createTaxOpener);
			});
			promises.push(p);

			p = lateFeeService.getAllLateFees({
				organization : organization
			}).then(function(objs) {
				$scope.lateFeeList = objs.map(function(obj) {
					obj.toStr = lateFeeNameHelper(obj);
					return obj;
				});
				$scope.lateFeeList.push(createLateFeeOpener);
			})
			promises.push(p);

			p = userFactory.getField('dateFormat')
				.then(function(obj) {
				$scope.dateFormat = obj;
			});
			promises.push(p);

			$q.all(promises).then(function() {
				prepareForm();
				//--


			}, function(error) {
				hideLoader();
				console.log(error.message);
			});

		}

		function prepareForm() {
			if($scope.prefs.numAutoGen == 1) {
				$scope.invoiceNo = $scope.prefs.invoiceNumber;
				$scope.disableInvNo = true;
			} else {
				$scope.invoiceNo = "";
				$scope.disableInvNo = false;
			}
			$scope.notes = $scope.prefs.notes;
			$scope.terms = $scope.prefs.terms;

			$scope.paymentTerms = {
				terms : [
					{name: "Off", value : 0},
					{name: "Due on Receipt", value : 1},
					{name: "Net 7", value : 7},
					{name: "Net 10", value : 10},
					{name: "Net 30", value : 30},
					{name: "Net 60", value : 60},
					{name: "Net 90", value : 90}
				],
				selectedTerm : {name: "Due on Receipt", value : 1}
			};

			$scope.files = [];
			$scope.hasDueDate = true;
			$scope.todayDate = new Date();
			$scope.calculateDueDate();
			$scope.subTotalStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);

			switch($scope.prefs.discountType) {
				case 0:
					$scope.itemLevelTax = false;
					$scope.invoiceLevelTax = false;
					break;

				case 1:
					$scope.itemLevelTax = true;
					$scope.invoiceLevelTax = false;
					break;

				case 2:
				case 3:
					$scope.itemLevelTax = false;
					$scope.invoiceLevelTax = true;
					$scope.discountStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);
					break;
											}

			if ($scope.prefs.shipCharges) {
				$scope.showShippingCharges = true;
				$scope.shippingChargesStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);
			}

			if ($scope.prefs.adjustments) {
				$scope.showAdjustments = true;
				$scope.adjustmentsStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);
			}

			if ($scope.prefs.salesPerson)
				$scope.showSalesPerson = true;

			// put first item placeholder

			var t = {
				create : true,
				entity : {
					rate : 0,
					title : "Misc. Item"
				}
			}

			$scope.invoiceItems = [{
				selectedItem : t,
				selectedTax : undefined,
				rate : 0,
				quantity : 1,
				discount : 0,
				amount : 0
			}];

			var customerId = $state.params.customerId;

			if(customerId) {
				$scope.selectedCustomer = $scope.customers.filter(function(cust) {
					return cust.entity.id == customerId;
				})[0];

				customerChanged();

			}

			hideLoader();
		}

		function saveInvoice() {
			var invoice = {
				userID : user,
				organization : organization,
				customer : $scope.selectedCustomer.entity,
				invoiceDate : $scope.todayDate,
				invoiceNumber : $scope.invoiceNo,
				status : "Draft",
				discountType : $scope.prefs.discountType,
				discounts : $scope.discount,
				shippingCharges : $scope.shippingCharges,
				adjustments : $scope.adjustments,
				subTotal : Number($scope.subTotal),
				total : Number($scope.total),
				balanceDue : Number($scope.total),
				poNumber : $scope.poNumber,
				salesPerson : $scope.salesPerson,
				notes : $scope.notes,
				terms : $scope.terms,
				paymentTerms : 'Due on Receipt'

			};

			/*
		if ($scope.paymentTerms.selectedTerm.value > 0)
			invoice.dueDate = $scope.dueDate;
        */

			invoice.dueDate = new Date();

			var email = $scope.selectedCustomer.entity.email;
			if(email) invoice.customerEmails = [email];

			if($scope.invoiceItems.length == 1){
				var t = {
					create : true,
					entity : {
						rate : $scope.invoiceItems[0].amount,
						title : "Misc. Item"
					}
				}

				$scope.invoiceItems[0].selectedItem = t;
			} else {

				for(var i = 0; i < $scope.invoiceItems.length; i++){

					var t = {
						create : true,
						entity : {
							rate : $scope.invoiceItems[i].amount,
							title : "Misc. Item " + (i + 1)
						}
					}

					$scope.invoiceItems[i].selectedItem = t;
				}
			}

			return invoiceService.createNewInvoice(invoice, $scope.invoiceItems, $scope.userRole, $scope.files)
				.then(function(invObj){
				return invoiceService.copyInInvoiceInfo(invObj)
					.then(function(infoObj){
					$scope.invoiceInfo = infoObj;
					return invObj;
				});
			});
		}

		function saveAndSendInvoice() {
			return saveInvoice()
				.then(function(invoice) {
				return invoiceService.createInvoiceReceipt(invoice.id, $scope.invoiceInfo.id)
					.then(function(invoiceObj) {
					//invoiceService.sendInvoiceReceipt(invoiceObj);

					invoiceObj.set("status", "Sent");
					invoiceObj.save();

					sendToContacts(invoiceObj);
					return invoiceObj;
				});
			});
		}

		function sendToContacts(invoiceObj){
			$scope.sendEmail($scope.contacts, invoiceObj);
			$scope.sendText($scope.mobileContacts, invoiceObj);
			
			/*
			$scope.contacts.forEach(function(obj){
				if(obj.selected){
					invoiceService.sendInvoiceReceiptToEmail(invoiceObj, obj.contact)
						.then(function(result){
						addNewComment('Invoice emailed to ' + obj.contact, true, invoiceObj)
					});
				}
			});
			$scope.mobileContacts.forEach(function(obj){
				if(obj.selected){
					invoiceService.sendInvoiceTextToNumber(invoiceObj, obj.contact)
						.then(function(result){
						addNewComment('Invoice texted to ' + obj.contact, true, invoiceObj)
					});
				}
			});
			*/
		}

		function showInvoiceNumberError () {
			var validator = $( "#addInvoiceForm" ).validate();
			validator.showErrors({
				"invoiceNumber": "Invoice with this number already exists"
			});
		}

		function validateForms () {
			setValidationRules();
			var a = $('#addInvoiceForm').valid();
			var b = $('#itemInfoForm').valid();
			var c = $('#extrasForm').valid();

			if (a && b && c) return true;
			else {
				var v = undefined;
				if (!a)
					v = $('#addInvoiceForm').validate();
				else if (!b)
					v = $('#itemInfoForm').validate();
				else if (!c)
					v = $('#extrasForm').validate();

				var offset = $(v.errorList[0].element).offset().top - 30;
				scrollToOffset(offset);
				return false;
			}
		}

		$scope.save = function() {
			if (! validateForms())	return;

			showLoader();
			$q.when(invoiceService.checkInvoiceNumAvailable({
				invoiceNumber : $scope.invoiceNo,
				organization : organization
			}))
				.then(function(avilable) {
				if (avilable) {
					return saveInvoice();

				} else {
					showInvoiceNumberError();
					scrollToOffset();
					return Promise.reject('Invoice with this number already exists');
				}
			})
				.then(function(invoice) {
				addNewComment('Invoice created for ' + currencyFilter(invoice.attributes.balanceDue, '$', 2) +' amount', true, invoice)
					.then(function(obj){
					hideLoader();
					$state.go('dashboard.sales.invoices.details', {invoiceId:obj.id});
				});
				/*
			//$state.go('dashboard.sales.invoices.all');
             $state.go('dashboard.sales.invoices.details', {invoiceId:invoice.id});
             hideLoader();
             */
			}, function (error) {
				hideLoader();
				console.log(error);
			});
		}

		function addNewComment(commentbody, isAuto, invoice){
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
				//var invoice = $scope.invoice.entity;
				var prevComments = invoice.get('comments');
				if(prevComments)
					prevComments.push(obj);
				else
					prevComments = [obj];

				invoice.set('comments', prevComments);
				return invoice.save();
			})
				.then(function(invObj) {
				return invObj;
				/*
            var comment = new commentFactory(data.commentObj);

            if($scope.comments)
                $scope.comments.push(comment);
            else
                $scope.comments = [comment];
                */
				console.log(comment);
			});
		}


		$scope.saveAndSend = function(){
			if (! validateForms())	return;

			var persons = $scope.selectedCustomer.entity.get('contactPersons');

			$scope.contacts = [];
			$scope.mobileContacts = [];

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

			if($scope.contacts.length || $scope.mobileContacts.length){
				$('.email-text').addClass('show');
			} else {
				//saveAndSend1();
				ShowMessage("The customer does not have a email or phone number in their profile. Please select save.","error");
			}
		}

		$scope.sendReceipt = function(){
			debugger;
			var email = 0;
			var mobile = 0;

			$scope.contacts.forEach(function(obj){
				if(obj.selected)
					email++;
			});

			$scope.mobileContacts.forEach(function(obj){
				if(obj.selected)
					mobile++;
			});

			if(email > 0 || mobile > 0){
				saveAndSend1();
			}
			else {
				$('#emailText-error').show();
			}
		}

		function saveAndSend1() {
			if (! validateForms())	return;

			showLoader();
			$q.when(invoiceService.checkInvoiceNumAvailable({
				invoiceNumber : $scope.invoiceNo,
				organization : organization
			}))
				.then(function(avilable) {
				if (avilable) {
					return saveAndSendInvoice()

				} else {
					showInvoiceNumberError();
					scrollToOffset();
					return Promise.reject('Invoice with this number already exists');
				}
			})
				.then(function(invoice) {
				addNewComment('Invoice created for ' + currencyFilter(invoice.attributes.balanceDue, '$', 2) +' amount', true, invoice)
					.then(function(invObj){
					//hideLoader();
					//$state.go('dashboard.sales.invoices.details', {invoiceId:invObj.id});
				});
				
				hideLoader();
				$state.go('dashboard.sales.invoices.details', {invoiceId:invoice.id});
			}, function (error) {
				hideLoader();
				console.log(error);
			});
		}

		$scope.cancel = function() {
			$state.go('dashboard.sales.invoices.all');
		}

		$scope.calculateDueDate = function() {		
			var d = new Date($scope.todayDate);
			//d.setHours(d.getHours() + 12);
			d.setHours(0);

			if($scope.paymentTerms.selectedTerm.value != 1){
				d = d.addDays($scope.paymentTerms.selectedTerm.value);
			}

			$scope.dueDate = d; //$.format.date(d, "MM/dd/yyyy");
		}

		$scope.addInvoiceItem = function() {
			$scope.invoiceItems.push({
				selectedItem : undefined,
				selectedTax : undefined,
				rate : 0,
				quantity : 1,
				discount : 0,
				taxValue : 0,
				amount : 0
			});
		}

		$scope.reCalculateTotal = function() {
			var subTotal = Number($scope.subTotal) || 0;
			var discount = Number($scope.discount) || 0;
			var shipCharges = Number($scope.shippingCharges) || 0;
			var adjustments = Number($scope.adjustments) || 0;
			var totalTax = Number($scope.totalTax) || 0;
			var sum = subTotal + totalTax;
			var discountRatio = (100 - discount) * 0.01;

			if($scope.prefs.discountType == 2) // before tax
				sum = (subTotal * discountRatio) + totalTax;
			else if ($scope.prefs.discountType == 3) // after tax
				sum = (subTotal + totalTax) * discountRatio;

			discount = Math.abs(sum - subTotal - totalTax);
			$scope.total = sum + shipCharges + adjustments;
			$scope.discountStr = currencyFilter(discount*cc.exchangeRate, cc.currencySymbol, 2);
			$scope.shippingChargesStr = currencyFilter(shipCharges*cc.exchangeRate, cc.currencySymbol, 2);
			$scope.adjustmentsStr = currencyFilter(adjustments*cc.exchangeRate, cc.currencySymbol, 2);
			$scope.totalStr = currencyFilter($scope.total*cc.exchangeRate, cc.currencySymbol, 2);
		}

		$scope.reCalculateSubTotal = reCalculateSubTotal;

		function reCalculateSubTotal() {
			var items = $scope.invoiceItems;
			var subTotal = 0;
			var totalTax = 0;
			$scope.itemTaxes = [];

			// no need to check discountType,
			// itemInfo.discount is zero, so, expression will evaluate to 1.
			items.forEach(function(item) {
				subTotal += item.amount * ((100 - item.discount) * 0.01);
				item.taxValue = calculateTax(item.amount, item.selectedTax);
				totalTax += item.taxValue;

			});

			$scope.totalTax = totalTax;
			$scope.subTotal = subTotal;
			$scope.subTotalStr = currencyFilter(subTotal*cc.exchangeRate, cc.currencySymbol, 2);
			$scope.reCalculateTotal();
		}

		$scope.reCalculateItemAmount = function(index) {
			var itemInfo = $scope.invoiceItems[index];
			//if (! itemInfo.selectedItem) return;

			itemInfo.amount = itemInfo.rate * itemInfo.quantity;
			reCalculateSubTotal();
		}

		$scope.removeInvoiceItem = function(index) {
			if ($scope.invoiceItems.length > 1) {
				$scope.invoiceItems.splice(index,1);
				reCalculateSubTotal();

			} else {
				console.log("there should be atleast 1 item in an invoice");
			}
		}

		$scope.itemChanged = function(index) {
			console.log('item changed');
			var itemInfo = $scope.invoiceItems[index];

			// if create item is pressed
			if(itemInfo.selectedItem.dummy) {
				itemInfo.selectedItem = null;
				$('.new-item').addClass('show');
				// save index to select newly created item
				$scope.itemChangedIndex = index;
				$scope.prepareCreateItem();
				return;
			}

			itemInfo.rate = Number(itemInfo.selectedItem.entity.rate);
			var tax = itemInfo.selectedItem.tax;
			if (!tax) {
				//	console.log("no tax applied");
				itemInfo.selectedTax = "";
			} else {
				var taxes = $scope.taxes;
				for (var i = 0; i < taxes.length; ++i) {
					if (tax.id == taxes[i].id) {
						itemInfo.selectedTax = taxes[i];
						break;
					}
				}
			}
			$scope.reCalculateItemAmount(index);
		}

		function customerChangedHelper() {
			$scope.items.pop(); // remove createItem field

			var terms = $scope.selectedCustomer.entity.get('paymentTerms');
			if(terms){
				$scope.paymentTerms.terms.forEach(function(obj){
					if(obj.name == terms)
						$scope.paymentTerms.selectedTerm = obj;
				});
			}
			else{
				$scope.paymentTerms.selectedTerm =  {name: "Due on Receipt", value : 1}
			}

			$scope.hasDueDate = true;
			$scope.calculateDueDate();

			return $q.when(expenseService.getCustomerExpenses({
				organization : organization,
				customer : $scope.selectedCustomer.entity
			}))
				.then(function(custExpenses) {
				//	console.log(custExpenses);
				// filter current customer's expenses from all expenses
				var custExpenseItems = [];
				for (var i = 0; i < custExpenses.length; ++i) {
					if(custExpenses[i].entity.get('billable') == 'Yes'){
						for (var j = 0; j < $scope.expenseItems.length; ++j) {
							if (custExpenses[i].entity.id == $scope.expenseItems[j].entity.expanseId) {
								custExpenseItems.push($scope.expenseItems[j]);
							}
						}
					}
				}
				//	console.log(custExpenseItems);
				// check is any expense has updated
				var newExpenseItems = [];
				for(var i = 0; i < custExpenses.length; ++i) {
					if(custExpenses[i].entity.get('billable') == 'No')
						continue;
					var exp = custExpenses[i].entity;
					var itemExist = custExpenseItems.some(function(item) {
						return (exp.category == item.entity.title &&
								exp.amount == Number(item.entity.rate));
					});
					if (! itemExist) {
						newExpenseItems.push({
							create : true,
							tax   : exp.tax,
							entity : {
								title : exp.category,
								rate  : String(exp.amount),
								expanseId : exp.id
							}
						});
					}
				}
				//	console.log(newExpenseItems);
				// remove unrelated invoice items
				var newItems = $scope.actualItems.concat(custExpenseItems,newExpenseItems);
				$scope.invoiceItems = $scope.invoiceItems.filter(function(invItem) {
					if(!invItem.selectedItem || invItem.selectedItem.create)
						return false;
					return newItems.some(function(item) {
						return item.entity.id == invItem.selectedItem.entity.id;
					});
				});
				//	console.log($scope.invoiceItems);
				newItems.push(createItemOpener); // add createItem field
				return $scope.items = newItems;
			});
		}

		function customerChanged() {
			if($scope.selectedCustomer.dummy) {
				$state.go('dashboard.customers.new', {backLink : $state.current.name});
				return;
			}

			showLoader();
			$q.when(customerChangedHelper())
				.then(function() {
				if($scope.invoiceItems.length < 1) {
					$scope.addInvoiceItem();
					$scope.totalTax = 0;
					$scope.subTotal = 0;
					$scope.subTotalStr = currencyFilter(0*cc.exchangeRate, cc.currencySymbol, 2);
					$scope.reCalculateTotal();

				} else {
					reCalculateSubTotal();
				}

				hideLoader();
			});
		}

		$scope.customerChanged = customerChanged;

		$scope.prepareCreateItem = function() {
			salesCommon.prepareCreateItem({
				_scope : $scope
			});
		}

		$scope.createNewItem = function() {
			salesCommon.createNewItem({
				_scope : $scope,
				user : user,
				organization : organization
			});
		}

		function commaSeparateNumber(val){

			val = val.split(',').join('');
			if(val.indexOf('.') !== -1)
			{

				while (/(\d+)(\d{3})/.test(val.toString())){
					val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
				}
				var temp = val.length - val.indexOf('.');
				//alert(temp);
				if(temp == 3)
				{
					$(".add_item_price").attr('maxlength',val.length);
				}
			}
			else
			{
				$(".add_item_price").attr('maxlength',50);
				while (/(\d+)(\d{3})/.test(val.toString())){
					val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
				}
			}
			return val;
		}

		$('.add_item_price').keyup(function(){

			$(this).val(commaSeparateNumber($(this).val()));
		});


	}]);
