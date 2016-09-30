'use strict';

invoicesUnlimited.controller('AccountActController',
	['$scope','$state','userFullFactory','signUpFactory',
	function($scope,$state,userFullFactory,signUpFactory){
	
	var user = signUpFactory.getFactory('User');

	if (!user.entity.length) $state.go('signup');

	$scope.goNext = function(){
		if (signUpFactory.getFactory('User').entity.length)
			$state.go('signup.merchantAccount');
	}
}]);
