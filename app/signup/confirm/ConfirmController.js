'use strict';

invoicesUnlimited.controller('ConfirmController',['$scope','$state','userFactory','signUpFactory',
	function($scope,$state,userFactory,signUpFactory){
	
	if (!userFactory.authorized() && signUpFactory.get('User','email') == '')
		$state.go('signup');

	$scope.getStarted = function(){
		$state.go('dashboard');
	}
}]);
