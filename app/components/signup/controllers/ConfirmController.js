'use strict';

invoicesUnlimited.controller('ConfirmController',['$scope','$state','userFullFactory','signUpFactory',
	function($scope,$state,userFullFactory,signUpFactory){
	
	if (!userFullFactory.authorized())
		$state.go('signup');

	$scope.getStarted = function(){
		$state.go('dashboard');
	}
}]);
