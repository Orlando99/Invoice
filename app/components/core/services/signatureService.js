'use strict';

invoicesUnlimited.factory('signatureFactory',['userFactory',function(userFactory){
	
	var user = userFactory.authorized();

	if (!user) return undefined;

	var principalInfo, fields;

	if (!principalInfo) {
		var fieldName = "signatureImage";
		var princ_p = user.get(fieldName);
		principalInfo = princ_p.fetch().then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user,
				fields 		: fields});
			return object;
		});
	}

	return principalInfo;

}]);