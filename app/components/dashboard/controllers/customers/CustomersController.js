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
			 contactPersonFactory, customerFactory, coreFactory, 
			 invoicesFactory ,$controller,$q){

	var customerId = parseInt($state.params.customerId);
	var user = userFactory;
	
	if (!user.entity.length) {
		$state.go('login');
		return;
	}
	
	var def = $q.defer();
	$controller('DashboardController',{$scope:$scope,$state:$state});

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

		var selected = $scope.selectedCustomer;

		selected.billingAddressJSON = $scope.billingAddressEdit;
		selected.shippingAddressJSON = $scope.shippingAddressEdit;

		$scope.selectedCustomerEdit.billingAddress = 
			JSON.stringify(selected.billingAddressJSON);

		$scope.selectedCustomerEdit.shippingAddress = 
			JSON.stringify(selected.shippingAddressJSON);

		for (var property in $scope.selectedCustomerEdit) {
			if (selected.customerFields.some(function(el){
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
			ShowMessage("Customer with invoices involved cannot be deleted!","error");
			return;
		}
		showLoader();
		$q.when($scope.selectedCustomer.destroy()).then(function(){
			$scope.selectedCustomer = null;
			$scope.customers
			.splice($scope.selectedCustomerId,1);
			$scope.selectedCustomerId = null;
			hideLoader();
			$state.go('dashboard.customers.all');
		})
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

			if (isGoTo.details($state.current.name))
				doSelectCustomerIfValidId(customerId);
			else if (isGoTo.edit($state.current.name)) {
				doSelectCustomerIfValidId(customerId);
				doCreateEditObject();
			}
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
					contactObject.entity.set('userID',user);
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
			if (isGoTo.edit($state.current.name)) {
				var mobileOptions = {
					onKeyPress : function(cep,e,field,options){
						var masks = ['9 (999) 999-9999','(999) 999-9999'];
						var mask = cep[0] == "1" ? masks[0] : masks[1];
						$('#mobilePhone').mask(mask,options);
					}
				}
				$('#workPhone').mask('(999) 999-9999');
				$('#mobilePhone').mask('9 (999) 999-9999',mobileOptions);
			}
		});

	var stateChangeEvent = $rootScope.$on('$stateChangeStart',
	function(event,toState,toParams,fromState,fromParams,options){
		console.log('here');
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
			console.log('destroy else');
			stateChangeEvent();
			stateChangeEvent = null;
		}
	});

	LoadCustomers();
});