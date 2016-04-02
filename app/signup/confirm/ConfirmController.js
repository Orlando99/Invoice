'use strict';

invoicesUnlimited.controller('ConfirmController',['$scope','$state','userFactory','signUpFactory',
	function($scope,$state,userFactory,signUpFactory){
	
	if (!userFactory.authorized())
		$state.go('signup');

	$scope.getStarted = function(){
		$state.go('dashboard');
	}
}]);
