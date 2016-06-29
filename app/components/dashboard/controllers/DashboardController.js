'use strict';

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory','businessFactory','$q',
	function($scope,$state,userFactory,businessFactory,$q){

	showLoader();

	var user = userFactory;
	var business = businessFactory;
	
	if (!user.entity.length) {
		hideLoader();
		$state.go('login');
		return;
	}
	
	loadColorTheme(user);
	
	$scope.businessInfo = businessFactory.entity.length ?
						  businessFactory.entity[0] :
						  {};

	$scope.logOut = function(){
		user.logout().then(function(){
			resetColorTheme();
			$state.go('login');
		});
	};

	$q
	.all([businessFactory.load()])
	.then(function(obj){
		if (obj.length && obj[0]) {
			$scope.businessInfo = obj[0].entity[0];
			hideLoader();
		} else $scope.logOut();			
	});

}]);
