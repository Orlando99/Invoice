'use strict';

invoicesUnlimited.controller('SignatureController',['$scope','$state','userFactory','signUpFactory',
	function($scope,$state,userFactory,signUpFactory){
	
	if (userFactory.authorized()){
		var businessInfo = userFactory.getBusinessInfo();
		var principalInfo = userFactory.getPrincipalInfo();
		var accountInfo = userFactory.getAccountInfo();

		if (businessInfo) {
			if (principalInfo) {
				if (!accountInfo) $state.go('signup.account-info');
			} else $state.go('signup.principal-info');
		} else {
			userFactory.logout();
			$state.go('signup');
		}
	} else $state.go('signup');

}]);
