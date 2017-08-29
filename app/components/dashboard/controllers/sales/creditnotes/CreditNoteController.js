'use strict';

invoicesUnlimited.controller('CreditNoteController',[
	'$q', '$scope', '$state', '$controller',
	'userFactory', 'creditNoteService', 'coreFactory', 'taxService', 'expenseService', 'commentFactory', 'currencyFilter',

	function($q, $scope, $state, $controller, userFactory, creditNoteService,
			  coreFactory, taxService, expenseService, commentFactory, currencyFilter){

		if(! userFactory.entity.length) {
			console.log('User not logged in');
			return undefined;
		}

		var user = userFactory.entity[0];
		var organization = user.get("organizations")[0];
		$controller('DashboardController',{$scope:$scope,$state:$state});

		var isGoTo = {
			details : function(to){
				return to.endsWith('creditnotes.details');	
			},
			creditnotes : function(to){ 
				return to.endsWith('creditnotes.all');
			},
			edit : function(to){
				return to.endsWith('creditnotes.edit');
			},
			newCreditnotes : function(to){
				return to.endsWith('creditnotes.new');	
			}
		};

		userFactory.getField('dateFormat')
			.then(function(obj) {
			$scope.dateFormat = obj;
			CheckUseCase();
		});

		$('#editCreditNoteForm').validate({
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

		function CheckUseCase(stateName) {
			if (! stateName)
				stateName = $state.current.name;

			if (isGoTo.creditnotes(stateName)) {
				console.log('its in list')
				listCreditNotes();

			} else if (isGoTo.newCreditnotes(stateName)) {
				console.log('its in new');

			} else if (isGoTo.edit(stateName)) {
				console.log('its in edit');
				prepareToEditCreditNote();
			}
		}

		$scope.dateOptions = {
			showWeeks : false
		};

		function prepareToEditCreditNote() {
			var creditNoteId = $state.params.creditNoteId;
			if (!creditNoteId) return;

			var custId = $state.params.customerId;

			showLoader();
			$q.when(LoadRequiredData())
				.then(function(msg) {
				return $q.when(creditNoteService.getCreditNote(creditNoteId));
			})
				.then(function (creditNote) {
				console.log(creditNote);

				$scope.creditNote = creditNote;
				$scope.creditItems = [];
				$scope.deletedItems = [];
				$scope.itemsWithOutId = 0;
				$scope.itemsWithIdinDel = 0;

				if(custId){
					$scope.selectedCustomer = $scope.customers.filter(function(cust) {
						return custId === cust.entity.id;
					})[0];
				}
				else{
					$scope.selectedCustomer = $scope.customers.filter(function(cust) {
						return creditNote.entity.get('customer').id === cust.entity.id;
					})[0];
				}


				return $q.when(customerChangedHelper());
			})
				.then(function() {
				prepareEditForm();

			}, function(error) {
				hideLoader();
				console.log(error.message);
			});
		}

		function prepareEditForm() {
			var creditNote = $scope.creditNote;
			$scope.creditNo = creditNote.entity.creditNumber;
			$scope.refNumber = creditNote.entity.reference;
			$scope.disableCreditNo =
				($scope.prefs.numAutoGen == 1) ? true : false;

			$scope.todayDate = creditNote.entity.creditNoteDate;
			$scope.notes = creditNote.entity.notes;
			$scope.terms = creditNote.entity.terms;

			if(creditNote.entity.status == 'Sent') {
				$scope.previouslySent = true;
			}

			for (var i = 0; i < creditNote.creditItems.length; ++i) {
				var creditItem = creditNote.creditItems[i].entity;
				var actualItem = creditItem.get('item');
				var obj = {};

				obj.selectedItem = $scope.items.filter(function(item) {
					if (item.entity.id === actualItem.id) {
						obj.id = creditItem.id;
						obj.rate = (creditItem.amount / creditItem.quantity); //Number(item.entity.rate);
						obj.quantity = creditItem.quantity;
						obj.discount = 0;
						obj.taxValue = 0;
						obj.amount = creditItem.amount;

						var creditItemTax = creditItem.get('tax');
						if (creditItemTax) {
							obj.selectedTax = $scope.taxes.filter(function(tax) {
								return tax.id == creditItemTax.id;
							})[0];
						} else {
							obj.selectedTax = undefined;
						}

						return true;
					}
					return false;
				})[0];

				$scope.creditItems.push(obj);
			}

			reCalculateSubTotal();
			hideLoader();
		}

		function saveEditedCreditNote(params) {
			var creditNote = $scope.creditNote.entity;
			creditNote.set('customer', $scope.selectedCustomer.entity);
			creditNote.set('creditNoteDate', $scope.todayDate);
			creditNote.set('creditNumber', $scope.creditNo);
			creditNote.set('subTotal', Number($scope.subTotal));
			creditNote.set('total', Number($scope.total));
			creditNote.set('remainingCredits', Number($scope.total));
			creditNote.set('reference', $scope.refNumber);
			creditNote.set('notes', $scope.notes);
			creditNote.set('terms', $scope.terms);

			var email = $scope.selectedCustomer.entity.email;
			if(email)
				creditNote.set('customerEmails', [email]);
			else creditNote.unset('customerEmails');

			return creditNoteService.updateCreditNote
			($scope.creditNote, $scope.creditItems, $scope.deletedItems,
			 user, $scope.userRole)

				.then(function(obj) {
				addNewComment('Credit Note edited', true);
				if (params.generateReceipt) {
					return creditNoteService.createCreditNoteReceipt(obj.id);

				} else {
					return obj;
				}
			});
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
			});

		}

		function saveAndSendEditedCreditNote () {
			return saveEditedCreditNote({generateReceipt:false})
				.then(function(creditNote) {
				return creditNoteService.createCreditNoteReceipt(creditNote.id)
					.then(function(creditObj) {
					return creditNoteService.sendCreditNoteReceipt(creditObj);
				});
			});
		}

		function validateForms () {
			setValidationRules();
			var a = $('#editCreditNoteForm').valid();
			var b = $('#itemInfoForm').valid();

			if (a && b) return true;
			else {
				var v = undefined;
				if (!a)
					v = $('#editCreditNoteForm').validate();
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
			useAllIds();
			saveEditedCreditNote({generateReceipt:true})
				.then(function(creditNote) {
				hideLoader();
				console.log(creditNote);
				$state.go('dashboard.sales.creditnotes.details', {creditNoteId:creditNote.id});
				//$state.go('dashboard.sales.creditnotes.all');

			}, function(error) {
				hideLoader();
				console.log(error.message);
			});
		}

		$scope.saveAndSend = function () {
			if (! validateForms())	return;

			showLoader();
			useAllIds();
			saveAndSendEditedCreditNote()
				.then(function(creditNote) {
				hideLoader();
				console.log(creditNote);
				$state.go('dashboard.sales.creditnotes.all');

			}, function (error) {
				hideLoader();
				console.log(error);
			});
		}

		$scope.cancel = function() {
			$state.go('dashboard.sales.creditnotes.all');
		}

		$scope.addCreditItem = function() {
			var item = $scope.deletedItems.pop();
			if (! item /*|| ! item.id*/) {
				item = {id : undefined};
				++$scope.itemsWithOutId;
			} else {
				--$scope.itemsWithIdinDel;
			}

			item.selectedItem = undefined;
			item.selectedTax = undefined;
			item.rate = 0;
			item.quantity = 1;
			item.discount = 0;
			item.taxValue = 0;
			item.amount = 0;

			$scope.creditItems.push(item);

			//	console.log($scope.creditItems);
			//	console.log($scope.deletedItems);
			//	console.log($scope.itemsWithOutId + ' ' + $scope.itemsWithIdinDel);
		}

		$scope.removeCreditItem = function(index) {
			if ($scope.creditItems.length > 1) {
				var delItem = $scope.creditItems.splice(index,1)[0];
				if (delItem.id) {
					++$scope.itemsWithIdinDel;
					$scope.deletedItems.push(delItem);
				} else {
					--$scope.itemsWithOutId;
				}
				reCalculateSubTotal();
			} else {
				console.log("there should be atleast 1 item in a creditNote");
			}
		}

		function useAllIds() {
			var unUsedIds = $scope.itemsWithIdinDel;
			var idsNeeded = $scope.itemsWithOutId;
			if(unUsedIds <= 0 || idsNeeded <= 0) return;

			var i = 0;
			var creditItems = $scope.creditItems;
			$scope.deletedItems.forEach(function(item) {
				if(! item.id) return;
				for (; i < creditItems.length; ++i) {
					if(! creditItems[i].id) {
						creditItems[i].id = item.id;
						item.id = undefined;
						--$scope.itemsWithIdinDel;
						--$scope.itemsWithOutId;
						return;
					}
				}
			});
			$scope.deletedItems = $scope.deletedItems.filter(function(item) {
				if (item.id) return true;
				return false;
			});
		}

		$scope.openDatePicker = function(n) {
			switch (n) {
				case 1: $scope.openPicker1 = true; break;
					 }
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

		$scope.reCalculateItemAmount = function(index) {
			var itemInfo = $scope.creditItems[index];
			if (! itemInfo.selectedItem) return;

			itemInfo.amount = itemInfo.rate * itemInfo.quantity;
			reCalculateSubTotal();
		}

		$scope.itemChanged = function(index) {
			var itemInfo = $scope.creditItems[index];
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
				var newItems = $scope.actualItems.concat(custExpenseItems,newExpenseItems);
				$scope.creditItems = $scope.creditItems.filter(function(creditItem) {
					if(!creditItem.selectedItem || creditItem.selectedItem.create)
						return false;
					return newItems.some(function(item) {
						return item.entity.id == creditItem.selectedItem.entity.id;
					});
				});
				//	console.log($scope.creditItems);
				return $scope.items = newItems;
			});
		}

		$scope.customerChanged = function() {

			if($scope.selectedCustomer.dummy) 
			{
				$state.go('dashboard.customers.new', {'backLink' : $state.current.name, 'creditNoteId' : $state.params.creditNoteId});
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
		/*
//$scope.customers = $scope.customers.concat([createCustomerOpener]);
        //$scope.customers = $scope.customers.push(createCustomerOpener);
        // $scope.selectedCustomer = $scope.customers[0];

*/
		function LoadRequiredData() {
			var promises = [];
			var p = null;
			coreFactory.clearAllOnLogOut();
			p = $q.when(coreFactory.getAllCustomers())
				.then(function(res) {
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
			});
			promises.push(p);

			p = $q.when(coreFactory.getAllItemsIncludingDelete({
				organization : organization
			})).then(function(items) {
				$scope.actualItems = items.filter(function(item) {
					return !item.entity.expanseId;
				});
				$scope.expenseItems = items.filter(function(item) {
					return item.entity.expanseId;
				});
				$scope.items = $scope.actualItems;
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

			return $q.all(promises);
		}

		function listCreditNotes() {
			showLoader();
			$q.when(creditNoteService.listCreditNotes(user))
				.then(function(res) {
				var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
				res.forEach(function(obj) {
					switch (obj.entity.status) {
						case "Open":
							obj.statusClass = "text-positive";
							break;
						case "Closed":
							obj.statusClass = "text-danger";
							break;
						default:
							obj.statusClass = "text-color-normalize";
											 }

					obj.creditNoteDate = formatDate(
						obj.entity.creditNoteDate, dateFormat);
					obj.total = currencyFilter(obj.entity.total, '$', 2);
					obj.remainingCredits = currencyFilter(obj.entity.remainingCredits, '$', 2);
				});

				$scope.creditNoteList = res;
				$scope.allcreditNoteList = res;
				$scope.displayedCreditNotes =res;
				$scope.sortByDate();
				hideLoader();

			}, function(error) {
				hideLoader();
				console.log(error.message);
			});	
		}
		$scope.sortByCreditNote= function()
		{

			if($("#creditnote").css('display') === "none"){
				$scope.creditNoteList.sort(function(a,b){
					return a.entity.creditNumber.localeCompare(b.entity.creditNumber)});
				$('#creditnote').css({
					'display': 'inline-table'
				});
				$('#creditnoteUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.creditNoteList.sort(function(a,b){
					return b.entity.creditNumber.localeCompare(a.entity.creditNumber)});
				$('#creditnoteUp').css({
					'display': 'inline-table'
				});
				$('#creditnote').css({
					'display': 'none'
				});
			}

			$('#date').css({
				'display': 'none'
			});
			$('#refno').css({
				'display': 'none'
			});
			$('#cusname').css({
				'display': 'none'
			});
			$('#status').css({
				'display': 'none'
			});
			$('#amount').css({
				'display': 'none'
			});
			$('#balance').css({
				'display': 'none'
			});


			$('#dateUp').css({
				'display': 'none'
			});
			$('#refnoUp').css({
				'display': 'none'
			});
			$('#cusnameUp').css({
				'display': 'none'
			});
			$('#statusUp').css({
				'display': 'none'
			});
			$('#amountUp').css({
				'display': 'none'
			});
			$('#balanceUp').css({
				'display': 'none'
			});
		}  

		$scope.sortByDate = function()
		{


			if($("#date").css('display') === "none"){
				$scope.creditNoteList.sort(function(a,b){
					return a.entity.creditNoteDate>b.entity.creditNoteDate ? -1 : a.entity.creditNoteDate<b.entity.creditNoteDate ? 1 : 0;
					//return a.creditNoteDate.localeCompare(b.creditNoteDate)
				});
				$('#date').css({
					'display': 'inline-table'
				});
				$('#dateUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.creditNoteList.sort(function(a,b){
					return b.entity.creditNoteDate>a.entity.creditNoteDate ? -1 : b.entity.creditNoteDate<a.entity.creditNoteDate ? 1 : 0;
					//return b.creditNoteDate.localeCompare(a.creditNoteDate)
				});
				$('#dateUp').css({
					'display': 'inline-table'
				});
				$('#date').css({
					'display': 'none'
				});
			}


			$('#creditnote').css({
				'display': 'none'
			});
			$('#refno').css({
				'display': 'none'
			});
			$('#cusname').css({
				'display': 'none'
			});
			$('#status').css({
				'display': 'none'
			});
			$('#amount').css({
				'display': 'none'
			});
			$('#balance').css({
				'display': 'none'
			});

			$('#creditnoteUp').css({
				'display': 'none'
			});
			$('#refnoUp').css({
				'display': 'none'
			});
			$('#cusnameUp').css({
				'display': 'none'
			});
			$('#statusUp').css({
				'display': 'none'
			});
			$('#amountUp').css({
				'display': 'none'
			});
			$('#balanceUp').css({
				'display': 'none'
			});
		}  

		$scope.sortByRefNum = function()
		{

			if($("#refno").css('display') === "none"){
				$scope.creditNoteList.sort(function(a,b){
					if(!a.entity.reference)
						a.entity.reference = "";
					if(!b.entity.reference)
						b.entity.reference = "";
					return a.entity.reference.localeCompare(b.entity.reference);
				});
				$('#refno').css({
					'display': 'inline-table'
				});
				$('#refnoUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.creditNoteList.sort(function(a,b){ 
					if(!a.entity.reference)
						a.entity.reference = "";
					if(!b.entity.reference)
						b.entity.reference = "";
					return b.entity.reference.localeCompare(a.entity.reference);
				});
				$('#refnoUp').css({
					'display': 'inline-table'
				});
				$('#refno').css({
					'display': 'none'
				});
			}


			$('#date').css({
				'display': 'none'
			});
			$('#creditnote').css({
				'display': 'none'
			});
			$('#cusname').css({
				'display': 'none'
			});
			$('#status').css({
				'display': 'none'
			});
			$('#amount').css({
				'display': 'none'
			});
			$('#balance').css({
				'display': 'none'
			});

			$('#dateUp').css({
				'display': 'none'
			});
			$('#creditnoteUp').css({
				'display': 'none'
			});
			$('#cusnameUp').css({
				'display': 'none'
			});
			$('#statusUp').css({
				'display': 'none'
			});
			$('#amountUp').css({
				'display': 'none'
			});
			$('#balanceUp').css({
				'display': 'none'
			});

		} 

		$scope.sortByCusName = function()
		{
			$scope.creditNoteList.sort(function(a,b){
				return a.customer.displayName.localeCompare(b.customer.displayName)});

			if($("#cusname").css('display') === "none"){
				$scope.creditNoteList.sort(function(a,b){
					return a.customer.displayName.localeCompare(b.customer.displayName)});
				$('#cusname').css({
					'display': 'inline-table'
				});
				$('#cusnameUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.creditNoteList.sort(function(a,b){
					return b.customer.displayName.localeCompare(a.customer.displayName)});
				$('#cusnameUp').css({
					'display': 'inline-table'
				});
				$('#cusname').css({
					'display': 'none'
				});
			}      
			$('#date').css({
				'display': 'none'
			});
			$('#creditnote').css({
				'display': 'none'
			});
			$('#refno').css({
				'display': 'none'
			});
			$('#status').css({
				'display': 'none'
			});
			$('#amount').css({
				'display': 'none'
			});
			$('#balance').css({
				'display': 'none'
			});

			$('#dateUp').css({
				'display': 'none'
			});
			$('#creditnoteUp').css({
				'display': 'none'
			});
			$('#refnoUp').css({
				'display': 'none'
			});
			$('#statusUp').css({
				'display': 'none'
			});
			$('#amountUp').css({
				'display': 'none'
			});
			$('#balanceUp').css({
				'display': 'none'
			});

		} 
		$scope.sortByStatus = function()
		{

			if($("#status").css('display') === "none"){
				$scope.creditNoteList.sort(function(a,b){
					return a.entity.status.localeCompare(b.entity.status)});
				$('#status').css({
					'display': 'inline-table'
				});
				$('#statusUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.creditNoteList.sort(function(a,b){
					return b.entity.status.localeCompare(a.entity.status)});
				$('#statusUp').css({
					'display': 'inline-table'
				});
				$('#status').css({
					'display': 'none'
				});
			}

			$('#date').css({
				'display': 'none'
			});
			$('#creditnote').css({
				'display': 'none'
			});
			$('#refno').css({
				'display': 'none'
			});
			$('#cusname').css({
				'display': 'none'
			});
			$('#amount').css({
				'display': 'none'
			});
			$('#balance').css({
				'display': 'none'
			});


			$('#dateUp').css({
				'display': 'none'
			});
			$('#creditnoteUp').css({
				'display': 'none'
			});
			$('#refnoUp').css({
				'display': 'none'
			});
			$('#cusnameUp').css({
				'display': 'none'
			});
			$('#amountUp').css({
				'display': 'none'
			});
			$('#balanceUp').css({
				'display': 'none'
			});
		} 
		$scope.sortByAmount = function()
		{
			$scope.creditNoteList.sort(function(a,b){
				return  b.entity.total - a.entity.total });

			if($("#amount").css('display') === "none"){
				$scope.creditNoteList.sort(function(a,b){
					return  b.entity.total - a.entity.total });
				$('#amount').css({
					'display': 'inline-table'
				});
				$('#amountUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.creditNoteList.sort(function(a,b){
					return  a.entity.total - b.entity.total });
				$('#amountUp').css({
					'display': 'inline-table'
				});
				$('#amount').css({
					'display': 'none'
				});
			}

			$('#date').css({
				'display': 'none'
			});
			$('#creditnote').css({
				'display': 'none'
			});
			$('#refno').css({
				'display': 'none'
			});
			$('#cusname').css({
				'display': 'none'
			});
			$('#status').css({
				'display': 'none'
			});
			$('#balance').css({
				'display': 'none'
			});



			$('#dateUp').css({
				'display': 'none'
			});
			$('#creditnoteUp').css({
				'display': 'none'
			});
			$('#refnoUp').css({
				'display': 'none'
			});
			$('#cusnameUp').css({
				'display': 'none'
			});
			$('#statusUp').css({
				'display': 'none'
			});
			$('#balanceUp').css({
				'display': 'none'
			});
		} 
		$scope.sortByBalance = function()
		{
			if($("#balance").css('display') === "none"){
				$scope.creditNoteList.sort(function(a,b){
					return  b.entity.remainingCredits - a.entity.remainingCredits;
				});
				$('#balance').css({
					'display': 'inline-table'
				});
				$('#balanceUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.creditNoteList.sort(function(a,b){
					return  a.entity.remainingCredits - b.entity.remainingCredits;
				});
				$('#balanceUp').css({
					'display': 'inline-table'
				});
				$('#balance').css({
					'display': 'none'
				});
			}


			$('#date').css({
				'display': 'none'
			});
			$('#creditnote').css({
				'display': 'none'
			});
			$('#refno').css({
				'display': 'none'
			});
			$('#cusname').css({
				'display': 'none'
			});
			$('#status').css({
				'display': 'none'
			});
			$('#amount').css({
				'display': 'none'
			});


			$('#dateUp').css({
				'display': 'none'
			});
			$('#creditnoteUp').css({
				'display': 'none'
			});
			$('#refnoUp').css({
				'display': 'none'
			});
			$('#cusnameUp').css({
				'display': 'none'
			});
			$('#statusUp').css({
				'display': 'none'
			});
			$('#amountUp').css({
				'display': 'none'
			});

		} 

		$scope.showMenu = function(){
			if($('.filtermenu').hasClass('show'))
				$('.filtermenu').removeClass('show');
			else
				$('.filtermenu').addClass('show');
		}

		$scope.currentCreditNotes = "All Credit Notes";
		$scope.allCreditNotes = function(){
			$scope.creditNoteList = $scope.allcreditNoteList.filter(function(obj){
				return true;
			});
			$scope.displayedCreditNotes = $scope.creditNoteList;
			$scope.currentCreditNotes = "All Credit Notes"
			$('.filtermenu').removeClass('show');

		}
		$scope.openCreditNotes = function(){
			$scope.creditNoteList = $scope.allcreditNoteList.filter(function(obj){
				return obj.entity.status == 'Open';
			});
			$scope.displayedCreditNotes = $scope.creditNoteList;
			$scope.currentCreditNotes = "Open Credit Notes"

			$('.filtermenu').removeClass('show');

		}
		$scope.closedCreditNotes = function(){
			$scope.creditNoteList = $scope.allcreditNoteList.filter(function(obj){
				return obj.entity.status == 'Closed';
			});
			$scope.displayedCreditNotes = $scope.creditNoteList;
			$scope.currentCreditNotes = "Closed Credit Notes"
			$('.filtermenu').removeClass('show');
		}
		$scope.voidCreditNotes = function(){
			$scope.estimateList = $scope.allcreditNoteList.filter(function(obj){
				return obj.entity.status == 'Void';
			});
			$scope.displayedCreditNotes =  $scope.estimateList;
			$scope.currentCreditNotes = "Void Credit Notes"
			$('.filtermenu').removeClass('show');

		}

		$scope.search = function()
		{
			if($scope.searchText.length)
			{
				$scope.creditNoteList = $scope.displayedCreditNotes.filter(function(obj)
																		   {
					if(!obj.creditNoteDate)
					{
						obj.creditNoteDate = "";
					}
					if(!obj.entity.creditNumber)
					{
						obj.entity.creditNumber = "";
					}
					if(!obj.entity.reference)
					{
						obj.entity.reference = "";
					}
					if(!obj.customer.displayName)
					{
						obj.customer.displayName = "";
					}
					if(!obj.entity.status)
					{
						obj.entity.status = "";
					}
					if(!obj.total)
					{
						obj.total= "";
					}
					if(!obj.remainingCredits)
					{
						obj.remainingCredits = "";
					}
					return obj.creditNoteDate.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.entity.creditNumber.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.entity.reference.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.customer.displayName.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.entity.status.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.total.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.remainingCredits.toLowerCase().includes($scope.searchText.toLowerCase());
				});
			}
			else
			{  
				$scope.creditNoteList = $scope.displayedCreditNotes;
			}
		}
	}]);
