'use strict';

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory','businessFactory','$q',
	function($scope,$state,userFactory,businessFactory,$q){

	var user = userFactory;
	var business = businessFactory;
	if (!user) $state.go('login');
	if (user && !business) user.logout().then(function(){
		$state.go('login');
	});
	
	loadColorTheme(user);
	$scope.businessInfo = {};

	$scope.logOut = function(){
		userFactory.logout().then(function(){
			resetColorTheme();
			$state.go('login');
		});
	};

	$q.all([businessFactory]).then(function(obj){
		$scope.businessInfo = obj[0];
	});	
}]);
