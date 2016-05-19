'use strict';

invoicesUnlimited.factory('principalFactory',['userFactory',function(userFactory){
	
	var user = userFactory.authorized();

	if (!user) return undefined;

	var principalInfo;

	if (!principalInfo) {
		var fieldName = "principalInfo";
		var princ_p = user.get(fieldName);
		principalInfo = princ_p.fetch().then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user,
				fields 		: null
			});
			return object;
		});
	}

	return principalInfo;

}]);