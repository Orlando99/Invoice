'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('SettingsController',['$scope','$state','userFactory',
	function($scope,$state,userFactory){

	if (!userFactory.authorized()) $state.go('login');

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

	$scope.logOut = function(){
		userFactory.logout(function(){
			$state.go('login');
		});
	};
	
}]);
