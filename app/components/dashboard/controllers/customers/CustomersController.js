'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$rootScope,$state,userFactory,
			 customerFactory, invoicesFactory,
			 coreFactory,$controller,$q){

	var customerId = parseInt($state.params.customerId);
	var user = userFactory.authorized();
	var def = $q.defer();
	$controller('DashboardController',{$scope:$scope,$state:$state});

	$scope.selectedCustomer;
	$scope.customers = [];

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
		if (isCustomerIdValid(id)) selectCustomer($scope.customers[id]);
		else $state.go('dashboard.customers.all');
	}

	var selectCustomer = function(item){
		$scope.selectedCustomer = item;
		if (!$scope.selectedCustomer.entity.billingAddress) return;
		var billingAddress = JSON.parse($scope.selectedCustomer.entity.billingAddress);
	    $scope.selectedCustomer.billingAddress = formBillingAddress(billingAddress);;
	}

	var goToCustomers = function(to){
		return to.endsWith('all');
	}

	var goToDetails = function(to){
		return to.endsWith('details');
	}

	var goToDetailsWithInvalidCustomerId = function(to,id){
		return to.endsWith('details') && (!isCustomerIdValid(id));
	}

	$rootScope.$on('$stateChangeStart',
	function(event,toState,toParams,fromState,fromParams,options){
		if (goToCustomers(toState.name)) $scope.selectedCustomer = null;
		else if (goToDetails(toState.name)) 
			doSelectCustomerIfValidId(parseInt(toParams.customerId));
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
			cust.invoices = filtered;
		});
		
		if ($state.current.name.endsWith('details')) 
			doSelectCustomerIfValidId(customerId);
	});

});