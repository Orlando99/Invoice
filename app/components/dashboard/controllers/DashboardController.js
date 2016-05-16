'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory',
	function($scope,$state,userFactory){

	var user = userFactory.authorized();

	if (!userFactory.authorized()) $state.go('login');
	else loadColorTheme(user);

	userFactory.loadAll(function(state){
		if (state) $state.go(state);
		else {
			$scope.$apply(function(){
				$scope.BusinessInfo.company = userFactory.get("BusinessInfo","businessName");
			});
		} 
	});

	$scope.BusinessInfo = {
		company : userFactory.get("BusinessInfo","businessName")
	}

	$scope.settings = {};

	$scope.logOut = function(){
		userFactory.logout(function(){
			resetColorTheme();
			$state.go('login');
		});
	};
	
}]);
