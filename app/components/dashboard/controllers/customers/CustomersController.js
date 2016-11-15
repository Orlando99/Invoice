'use strict';

$(document).ready(function(){
	$(document).on('click','.menu',function(){
		var self = $(this).children('.submenu')[0];
		$('.menu .submenu')
		.toArray()
		.filter(function(menu){
			return (menu != self)
					&& ($(menu).hasClass('showsub'));
		})
		.forEach(function(menu){
			$(menu).removeClass('showsub');
		});

		$(this).children('.submenu').toggleClass('showsub');
        
	})
});

invoicesUnlimited.controller('CustomersController',
	function($scope,$rootScope,$state,$uibModal,userFactory,
			 contactPersonFactory, customerFactory, coreFactory, expenseService, 
			 invoicesFactory ,$controller,$q, appFields, currencyFilter){

	var customerId = parseInt($state.params.customerId);
	var user = userFactory;
	var organization = user.entity[0].get("organizations")[0];
	
	if (!user.entity.length) {
		$state.go('login');
		return;
	}
	$('.tutorial').hide();
	var def = $q.defer();
	$controller('DashboardController',{$scope:$scope,$state:$state});
    
    $scope.nextClicked = function(){
        $('.tutorial').hide();
    }
    
    $scope.skipTutorial = function(){
        fromTutorial = false;
        $state.go('dashboard');
    }

	$scope.selectedCustomer;
	$scope.selectedCustomerId;
	$scope.customers = [];
	$scope.comments = [];
	$scope.shipping = {
		setShippingTheSame  : false,
		tempShippingAddress : {}
	}

	var formBillingAddress = function(obj){
		var result = "";
		
		var addIfExist = function(w) { return w ? w : "";}

		result += addIfExist(obj.Street) + "\n"
		+ addIfExist(obj.City) + "\n"
		+ addIfExist(obj["State\/Province"]) + "\n"
        + addIfExist(obj["Zip\/Postal Code"]) + "\n"
        + addIfExist(obj.Country);
        return result;
	}

	var isCustomerIdValid = function(id){
		if (isNaN(id)) return false;
		if (id >= 0 && id < $scope.customers.length) return true;
		else return false;
	}

	var doSelectCustomerIfValidId = function(id){
		if (isCustomerIdValid(id)) {
			selectCustomer($scope.customers[id]);
			$scope.selectedCustomerId = id;
		}
		else $state.go('dashboard.customers.all');
	}

	var doCreateEditObject = function(){
		$scope.selectedCustomerEdit = 
			$.extend(true,{},$scope.selectedCustomer.entity);

		$scope.billingAddressEdit = 
			$.extend(true,{},$scope.selectedCustomer.billingAddressJSON);

		$scope.shippingAddressEdit = 
			$.extend(true,{},$scope.selectedCustomer.shippingAddressJSON);
	}

    $scope.NewExpense = function(){
        $state.go('dashboard.expenses.new', {customerId:$scope.selectedCustomer.entity.id});
    }
    
    $scope.NewInvoice = function(){
        $state.go('dashboard.sales.invoices.new', {customerId:$scope.selectedCustomer.entity.id});
    }
    
    $scope.NewCreditNote = function(){
        $state.go('dashboard.sales.creditnotes.new', {customerId:$scope.selectedCustomer.entity.id});
    }
    
    $scope.NewEstimate = function(){
        $state.go('dashboard.sales.estimates.new', {customerId:$scope.selectedCustomer.entity.id});
    }
    
	var selectCustomer = function(item){
		$scope.selectedCustomer = item;
		var obj = $scope.selectedCustomer.entity;
		if (!obj.billingAddress) return;
		
		var billingAddress = JSON.parse(obj.billingAddress);
		var shippingAddress = {};
		if (obj.shippingAddress)
			shippingAddress = JSON.parse(obj.shippingAddress);

	    $scope.selectedCustomer.billingAddress = formBillingAddress(billingAddress);
	    $scope.selectedCustomer.billingAddressJSON = billingAddress;
	    $scope.selectedCustomer.shippingAddressJSON = shippingAddress;
	    drawBarChart();
	}

	function drawBarChart() {
		var promises = [];
		promises.push ( $q.when(expenseService.getCustomerExpenses({
			organization : organization,
			customer : $scope.selectedCustomer.entity
		})) );
		promises.push( $q.when(organization.fetch()) );

		$q.all(promises).then(function(results) {
			$scope.selectedCustomer.expenses = results[0];
			var org = results[1];
			var fiscalMonth = org.get('fiscalYearStart');
			var count = getrotateCount(fiscalMonth);
			var invTotal = 0;
			var expTotal = 0;
			var monthlyIncome  = [0,0,0,0,0,0,0,0,0,0,0,0];
			var monthlyExpense  = [0,0,0,0,0,0,0,0,0,0,0,0];
			var colors = ['#0ea81c', '#c31e1e'];
			var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY',
				'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

			$scope.selectedCustomer.invoices
			.forEach(function(inv) {
				var index = inv.entity.invoiceDate.getMonth();
				monthlyIncome[index] += inv.entity.total;
				invTotal += inv.entity.total;
			});

			$scope.selectedCustomer.expenses
			.forEach(function(exp) {
				var index = exp.entity.expanseDate.getMonth();
				monthlyExpense[index] += exp.entity.amount;
				expTotal += exp.entity.amount;
			});

			months.rotate(count);
			monthlyIncome.rotate(count);
			monthlyExpense.rotate(count);
			$scope.totalIncome =  currencyFilter(invTotal, '$', 2);
			$scope.totalExpense = currencyFilter(expTotal, '$', 2);

			var ctx = $("#barchart");
			var myChart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: months,
					datasets: [{
						backgroundColor: colors[0],
						data: monthlyIncome
					}, {
						backgroundColor: colors[1],
						data: monthlyExpense
					}]
				},
				options: {
					responsive: false,
					legend: {
						display: false
					},
					scales: {
						xAxes: [{
							gridLines: {
								display : false
							}
						}],
						yAxes: [{
							gridLines: {
								display : false
							},
							ticks: {
								beginAtZero:true
							}
						}]
					}
				}
			});
		});

	}

	var isGoTo = {
		details : function(to){
			return to.endsWith('details');	
		},
		customers : function(to){ 
			return to.endsWith('customers');
		},
		edit : function(to){
			return to.endsWith('edit');
		},
		newCustomer : function(to){
			return to.endsWith('new');	
		}
	}

	$scope.setShippingAddress = function(){
		if ($scope.selectedCustomer && !$scope.shipping.setShippingTheSame) {
			$scope.shippingAddressEdit = 
				$scope.shipping.tempShippingAddress;
			return;
		}
		if ($scope.selectedCustomer) {
			$scope.shipping.tempShippingAddress = 
				$scope.shippingAddressEdit;

			$scope.shippingAddressEdit = 
				$.extend(true,{},$scope.billingAddressEdit);
		}
	}

	$scope.saveSelectedCustomer = function(){
		// billing address may be filled after checking the same as box
		if ($scope.selectedCustomer && $scope.shipping.setShippingTheSame) {
			$scope.shippingAddressEdit = 
				$.extend(true,{},$scope.billingAddressEdit);
		}

		var selected = $scope.selectedCustomer;

		selected.billingAddressJSON = $scope.billingAddressEdit;
		selected.shippingAddressJSON = $scope.shippingAddressEdit;

		$scope.selectedCustomerEdit.billingAddress = 
			JSON.stringify(selected.billingAddressJSON);

		$scope.selectedCustomerEdit.shippingAddress = 
			JSON.stringify(selected.shippingAddressJSON);

		for (var property in $scope.selectedCustomerEdit) {
			if (appFields.customer.some(function(el){
				return property == el;
			}))
	  		selected.entity[property] = 
	  			$scope.selectedCustomerEdit[property];
		}

		selected.save().then(function(){
			selected.billingAddress = formBillingAddress(selected.entity.billingAddress);
			$scope.selectedCustomerEdit = null;
			$scope.billingAddressEdit = null;
			$scope.shippingAddressEdit = null;
			$state.go('dashboard.customers.details',{customerId:$scope.selectedCustomerId});
		});
	};

	$scope.deleteSelectedCustomer = function(){
		if ($scope.selectedCustomer.invoices &&
			$scope.selectedCustomer.invoices.length) {
			ShowMessage("Customers with invoices involved cannot be deleted!","error");
			return;
		}
		showLoader();
        /*
        //$scope.selectedCustomer.entity.set('isDeleted', true);
        var query = new Parse.Query('Customer');
        query.equalTo('objectId', $scope.selectedCustomer.entity.id);
		$q.when(query.first()).then(function(obj){
            //obj.attributes.isDeleted = true;
            obj.set('isDeleted', true);
            obj.save()
            .then(function(cust){
                $scope.selectedCustomer = null;
                $scope.customers
                .splice($scope.selectedCustomerId,1);
                $scope.selectedCustomerId = null;
                hideLoader();
                $state.go('dashboard.customers.all');
            });
			
		});
        */
	}

	$scope.changeStatus = function(status) {
		showLoader();
		$scope.selectedCustomer.entity.set('status',status);
		$scope.selectedCustomer.entity.save()
		.then(function(cust){
			hideLoader();
		},function(er){
			console.log(er.message);
		});
	}

	$scope.cancelSaveSelectedCustomer = function(){
		$scope.selectedCustomerEdit = null;
		$state.go('dashboard.customers.details',{customerId:$scope.selectedCustomerId});
	}

	var isGoToDetailsWithInvalidCustomerId = function(to,id){
		return to.endsWith('details') && (!isCustomerIdValid(id));
	}

	function LoadCustomers(loadAgain) {
		//showLoader();
		$q.when(coreFactory.getAllCustomers(loadAgain)).then(function(res){
			$scope.customers = res.sort(function(a,b){
				return alphabeticalSort(a.entity.displayName,b.entity.displayName);
			});
			return $q.when(coreFactory.getAllInvoices({
				method 	: 'containedIn',
				name 	: 'customer',
				val1 	: res.map(function(el){
					return el.entity;
				})
			}));

		}).then(function(invoices){
			
			var customersNum = $scope.customers.length;

			$scope.customers.forEach(function(cust){
				cust.invoices = invoices.filter(function(inv){
					return inv.entity.get('customer').id == cust.entity.id;
				});
				cust.comments = 
				cust.invoices.reduce(function(res,cur){
					return res.concat(cur.comments);
				},[]);
			});

			if (isGoTo.details($state.current.name)) {
				doSelectCustomerIfValidId(customerId);
			}
			else if (isGoTo.edit($state.current.name)) {
				doSelectCustomerIfValidId(customerId);
				doCreateEditObject();
			}
			hideLoader();

		});
	};

	$scope.deleteContact = function(index){
		showLoader();
		$scope.selectedCustomer.contactPersons[index]
		.destroy($scope.selectedCustomer)
		.then(function(res){
			$scope.selectedCustomer.contactPersons.splice(index,1);
			$scope.$apply();
			hideLoader();
		},function(err){
			console.log(err.message);
		});
	}

	$scope.editContact = function(contactPerson,index){

		var selectedContact = contactPerson;

		$scope.selectedCustomer.contactPersons[index] = angular.copy(selectedContact);

		var modalInstance = $uibModal.open({
			animation 		: true,
			templateUrl 	: 'modal-contact',
			controller 		: 'ModalContactController',
			windowClass 	: 'modalWindow fade in',
			backdropClass 	: 'popup-modal show fade in',
			backdrop 		: true,
			resolve 		: {
				title 	: function() {
					return 'Edit Contact Person';
				},
				contact : function() {
					return selectedContact;
				},
				customer : function() {
					return $scope.selectedCustomer;
				}
			}
		});

		modalInstance.result.then(function(contact){
			$scope.selectedCustomer.contactPersons[index] = contact;
		},function() {
			console.log('dismiss modal');
		});
	}

	function autoFormatTelephoneNumbers () {
		/*
		$('#workPhone').mask('0 (000) 000-0000',{
			onKeyPress : function(cep,e,field,options){
				var masks = ['0 (000) 000-0000','(000) 000-0000'];
				var cond = cep.replace("(","");
				var mask = (!cep.length||cep[0] == "1") ? masks[0] : masks[1];
				$('#workPhone').mask(mask,options);
			}
		});*/
		var obj = {
			translation:  {
				'Z': {pattern: /[1]/, optional: true},
				'Y': {pattern: /[0-02-9]/}
			}
		}
		$('#workPhone').mask('Z (Y00) 000-0000', obj);
		$('#mobilePhone').mask('Z (Y00) 000-0000', obj);
		$('#billFax').mask('Z (Y00) 000-0000', obj);
		$('#shipFax').mask('Z (Y00) 000-0000', obj);

	}

	$scope.createContact = function(){
		var modalInstance = $uibModal.open({
			animation 		: true,
			templateUrl 	: 'modal-contact',
			controller 		: 'ModalContactController',
			backdropClass 	: 'popup-modal show fade in',
			windowClass 	: 'modalWindow fade in',
			backdrop 		: true,
			resolve 		: {
				title 	: function() {
					return 'Add Contact Person';
				},
				contact : function() {
					console.log('Resolve Contact');
					var ContactPerson = Parse.Object.extend('ContactPerson');
					var contactObject = new contactPersonFactory(new ContactPerson());
					contactObject.entity.set('userID',user.entity[0]);
					return contactObject;
				},
				customer : function() {
					return $scope.selectedCustomer;
				}
			}
		});

		modalInstance.result.then(function(contact){
			$scope.selectedCustomer.contactPersons.push(contact);

		},function() {
			console.log('dismiss modal');
		});
	}

	$rootScope.$on('$viewContentLoaded',
		function(event){
			if (isGoTo.edit($state.current.name) || isGoTo.newCustomer($state.current.name)) {
				autoFormatTelephoneNumbers();
			}
		});

	var stateChangeEvent = $rootScope.$on('$stateChangeStart',
	function(event,toState,toParams,fromState,fromParams,options){
	//	console.log('here');
		if (isGoTo.customers(toState.name) ||
			isGoTo.newCustomer(toState.name)) {
			$scope.selectedCustomer = null;
			$scope.selectedCustomerId = null;
		}
		else if (isGoTo.details(toState.name)) {
			if (isNaN(parseInt(toParams.customerId)) && 
				fromState.name.endsWith('new')) {
				event.preventDefault();
				return;
			}
			doSelectCustomerIfValidId(parseInt(toParams.customerId));
		}
		else if (isGoTo.edit(toState.name)) {
			doSelectCustomerIfValidId(parseInt(toParams.customerId));
			doCreateEditObject();

		} else if (fromState.name.endsWith('new')) {
			LoadCustomers(true);
		} else if (!toState.name.includes('customers')) {
		//	console.log('destroy else');
			stateChangeEvent();
			stateChangeEvent = null;
		}
	});

	LoadCustomers();
});