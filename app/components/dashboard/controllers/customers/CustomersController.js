'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$state,userFactory,customerFactory,coreFactory,$controller,$q){
	
	var def = $q.defer();

	$controller('DashboardController',{$scope:$scope,$state:$state});

	var user = userFactory.authorized();
	$scope.customers = [];

	$q.all([coreFactory.getAllCustomers()]).then(function(res){
		res[0].forEach(function(elem){
			$scope.customers.push(elem);
		});
	});

});