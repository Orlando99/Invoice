'use strict';

invoicesUnlimited.factory('cleanDataService', ['businessFactory', 'coreFactory',
	'projectUserFactory', 'roleFactory', 'currencyFactory', 'organizationFactory', 'preferencesFactory',
	'accountFactory', 'principalFactory', 'signatureFactory',
function(businessFactory,coreFactory,projectUserFactory,roleFactory,currencyFactory,
	organizationFactory,preferencesFactory,accountFactory,principalFactory,signatureFactory){

return {
	clearAllOnLogOut : function() {
		businessFactory.clearAllOnLogOut();
		coreFactory.clearAllOnLogOut();
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