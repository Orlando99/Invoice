'use strict';

invoicesUnlimited.factory('cleanDataService', ['businessFactory', 'coreFactory', 'userFactory',
	'projectUserFactory', 'roleFactory', 'currencyFactory', 'organizationFactory', 'preferencesFactory',
	'accountFactory', 'principalFactory', 'signatureFactory',
function(businessFactory,coreFactory,userFactory,projectUserFactory,roleFactory,currencyFactory,
	organizationFactory,preferencesFactory,accountFactory,principalFactory,signatureFactory){

return {
	clearAllOnLogOut : function() {
		businessFactory.clearAllOnLogOut();
		coreFactory.clearAllOnLogOut();
		userFactory.clearAllOnLogOut();
		projectUserFactory.clearAllOnLogOut();
		roleFactory.clearAllOnLogOut();
		currencyFactory.clearAllOnLogOut();
		organizationFactory.clearAllOnLogOut();
		preferencesFactory.clearAllOnLogOut();
		accountFactory.clearAllOnLogOut();
		principalFactory.clearAllOnLogOut();
		signatureFactory.clearAllOnLogOut();
	}
};

}]);