'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory',
	function($scope,$state,userFactory){

	if (!userFactory.authorized()) $state.go('login');

	userFactory.loadAll();

	$scope.BusinessInfo = {
		company : userFactory.get("BusinessInfo","businessName")
	}

	$scope.logOut = function(){
		userFactory.logout(function(){
			$state.go('login');
		});
	};

	$scope.$watch(function(){return userFactory.get("BusinessInfo");},
		function(newValue,oldValue){
			if (!newValue) return;
			$scope.BusinessInfo.company = newValue.get("businessName");
		});
	
}]);
