'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$rootScope,$state,userFactory,
			 customerFactory, coreFactory, 
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
		return obj.Street + "\n" +
        obj.City + "\n" +
        obj["State\/Province"] + "\n" +
        obj["Zip\/Postal Code"] + "\n" +
        obj.Country;
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

	var selectCustomer = function(item){
		$scope.selectedCustomer = item;
		var obj = $scope.selectedCustomer.entity;
		if (!obj.billingAddress) return;
		
		var billingAddress = JSON.parse(obj.billingAddress);
		var shippingAddress = obj.shippingAddress ? JSON.parse(obj.shippingAddress) : {};

	    $scope.selectedCustomer.billingAddress = formBillingAddress(billingAddress);;
	    $scope.selectedCustomer.billingAddressJSON = billingAddress;
	    $scope.selectedCustomer.shippingAddress = shippingAddress;
	}

	var goTo = {
		details : function(to){
			return to.endsWith('details');	
		},
		customers : function(to){ 
			return to.endsWith('customers');
		},
		edit : function(to){
			return to.endsWith('edit');
		}
	}

	$scope.setShippingAddress = function(){
		if ($scope.selectedCustomer && !$scope.shipping.setShippingTheSame) {
			$scope.selectedCustomer.shippingAddress = $scope.shipping.tempShippingAddress;
			return;
		}
		$scope.shipping.tempShippingAddress = $scope.shippingAddress;
		if ($scope.selectedCustomer)
			$scope.selectedCustomer.shippingAddress = 
			$.extend(true,{},$scope.selectedCustomer.billingAddressJSON);
	}

	var goToDetailsWithInvalidCustomerId = function(to,id){
		return to.endsWith('details') && (!isCustomerIdValid(id));
	}

	$rootScope.$on('$stateChangeStart',
	function(event,toState,toParams,fromState,fromParams,options){
		if (goTo.customers(toState.name)) {
			$scope.selectedCustomer = null;
			$scope.selectedCustomerId = null;
		}
		else if (goTo.details(toState.name)) {
			doSelectCustomerIfValidId(parseInt(toParams.customerId));
		}
		else if (goTo.edit(toState.name)) {
			doSelectCustomerIfValidId(parseInt(toParams.customerId));
		}
	});

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

		if (goTo.details($state.current.name)||
			goTo.edit($state.current.name)) 
			doSelectCustomerIfValidId(customerId);
	});

});