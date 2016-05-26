'use strict';

invoicesUnlimited.controller('EstimateController',['$scope', '$state', '$controller',
	'userFullFactory', 'estimateFactory',
	function($scope,$state,$controller,userFullFactory,estimateFactory){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
	loadColorTheme(user);

	showLoader();
	var promise = estimateFactory.getEstimates(user);
	promise.then(function(estimates) {
		console.log(estimates);
		$scope.estimates = estimates;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});

}]);