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

	businessFactory.then(function(busObj){
		//businessInfo = busObj;
		$scope.$apply(function(){
			//$scope.BusinessInfo.company = businessInfo.get("businessName");
			$scope.businessInfo = busObj;
		});
	})

	/*userFactory.loadAll(function(state){
		if (state) $state.go(state);
		else {
			$scope.$apply(function(){
				$scope.BusinessInfo.company = userFactory.get("BusinessInfo","businessName");
			});
		} 
	});*/

	$scope.BusinessInfo = {
		company : ""
	}

	$scope.settings = {};

	$scope.logOut = function(){
		userFactory.logout().then(function(){
			resetColorTheme();
			$state.go('login');
		});
	};
	
}]);
