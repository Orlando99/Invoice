'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$rootScope,$state,$uibModal,userFactory,
			 contactPersonFactory, customerFactory, coreFactory, 
			 invoicesFactory ,$controller,$q){

	var customerId = parseInt($state.params.customerId);
	var user = userFactory;
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

	function LoadCustomers() {
		$q.when(coreFactory.getAllCustomers()).then(function(res){
		
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
				var filtered = invoices.filter(function(inv){
					return inv.entity.get('customer').id == cust.entity.id;
				});
				cust.comments = [];
				filtered.forEach(function(inv){
					cust.comments = cust.comments.concat(inv.comments);
				});
				cust.invoices = filtered;
			});

			if (isGoTo.details($state.current.name))
				doSelectCustomerIfValidId(customerId);
			else if (isGoTo.edit($state.current.name)) {
				doSelectCustomerIfValidId(customerId);
				doCreateEditObject();
			}
		});
	};

	$scope.createContact = function(){
		var modalInstance = $uibModal.open({
			animation 		: true,
			templateUrl 	: 'modal-contact',
			controller 		: 'ModalContactController',
			backdropClass 	: 'popup-modal show fade in',
			windowClass 	: 'modalWindow fade in',
			backdrop 		: true,
			resolve 		: {
				contact : function() {
					console.log('Resolve Contact');
					var ContactPerson = Parse.Object.extend('ContactPerson');
					var contactObject = new contactPersonFactory(new ContactPerson());
					contactObject.entity.set('userID',user);
					return contactObject;
				},
				customer : function() {
					console.log('Resolve customer');
					return $scope.selectedCustomer;
				}
			}
		});

		modalInstance.result.then(function(contact){

			$scope.selectedCustomer.contactPersons.push(contact);

			/*$selectedCustomer.contactPersons.some(function(el,index){
				if (el.id != contact.id) return false;
				$selectedCustomer.contactPersons[index] = contact;
				return true;
			});*/

		},function() {
			console.log('dismiss modal');
		});
	}

	$rootScope.$on('$stateChangeStart',
	function(event,toState,toParams,fromState,fromParams,options){
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
			LoadCustomers();
		}
	});

	LoadCustomers();


});