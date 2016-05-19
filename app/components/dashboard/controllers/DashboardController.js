'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory','businessFactory',
	function($scope,$state,userFactory,businessFactory){

	var user = userFactory.authorized();
	$scope.businessInfo = {};

	if (!userFactory.authorized()) $state.go('login');
	else loadColorTheme(user);

	if (!businessFactory.id) {
		businessFactory.then(function(busObj){
			$scope.businessInfo = busObj;
		});
	}

	$scope.settings = {};

	$scope.logOut = function(){
		userFactory.logout().then(function(){
			resetColorTheme();
			$state.go('login');
		});
	};
	
}]);
