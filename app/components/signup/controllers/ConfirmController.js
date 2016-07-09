'use strict';

invoicesUnlimited.controller('ConfirmController',
	['$scope','$state','userFullFactory','signUpFactory',
	function($scope,$state,userFullFactory,signUpFactory){
	
	var user = signUpFactory.getFactory('User');

	if (!user.entity.length) $state.go('signup');

	$scope.getStarted = function(){
		debugger;
		if (signUpFactory.getFactory('User').entity.length)
			$state.go('dashboard');
	}
}]);
