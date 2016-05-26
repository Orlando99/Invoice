'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$rootScope,$state,userFactory,
			 customerFactory, invoicesFactory,
			 coreFactory,$controller,$q){

	var customerId = parseInt($state.params.customerId);
	
	var def = $q.defer();

	$controller('DashboardController',{$scope:$scope,$state:$state});

	var user = userFactory.authorized();
	$scope.selectedCustomer;
	$scope.customers = [];

	var formBillingAddress = function(obj){
		return obj.Street + "\n" +
        obj.City + "\n" +
        obj["State\/Province"] + "\n" +
        obj["Zip\/Postal Code"] + "\n" +
        obj.Country;
	}

	var doSelectCustomerIfValidId = function(id){
		if (id >= 0 && id < $scope.customers.length) {
			selectCustomer($scope.customers[id]);
		}
	}

	var selectCustomer = function(item){
		$scope.selectedCustomer = item;
		
		if (!$scope.selectedCustomer.entity.billingAddress) return;
		
		var billingAddress = JSON.parse($scope.selectedCustomer.entity.billingAddress);
		
		var addressText = formBillingAddress(billingAddress);
			
        $scope.selectedCustomer.billingAddress = addressText;
	}

	$rootScope.$on('$stateChangeStart',
	function(event,toState,toParams,fromState,fromParams,options){
		var customerId;
		if (toParams.customerId) customerId = parseInt(toParams.customerId);
		if (fromState.name == 'dashboard.customers.details' &&
			toState.name == 'dashboard.customers.all') {
			$scope.selectedCustomer = null;
		}
		else if (toState.name == 'dashboard.customers.details' &&
				 (customerId < 0 || customerId > $scope.customers.length)) {
			event.preventDefault();
			$state.go('dashboard.customers.all');
		}

		doSelectCustomerIfValidId(customerId);

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
		debugger;
		if ($state.current.name == 'dashboard.customers.details' &&
			(customerId < 0 || customerId > $scope.customers.length)) {
			$state.go('dashboard.customers.all');
		} else doSelectCustomerIfValidId(customerId);
	});

});