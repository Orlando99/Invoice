'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$rootScope,$state,userFactory,customerFactory,coreFactory,$controller,$q){

	if ($state.current.name == 'dashboard.customers.details') {
		$state.go('dashboard.customers.all');
	}
	
	var def = $q.defer();

	$controller('DashboardController',{$scope:$scope,$state:$state});

	var user = userFactory.authorized();
	$scope.selectedCustomer;
	$scope.customers = [];

	$scope.selectCustomer = function(item){
		$scope.selectedCustomer = item;
	}

	$rootScope.$on('$stateChangeStart',
	function(event,toState,toParams,fromState,fromParams,options){
		if (fromState.name == 'dashboard.customers.details' &&
			toState.name == 'dashboard.customers.all') {
			$scope.selectedCustomer = null;
		}
		else if (toState.name == 'dashboard.customers.details' &&
				 !$scope.selectedCustomer) {
			event.preventDefault();
			$state.go('dashboard.customers.all');
		}
	});

	$q.all([coreFactory.getAllCustomers()]).then(function(res){
		res[0].forEach(function(elem){
			$scope.customers.push(elem);
		});
	});

});