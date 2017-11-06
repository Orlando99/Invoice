'use strict';

invoicesUnlimited.controller('CreateCreditNoteController',[
	'$scope', '$state', '$controller', '$q', 'userFactory',
	'creditNoteService', 'coreFactory', 'taxService', 'expenseService',
	'currencyFilter','commentFactory','salesCommon',
	function($scope, $state, $controller, $q, userFactory,
			  creditNoteService, coreFactory, taxService, expenseService, currencyFilter,commentFactory,salesCommon) {

		if(! userFactory.entity.length) {
			console.log('User not logged in');
			return undefined;
		}

		var user = userFactory.entity[0];
		var organization = user.get("organizations")[0];
		$controller('DashboardController',{$scope:$scope,$state:$state});
		prepareToCreateCreditNote();

		$('#addCreditNoteForm').validate({
			rules: {
				customer : 'required',
				creditNumber : 'required',
				creditCreateDate : 'required'
			},
			messages: {
				customer : 'Please select a customer',
				creditNumber : 'Please enter credit note number',
				creditCreateDate : 'Please provide credit note Create date'
			}
		});

		$('#itemInfoForm').validate();

		function setValidationRules() {
			/*		
	if (! $('.check-item').length) {
		console.log('atleast one item');
		return false;
	}
*/	
			$('.check-item').each(function() {
				$(this).rules ('remove');
				$(this).rules('add', {
					required : true,
					messages : {
						required : 'Please select an item'
					}
				});
			});

			$('.check-qty').each(function() {
				$(this).rules ('remove');
				$(this).rules('add', {
					required : true,
					min : 1,
					digits : true,
					messages : {
						required : 'Please provide item quantity',
						min : 'quantity should be >= 1',
						digits : 'quantity must be integer'
					}
				});
			});

			$('.check-rate').each(function() {
				$(this).rules ('remove');
				$(this).rules('add', {
					required : true,
					min : 0,
					number : true,
					messages : {
						required : 'Please provide item rate',
						min : 'rate should be >= 0',
						number: 'Please enter a valid price'
					}
				});
			});

		}

		$scope.dateOptions = {
			showWeeks : false
		};

		function prepareToCreateCreditNote() {
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
				if(user.get('role') != 'Sales')
					$scope.items.push(createItemOpener);
			});
			promises.push(p);

			p = $q.when(creditNoteService.getPreferences(user))
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
			});
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
				$scope.creditNo = $scope.prefs.creditNumber;
				$scope.disableCreditNo = true;
			} else {
				$scope.creditNo = "";
				$scope.disableCreditNo = false;
			}
			$scope.notes = $scope.prefs.notes;
			$scope.terms = $scope.prefs.terms;

			$scope.todayDate = new Date();
			$scope.subTotalStr = currencyFilter(0, '$', 2);

			// put first item placeholder
			$scope.creditItems = [{
				selectedItem : undefined,
				selectedTax : undefined,
				rate : 0,
				quantity : 1,
				discount : 0,
				amount : 0
			}];

			var customerId = $state.params.customerId;
			var expenseId = $state.params.expenseId;

			if(customerId) {
				$scope.selectedCustomer = $scope.customers.filter(function(cust) {
					return cust.entity.id == customerId;
				})[0];

				customerChanged();

				// there will be no expenseId,
				// if we came back from Create New Customer
				if(expenseId) {
					$q.when(customerChangedHelper())
						.then(function() {
						//	console.log($scope.items);
						$scope.addCreditItem();
						$scope.creditItems[0].selectedItem = $scope.items.filter(function(item) {
							return item.entity.expanseId == expenseId;
						})[0];
						$scope.creditItems[0].selectedItem.create = true; // create new item everytime
						$scope.itemChanged(0);
					});
				}
			}

			hideLoader();
		}

		function saveCreditNote() {
			var creditNote = {
				userID : user,
				organization : organization,
				customer : $scope.selectedCustomer.entity,
				creditNoteDate : $scope.todayDate,
				creditNumber : $scope.creditNo,
				status : "Open",
				subTotal : Number($scope.subTotal),
				creditsUsed : 0,
				refundsMade : 0,
				total : Number($scope.total),
				remainingCredits : Number($scope.total),
				reference : $scope.refNumber,
				notes : $scope.notes,
				terms : $scope.terms

			};
			var email = $scope.selectedCustomer.entity.email;
			if(email) creditNote.customerEmails = [email];

			return creditNoteService.createNewCreditNote
			(creditNote, $scope.creditItems, $scope.userRole)
				.then(function(obj){
				return addNewComment('Credit Note created for ' + currencyFilter(obj.attributes.total, '$', 2) +' amount', true, obj);
			});
		}
		/*
function saveAndSendCreditNote() {
	return saveCreditNote()
	.then(function(creditNote) {
		return creditNoteService.createCreditNoteReceipt(creditNote.id)
		.then(function(creditNoteObj) {
            //addNewComment('Creditnote created for ' + currencyFilter(creditNoteObj.attributes.total, '$', 2) +' amount', true, creditNoteObj);
			return creditNoteService.sendCreditNoteReceipt(creditNoteObj);
		});
	});
}
*/

		function saveAndSendCreditNote() {
			return saveCreditNote()
				.then(function(creditNote) {
				return creditNoteService.createCreditNoteReceipt(creditNote.id)
					.then(function(creditNoteObj) {
					sendToContacts(creditNoteObj);
					return creditNoteObj;
				});
			});
		}

		function sendToContacts(creditNoteObj){
			$scope.contacts.forEach(function(obj){
				if(obj.selected){
					creditNoteService.sendCreditNoteReceiptToEmail(creditNoteObj, obj.contact)
						.then(function(result){
						addNewComment('Credit Note emailed to ' + obj.contact, true, creditNoteObj)
					});
				}
			});
			$scope.mobileContacts.forEach(function(obj){
				if(obj.selected){
					creditNoteService.sendCreditNoteTextToNumber(creditNoteObj, obj.contact)
						.then(function(result){
						addNewComment('Credit Note texted to ' + obj.contact, true, creditNoteObj)
					});
				}
			});
		}

		function validateForms () {
			setValidationRules();
			var a = $('#addCreditNoteForm').valid();
			var b = $('#itemInfoForm').valid();

			if (a && b) return true;
			else {
				var v = undefined;
				if (!a)
					v = $('#addCreditNoteForm').validate();
				else if (!b)
					v = $('#itemInfoForm').validate();

				var offset = $(v.errorList[0].element).offset().top - 30;
				scrollToOffset(offset);
				return false;
			}
		}

		$scope.save = function() {
			if (! validateForms())	return;

			showLoader();
			$q.when(creditNoteService.checkCreditNoteNumAvailable({
				creditNumber : $scope.creditNo,
				organization : organization
			}))
				.then(function(avilable) {
				if (avilable) {
					return saveCreditNote();

				} else {
					showCreditNoteNumberError();
					scrollToOffset();
					return Promise.reject('Credit Note with this number already exists');
				}
			})
				.then(function(creditNote) {
				hideLoader();
				//$state.go('dashboard.sales.creditnotes.all');
				$state.go('dashboard.sales.creditnotes.details', {creditNoteId:creditNote.id});
			}, function (error) {
				hideLoader();
				console.log(error);
			});
		}

		$scope.saveAndSend = function(){
			if (! validateForms())	return;

			$('#emailText-error').hide();

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
			$q.when(creditNoteService.checkCreditNoteNumAvailable({
				creditNumber : $scope.creditNo,
				organization : organization
			}))
				.then(function(avilable) {
				if (avilable) {
					return saveAndSendCreditNote();

				} else {
					showCreditNoteNumberError();
					scrollToOffset();
					return Promise.reject('Credit Note with this number already exists');
				}
			})
				.then(function(creditNote) {
				/*
        if($scope.selectedCustomer.entity.email)
                addNewComment('Credit Note emailed to ' + $scope.selectedCustomer.entity.email, true, creditNote);
        */
				hideLoader();
				//$state.go('dashboard.sales.creditnotes.all');
				$state.go('dashboard.sales.creditnotes.details', {creditNoteId:creditNote.id});
			}, function (error) {
				hideLoader();
				console.log(error);
			});

		}

		function addNewComment(commentbody, isAuto, creditNote){
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
				var prevComments = creditNote.get('comments');
				if(prevComments)
					prevComments.push(obj);
				else
					prevComments = [obj];

				creditNote.set('comments', prevComments);
				return creditNote.save();
			});
		}

		$scope.cancel = function() {
			$state.go('dashboard.sales.creditnotes.all');
		}

		function showCreditNoteNumberError () {
			var validator = $( "#addCreditNoteForm" ).validate();
			validator.showErrors({
				"creditNumber": "Credit Note with this number already exists"
			});
		}

		function customerChangedHelper() {
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
				// remove unrelated credit items
				$scope.actualItems.pop();
				var newItems = $scope.actualItems.concat(custExpenseItems,newExpenseItems);
				$scope.creditItems = $scope.creditItems.filter(function(creditItem) {
					if(!creditItem.selectedItem || creditItem.selectedItem.create)
						return false;
					return newItems.some(function(item) {
						return item.entity.id == creditItem.selectedItem.entity.id;
					});
				});
				if(user.get('role') != 'Sales')
					newItems.push(createItemOpener);
				//	console.log($scope.creditItems);
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
				if($scope.creditItems.length < 1) {
					$scope.addCreditItem();
					$scope.totalTax = 0;
					$scope.subTotal = 0;
					$scope.subTotalStr = currencyFilter(0, '$', 2);
					$scope.reCalculateTotal();

				} else {
					reCalculateSubTotal();
				}

				hideLoader();
			});
		}

		$scope.customerChanged = customerChanged;

		$scope.openDatePicker = function(n) {
			switch (n) {
				case 1: $scope.openPicker1 = true; break;
					 }
		}

		$scope.addCreditItem = function() {
			$scope.creditItems.push({
				selectedItem : undefined,
				selectedTax : undefined,
				rate : 0,
				quantity : 1,
				discount : 0,
				taxValue : 0,
				amount : 0
			});
		}

		$scope.removeCreditItem = function(index) {
			if ($scope.creditItems.length > 1) {
				$scope.creditItems.splice(index,1);
				reCalculateSubTotal();

			} else {
				console.log("there should be atleast 1 item in a creditNote");
			}
		}

		$scope.prepareCreateItem = function() {
			salesCommon.prepareCreateItem({
				_scope : $scope
			});
		}

		$scope.createNewItem = function() {
			salesCommon.createNewCreditItem({
				_scope : $scope,
				user : user,
				organization : organization
			});
		}

		$scope.itemChanged = function(index) {
			console.log('item changed');
			var itemInfo = $scope.creditItems[index];

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

		$scope.reCalculateTotal = function() {
			var subTotal = Number($scope.subTotal) || 0;
			var totalTax = Number($scope.totalTax) || 0;
			var sum = subTotal + totalTax;

			$scope.total = sum;
			$scope.totalStr = currencyFilter($scope.total, '$', 2);
		}

		function reCalculateSubTotal() {
			var items = $scope.creditItems;
			var subTotal = 0;
			var totalTax = 0;
			$scope.itemTaxes = [];

			// no need to check discountType,
			// itemInfo.discount is zero, so, expression will evaluate to 1.
			items.forEach(function(item) {
				subTotal += item.amount * ((100 - item.discount) * 0.01);
				item.taxValue = calculateTax(item.amount, item.selectedTax);
				totalTax += item.taxValue;

				if (item.selectedTax) {
					var index = -1;
					if($scope.itemTaxes.length){
						index = $scope.itemTaxes.findIndex(function(obj){
							return obj.name == item.selectedTax.name;
						});
					}
					if(index == -1){
						$scope.itemTaxes.push({
							nameValue :  item.selectedTax.name + ' (' + item.selectedTax.rate + '%)',
							amount: currencyFilter(item.taxValue, '$', 2),
							count: 1,
							name: item.selectedTax.name,
							amountValue: item.taxValue
						});
					}
					else{
						$scope.itemTaxes[index].amountValue += item.taxValue;
						$scope.itemTaxes[index].count++;
						$scope.itemTaxes[index].amount = currencyFilter($scope.itemTaxes[index].amountValue, '$', 2);
						$scope.itemTaxes[index].nameValue = item.selectedTax.name + ' (' + item.selectedTax.rate + '%)';
					}
				}
				/*
		if (item.selectedTax) {
			$scope.itemTaxes.push({
				nameValue :  item.selectedTax.name + ' (' + item.selectedTax.rate + '%)',
				amount: currencyFilter(item.taxValue, '$', 2)
			});
		}
        */
			});

			$scope.totalTax = totalTax;
			$scope.subTotal = subTotal;
			$scope.subTotalStr = currencyFilter(subTotal, '$', 2);
			$scope.reCalculateTotal();
		}

		$scope.taxChanged = function(index) {
			console.log('tax changed');

			if(index == -1){
				if($scope.newItem.tax.dummy){
					$scope.currentItem = index;
					$scope.newItem.tax = null;

					$scope.taxName = null;
					$scope.taxRate = null;

					$('.new-tax').addClass('show');
					return;
				}
			}
			else{
				var itemInfo = $scope.creditItems[index];

				if(!itemInfo.selectedTax){
					reCalculateSubTotal();
				}
				else if(itemInfo.selectedTax.dummy){
					$scope.currentItem = index;
					$scope.taxName = null;
					$scope.taxRate = null;
					itemInfo.selectedTax = null;
					$('.new-tax').addClass('show');

					return;
				}
			}

			reCalculateSubTotal();
		}

		$scope.saveNewTax = function() {
			salesCommon.createNewCreditTax({
				_scope : $scope,
				user : user
			}, function(){
				reCalculateSubTotal();
				if(!$scope.$$phase)
					$scope.$apply();


			});
		}

		$scope.reCalculateItemAmount = function(index) {
			var itemInfo = $scope.creditItems[index];
			if (! itemInfo.selectedItem) return;

			itemInfo.amount = itemInfo.rate * itemInfo.quantity;
			reCalculateSubTotal();
		}



	}]);