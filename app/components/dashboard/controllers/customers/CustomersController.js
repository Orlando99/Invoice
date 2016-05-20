'use strict';

invoicesUnlimited.controller('CustomersController',function($scope,$state,userFactory,$controller){
	
	$controller('DashboardController',{$scope:$scope,$state:$state});

});