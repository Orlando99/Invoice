'use strict';

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory','businessFactory','$q',
	function($scope,$state,userFactory,businessFactory,$q){

	var user = userFactory.authorized();
	if (!userFactory.authorized()) $state.go('login');
	
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
