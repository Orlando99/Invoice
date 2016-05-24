'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$state,userFactory,customerFactory,coreFactory,$controller,$q){

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

	$q.all([coreFactory.getAllCustomers()]).then(function(res){
		res[0].forEach(function(elem){
			$scope.customers.push(elem);
		});
	});

});