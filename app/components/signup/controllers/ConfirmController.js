'use strict';

invoicesUnlimited.controller('ConfirmController',
	['$scope','$state','userFullFactory','signUpFactory',
	function($scope,$state,userFullFactory,signUpFactory){
	
	var user = signUpFactory.getFactory('User');

	if (!user.entity.length) $state.go('signup');

	$scope.getStarted1 = goNext; 
        
    function goNext(){
		if (signUpFactory.getFactory('User').entity.length)
			$state.go('signup.invoiceTemplateInfo');
	}
}]);
