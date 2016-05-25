'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$rootScope,$state,userFactory,customerFactory,coreFactory,$controller,$q){

	var customerId = parseInt($state.params.customerId);
	
	var def = $q.defer();

	$controller('DashboardController',{$scope:$scope,$state:$state});

	var user = userFactory.authorized();
	$scope.selectedCustomer;
	$scope.customers = [];

	$scope.selectCustomer = function(item){
		$scope.selectedCustomer = item;
		if (!$scope.selectedCustomer.entity.billingAddress) return;
		var billingAddress = JSON.parse($scope.selectedCustomer.entity.billingAddress);
		var addressText =
			billingAddress.Street + "\n" +
            billingAddress.City + "\n" +
            billingAddress["State\/Province"] + "\n" +
            billingAddress["Zip\/Postal Code"] + "\n" +
            billingAddress.Country;
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

		if (customerId >= 0 && customerId < $scope.customers.length) {
			$scope.selectedCustomer = $scope.customers[customerId];
		}

	});

	$q.all([coreFactory.getAllCustomers()]).then(function(res){
		res[0].forEach(function(elem){
			$scope.customers.push(elem);
		});

		$scope.customers.sort(function(a,b){
			var dispA = a.entity.displayName;
			var dispB = b.entity.displayName;
			return (dispA < dispB) ? -1 : (dispA > dispB) ? 1 : 0;
		});

		if ($state.current.name == 'dashboard.customers.details' &&
			(customerId < 0 || customerId > $scope.customers.length)) {
			$state.go('dashboard.customers.all');
		} else if (customerId >= 0 && customerId < $scope.customers.length) {
			$scope.selectedCustomer = $scope.customers[customerId];
		}
	});

});