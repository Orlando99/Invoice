'use strict';

invoicesUnlimited.controller('ConfirmController',
	['$scope','$state','userFullFactory','signUpFactory',
	function($scope,$state,userFullFactory,signUpFactory){
	
	var user = signUpFactory.getFactory('User');

	if (!user.entity.length) $state.go('signup');

	$scope.getStarted1 = goNext; 
        
    function goNext(){
		if (signUpFactory.getFactory('User').entity.length){
            if(!signUpFactory.getFactory('User').entity[0].get('tutorial'))
                $state.go('signup.invoiceTemplateInfo');
            else
                $state.go('dashboard');
        }
			
	}
}]);
