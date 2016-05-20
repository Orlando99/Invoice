'use strict';

invoicesUnlimited.controller('CustomersController',
	function($scope,$state,userFactory,customerFactory,$controller,$q){
	
	var def = $q.defer();

	$controller('DashboardController',{$scope:$scope,$state:$state});

	var user = userFactory.authorized();

});